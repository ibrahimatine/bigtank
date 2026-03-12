import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from '@samadal/shared-utils';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginRateLimitService } from './login-rate-limit.service';
import { NotificationService } from '../notification/notification.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loginRateLimit: LoginRateLimitService,
    private notificationService: NotificationService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing) {
        throw new ConflictException(
          'Ce numéro de téléphone est déjà utilisé',
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Token de verification email
    const emailVerificationToken = dto.email
      ? crypto.randomBytes(32).toString('hex')
      : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email || null,
        phone: dto.phone || null,
        passwordHash,
        name: dto.name,
        city: dto.city || null,
        region: dto.region || null,
        emailVerificationToken,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        city: true,
        region: true,
        createdAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        details: `Inscription via ${dto.phone ? 'téléphone' : 'email'}`,
      },
    });

    // Envoyer email de verification si email fourni
    if (dto.email && emailVerificationToken) {
      const webUrl = process.env.WEB_URL || 'http://localhost:3000';
      const verifyLink = `${webUrl}/verify-email?token=${emailVerificationToken}`;

      this.notificationService.createAndSend({
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        title: 'Verifiez votre adresse email',
        body: `Cliquez sur le lien pour verifier votre email`,
        data: { verifyLink },
      }).catch(() => {});
    } else {
      this.notificationService.createAndSend({
        userId: user.id,
        type: 'WELCOME',
        title: 'Bienvenue sur Samadal !',
        body: `Bienvenue ${user.name} ! Votre compte a ete cree avec succes.`,
      }).catch(() => {});
    }

    return { message: 'Inscription réussie', user };
  }

  async login(dto: LoginDto, ip?: string) {
    const rateLimitKey = dto.emailOrPhone;
    const isLocked = await this.loginRateLimit.isLocked(rateLimitKey);
    if (isLocked) {
      const remaining = await this.loginRateLimit.getRemainingLockTime(rateLimitKey);
      throw new HttpException(
        `Trop de tentatives. Réessayez dans ${remaining} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isEmail = dto.emailOrPhone.includes('@');
    const identifier = isEmail
      ? dto.emailOrPhone
      : this.normalizePhone(dto.emailOrPhone);
    const user = await this.prisma.user.findUnique({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user || !user.passwordHash) {
      await this.loginRateLimit.recordFailedAttempt(rateLimitKey);
      await this.logLoginAttempt(null, dto.emailOrPhone, ip, false);
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.loginRateLimit.recordFailedAttempt(rateLimitKey);
      await this.logLoginAttempt(user.id, dto.emailOrPhone, ip, false);
      throw new UnauthorizedException('Identifiants invalides');
    }

    await this.loginRateLimit.resetAttempts(rateLimitKey);
    await this.logLoginAttempt(user.id, dto.emailOrPhone, ip, true);

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token invalide');
    }

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub },
    });

    let validToken: (typeof storedTokens)[number] | null = null;
    for (const token of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.token);
      if (isMatch) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Token non trouvé');
    }

    if (validToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: validToken.id },
      });
      throw new UnauthorizedException('Token expiré');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    await this.prisma.refreshToken.delete({
      where: { id: validToken.id },
    });

    return this.generateTokens(user);
  }

  async logout(userId: string, refreshToken: string) {
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });

    for (const token of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.token);
      if (isMatch) {
        await this.prisma.refreshToken.delete({
          where: { id: token.id },
        });

        await this.prisma.auditLog.create({
          data: { userId, action: 'LOGOUT', details: 'Déconnexion' },
        });

        return { message: 'Déconnexion réussie' };
      }
    }

    throw new NotFoundException('Token non trouvé');
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    if (!dto.email && !dto.phone) {
      throw new HttpException(
        'Veuillez fournir un email ou un numero de telephone',
        HttpStatus.BAD_REQUEST,
      );
    }

    const identifier = dto.email
      ? dto.email
      : this.normalizePhone(dto.phone!);
    const user = await this.prisma.user.findUnique({
      where: dto.email ? { email: identifier } : { phone: identifier },
      select: { id: true, email: true, name: true },
    });

    if (!user || !user.email) {
      return { message: 'Si un compte existe avec ces informations, un email de reinitialisation a ete envoye.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const resetLink = `${webUrl}/reset-password?token=${token}`;

    this.notificationService.createAndSend({
      userId: user.id,
      type: 'PASSWORD_RESET',
      title: 'Reinitialisation de mot de passe',
      body: `Cliquez sur le lien pour reinitialiser votre mot de passe`,
      data: { resetLink },
    }).catch(() => {});

    return { message: 'Si un compte existe avec ces informations, un email de reinitialisation a ete envoye.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: dto.token },
    });

    if (!user) {
      throw new HttpException(
        'Lien de reinitialisation invalide ou expire',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: null, passwordResetExpiresAt: null },
      });
      throw new HttpException(
        'Ce lien a expire. Veuillez refaire une demande.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        details: 'Mot de passe reinitialise via lien email',
      },
    });

    return { message: 'Mot de passe reinitialise avec succes' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('Utilisateur non trouve');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGE',
        details: 'Mot de passe modifie depuis le profil',
      },
    });

    return { message: 'Mot de passe modifie avec succes' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new HttpException(
        'Lien de verification invalide ou deja utilise',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        details: `Email ${user.email} verifie`,
      },
    });

    // Envoyer le welcome apres verification
    this.notificationService.createAndSend({
      userId: user.id,
      type: 'WELCOME',
      title: 'Bienvenue sur Samadal !',
      body: `Bienvenue ${user.name} ! Votre email est verifie.`,
    }).catch(() => {});

    return { message: 'Email verifie avec succes' };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user || !user.email) {
      throw new HttpException('Aucun email associe a ce compte', HttpStatus.BAD_REQUEST);
    }

    if (user.emailVerified) {
      return { message: 'Email deja verifie' };
    }

    const newToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: newToken },
    });

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const verifyLink = `${webUrl}/verify-email?token=${newToken}`;

    await this.notificationService.createAndSend({
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
      title: 'Verifiez votre adresse email',
      body: `Cliquez sur le lien pour verifier votre email`,
      data: { verifyLink },
    });

    return { message: 'Email de verification renvoye' };
  }

  private async generateTokens(user: { id: string; email: string | null; phone: string | null; role: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async validateOAuthUser(profile: { email: string | null; name: string; avatarUrl: string | null; provider: string; providerId: string }) {
    // Check if user already exists with this provider
    let user = await this.prisma.user.findFirst({
      where: { provider: profile.provider, providerId: profile.providerId },
    });

    if (!user && profile.email) {
      // Check if email already exists (link accounts)
      user = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (user) {
        // Link OAuth to existing account
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { provider: profile.provider, providerId: profile.providerId, avatarUrl: user.avatarUrl || profile.avatarUrl },
        });
      }
    }

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          provider: profile.provider,
          providerId: profile.providerId,
          emailVerified: !!profile.email,
          phoneVerified: false,
        },
      });

      // Send welcome notification
      try {
        await this.notificationService.createAndSend({
          userId: user.id,
          type: 'WELCOME',
          title: 'Bienvenue sur Samadal !',
          body: `Bienvenue ${user.name} ! Votre compte a ete cree avec succes.`,
        });
      } catch {}
    }

    return this.generateTokens(user);
  }

  private normalizePhone(v: string): string {
    const n = v.replace(/[\s\-\.]/g, '');
    if (n.startsWith('+221')) return n;
    if (n.startsWith('00221')) return '+' + n.slice(2);
    if (/^[0-9]{9}$/.test(n)) return '+221' + n;
    return v;
  }

  private async logLoginAttempt(
    userId: string | null,
    identifier: string,
    ip: string | undefined,
    success: boolean,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId: userId,
        action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        details: `Tentative login: ${identifier}${ip ? ` depuis ${ip}` : ''}`,
      },
    });
  }
}

import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from '@bigtank/shared-utils';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private jwtService: JwtService,
    private configService: ConfigService,
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

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email || null,
        phone: dto.phone || null,
        passwordHash,
        name: dto.name,
        city: dto.city || null,
        region: dto.region || null,
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

    return { message: 'Inscription réussie', user };
  }

  async login(dto: LoginDto) {
    const isEmail = dto.emailOrPhone.includes('@');
    const user = await this.prisma.user.findUnique({
      where: isEmail
        ? { email: dto.emailOrPhone }
        : { phone: dto.emailOrPhone },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

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
        return { message: 'Déconnexion réussie' };
      }
    }

    throw new NotFoundException('Token non trouvé');
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

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
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
}

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { AvatarService } from '../user/avatar.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private avatarService: AvatarService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  googleLogin(@Req() req: any, @Res() res: Response) {
    // Passer le mode (login/register) via le state OAuth
    const mode = req.query.mode || 'login';
    const callbackUrl = this.configService.get('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/api/auth/google/callback';
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=email%20profile&state=${mode}`;
    res.redirect(redirectUrl);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const webUrl = this.configService.get('WEB_URL') || 'http://localhost:3000';
    const mode = req.query.state || 'login';
    try {
      const tokens = await this.authService.validateOAuthUser(req.user, mode);
      res.redirect(`${webUrl}/api/auth/oauth-callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
    } catch (err: any) {
      const message = encodeURIComponent(err.message || 'Erreur de connexion');
      res.redirect(`${webUrl}/${mode === 'register' ? 'register' : 'login'}?error=${message}`);
    }
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    return this.authService.login(dto, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: { id: string },
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.logout(user.id, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.userService.getUserProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade-to-seller')
  @HttpCode(HttpStatus.OK)
  async upgradeToSeller(@CurrentUser() user: { id: string }) {
    return this.userService.upgradeToSeller(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar/presign')
  async avatarPresign(
    @CurrentUser() user: { id: string },
    @Body() body: { contentType: string },
  ) {
    return this.avatarService.generatePresignedUrl(user.id, body.contentType);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar/confirm')
  async avatarConfirm(
    @CurrentUser() user: { id: string },
    @Body() body: { key: string },
  ) {
    return this.avatarService.confirmAvatar(user.id, body.key);
  }
}

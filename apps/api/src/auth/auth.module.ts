import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { LoginRateLimitService } from './login-rate-limit.service';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';

const oauthProviders = [];
if (process.env.GOOGLE_CLIENT_ID) oauthProviders.push(GoogleStrategy);
if (process.env.FACEBOOK_APP_ID) oauthProviders.push(FacebookStrategy);

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('ACCESS_TOKEN_EXPIRY', '15m'),
        },
      }),
    }),
    UserModule,
    NotificationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...oauthProviders, LoginRateLimitService],
  exports: [AuthService],
})
export class AuthModule {}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID') || '',
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET') || '',
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL') || 'http://localhost:4000/api/auth/facebook/callback',
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    } as any);
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any, done: any): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value || null,
      name: `${name.givenName} ${name.familyName}`,
      avatarUrl: photos?.[0]?.value || null,
      provider: 'facebook',
      providerId: profile.id,
    };
    done(null, user);
  }
}

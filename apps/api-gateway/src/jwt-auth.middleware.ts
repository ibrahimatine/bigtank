import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly jwtSecret: string;

  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET doit etre defini dans les variables d\'environnement');
    this.jwtSecret = secret;
  }

  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      try {
        const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;

        // Inject user info into headers for downstream services
        req.headers['x-user-id'] = payload.sub;
        req.headers['x-user-role'] = payload.role;
      } catch {
        // Token invalid — don't inject headers, let downstream handle 401
      }
    }

    next();
  }
}

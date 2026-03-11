import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET doit etre defini dans les variables d\'environnement');
    this.jwtSecret = secret;
  }

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect();
      return false;
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      client.data.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      client.disconnect();
      return false;
    }
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake?.auth?.token;
    if (auth && typeof auth === 'string') {
      return auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    }
    return null;
  }
}

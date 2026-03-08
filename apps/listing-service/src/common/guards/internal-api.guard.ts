import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard qui protege les endpoints internes (service-to-service).
 * Verifie que le header X-Internal-Key correspond a INTERNAL_API_KEY.
 */
@Injectable()
export class InternalApiGuard implements CanActivate {
  private readonly internalKey: string;

  constructor(configService: ConfigService) {
    const key = configService.get<string>('INTERNAL_API_KEY');
    if (!key) throw new Error('INTERNAL_API_KEY doit etre defini dans les variables d\'environnement');
    this.internalKey = key;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerKey = request.headers['x-internal-key'];

    if (!headerKey || headerKey !== this.internalKey) {
      throw new ForbiddenException('Acces refuse : cle interne invalide');
    }

    return true;
  }
}

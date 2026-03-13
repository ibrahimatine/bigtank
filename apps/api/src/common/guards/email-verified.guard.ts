import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard qui bloque l'acces si l'utilisateur a un email non verifie.
 * Les utilisateurs inscrits par telephone (sans email) ne sont pas bloques.
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true; // Pas authentifie — laisse le JwtAuthGuard gerer

    // Si l'utilisateur a un email mais qu'il n'est pas verifie → bloquer
    if (user.email && !user.emailVerified) {
      throw new ForbiddenException(
        'Veuillez verifier votre adresse email avant d\'acceder a la plateforme.',
      );
    }

    return true;
  }
}

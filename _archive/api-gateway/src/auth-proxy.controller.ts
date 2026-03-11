import { All, Controller, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Controller('auth')
export class AuthProxyController {
  private readonly authServiceUrl =
    process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

  constructor(private httpService: HttpService) {}

  @All()
  async proxyRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res);
  }

  @All('*')
  async proxyWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res);
  }

  private async proxy(req: Request, res: Response) {
    // Strip /api/auth prefix to get the sub-path (e.g. /me, /login)
    const subPath = req.originalUrl.replace(/^\/api\/auth/, '') || '';
    const url = `${this.authServiceUrl}/auth${subPath}`;

    try {
      const response = await lastValueFrom(
        this.httpService.request({
          method: req.method as string,
          url,
          data: req.body,
          headers: {
            'content-type': req.headers['content-type'] || 'application/json',
            authorization: req.headers['authorization'] || '',
            'x-user-id': req.headers['x-user-id'] || '',
            'x-user-role': req.headers['x-user-role'] || '',
            'x-forwarded-for': req.ip || '',
          },
          validateStatus: () => true,
        }),
      );

      res.status(response.status).json(response.data);
    } catch {
      res.status(502).json({
        success: false,
        error: "Erreur de connexion au service d'authentification",
      });
    }
  }
}

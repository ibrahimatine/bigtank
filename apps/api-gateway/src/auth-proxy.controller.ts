import { All, Controller, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Controller('auth')
export class AuthProxyController {
  private readonly authServiceUrl =
    process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

  constructor(private httpService: HttpService) {}

  @All('*')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const url = `${this.authServiceUrl}/auth${req.url === '/' ? '' : req.url}`;

    try {
      const response = await lastValueFrom(
        this.httpService.request({
          method: req.method as string,
          url,
          data: req.body,
          headers: {
            'content-type': req.headers['content-type'] || 'application/json',
            authorization: req.headers['authorization'] || '',
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

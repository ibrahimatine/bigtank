import { All, Controller, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Controller('admin')
export class AdminProxyController {
  private readonly adminServiceUrl =
    process.env.ADMIN_SERVICE_URL || 'http://localhost:4007';

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
    const subPath = req.originalUrl.replace(/^\/api\/admin/, '') || '';
    const url = `${this.adminServiceUrl}/admin${subPath}`;

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
        error: 'Erreur de connexion au service admin',
      });
    }
  }
}

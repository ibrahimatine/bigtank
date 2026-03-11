import { All, Controller, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Controller('payments')
export class PaymentProxyController {
  private readonly paymentServiceUrl =
    process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004';

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
    const subPath = req.originalUrl.replace(/^\/api\/payments/, '') || '';
    const url = `${this.paymentServiceUrl}/payments${subPath}`;

    try {
      const response = await lastValueFrom(
        this.httpService.request({
          method: req.method as string,
          url,
          data: req.body,
          params: req.query,
          headers: {
            'content-type': req.headers['content-type'] || 'application/json',
            authorization: req.headers['authorization'] || '',
            'x-user-id': req.headers['x-user-id'] || '',
            'x-user-role': req.headers['x-user-role'] || '',
          },
          validateStatus: () => true,
        }),
      );

      res.status(response.status).json(response.data);
    } catch {
      res.status(502).json({
        success: false,
        error: 'Erreur de connexion au service paiements',
      });
    }
  }
}

import { All, Controller, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Controller('chat')
export class ChatProxyController {
  private readonly chatServiceUrl =
    process.env.CHAT_SERVICE_URL || 'http://localhost:4003';

  constructor(private httpService: HttpService) {}

  @All('*')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const subPath = req.originalUrl.replace(/^\/api\/chat/, '') || '';
    const url = `${this.chatServiceUrl}/chat${subPath}`;

    try {
      const response = await lastValueFrom(
        this.httpService.request({
          method: req.method as string,
          url,
          data: req.body,
          headers: {
            'content-type':
              req.headers['content-type'] || 'application/json',
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
        error: 'Erreur de connexion au service de chat',
      });
    }
  }
}

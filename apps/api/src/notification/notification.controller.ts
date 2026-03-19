import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  @Post('contact')
  @HttpCode(HttpStatus.OK)
  async sendContactMessage(
    @Body() body: { name: string; email: string; subject: string; message: string },
  ) {
    const { name, email, subject, message } = body;
    if (!name || !email || !subject || !message) {
      throw new BadRequestException('Tous les champs sont requis');
    }

    await this.emailService.sendContactMessage(name, email, subject, message);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getNotifications(
    @CurrentUser() user: { id: string },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.notificationService.getNotifications(user.id, {
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(50, Math.max(1, parseInt(limit, 10) || 20)),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    const count = await this.notificationService.getUnreadCount(user.id);
    return { count };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser() user: { id: string },
    @Param('id') notificationId: string,
  ) {
    const result = await this.notificationService.markAsRead(user.id, notificationId);
    if (!result) throw new ForbiddenException('Notification introuvable');
    return result;
  }
}

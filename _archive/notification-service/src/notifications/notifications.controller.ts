import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { InternalApiGuard } from '../common/guards/internal-api.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private requireUser(userId: string | undefined): string {
    if (!userId) throw new ForbiddenException('Non authentifié');
    return userId;
  }

  /**
   * Endpoint interne appele par les autres services pour creer une notification + email.
   * Pas besoin d'auth user — appele service-to-service.
   */
  @Post('send')
  @UseGuards(InternalApiGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAndSend(
    @Body() body: { userId: string; type: string; title: string; body: string; data?: Record<string, unknown> },
  ) {
    return this.notificationsService.createAndSend(body);
  }

  @Get()
  async getNotifications(
    @Headers('x-user-id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const uid = this.requireUser(userId);
    return this.notificationsService.getNotifications(uid, {
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(50, Math.max(1, parseInt(limit, 10) || 20)),
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Headers('x-user-id') userId: string) {
    const uid = this.requireUser(userId);
    const count = await this.notificationsService.getUnreadCount(uid);
    return { count };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Headers('x-user-id') userId: string) {
    const uid = this.requireUser(userId);
    return this.notificationsService.markAllAsRead(uid);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Headers('x-user-id') userId: string,
    @Param('id') notificationId: string,
  ) {
    const uid = this.requireUser(userId);
    const result = await this.notificationsService.markAsRead(uid, notificationId);
    if (!result) throw new ForbiddenException('Notification introuvable');
    return result;
  }
}

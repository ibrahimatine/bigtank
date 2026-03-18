import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EmailService } from './email.service';

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  constructor(
    @Inject('PRISMA') private readonly prisma: PrismaClient,
    private readonly emailService: EmailService,
  ) {}

  async getNotifications(userId: string, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          readAt: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) return null;

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
      select: { id: true, readAt: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  /**
   * Cree une notification IN_APP + envoie un email si l'utilisateur a un email.
   * Appele directement par les autres modules (plus de HTTP).
   */
  async createAndSend(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type as never,
        title: dto.title,
        body: dto.body,
        channel: 'IN_APP',
        data: dto.data ? JSON.parse(JSON.stringify(dto.data)) : undefined,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      try {
        await this.sendEmailByType(dto, user.email, user.name);
      } catch (err) {
        console.error('[notification] Erreur envoi email:', err);
      }
    }

    return notification;
  }

  private async sendEmailByType(
    dto: CreateNotificationDto,
    email: string,
    userName: string,
  ): Promise<void> {
    const data = dto.data || {};

    switch (dto.type) {
      case 'WELCOME':
        await this.emailService.sendWelcome(email, userName);
        break;

      case 'ADMIN_BROADCAST':
        await this.emailService.sendAdminBroadcast(email, userName, dto.title, dto.body);
        break;

      case 'NEW_MESSAGE':
        await this.emailService.sendNewMessage(
          email,
          userName,
          (data.senderName as string) || 'Un utilisateur',
          dto.body,
          (data.conversationId as string) || '',
        );
        break;

      case 'NEW_LISTING_PUBLISHED':
        await this.emailService.sendListingPublished(
          email,
          userName,
          (data.listingTitle as string) || dto.title,
          (data.listingSlug as string) || '',
        );
        break;

      case 'LISTING_SOLD':
        await this.emailService.sendListingSold(
          email,
          userName,
          (data.listingTitle as string) || dto.body,
        );
        break;

      case 'PAYMENT_RECEIVED':
        await this.emailService.sendPaymentSuccess(
          email,
          userName,
          (data.listingTitle as string) || dto.title,
          (data.amount as string) || '',
        );
        break;

      case 'PASSWORD_RESET':
        await this.emailService.sendPasswordReset(
          email,
          userName,
          (data.resetLink as string) || '',
        );
        break;

      case 'EMAIL_VERIFICATION':
        await this.emailService.sendEmailVerification(
          email,
          userName,
          (data.verifyLink as string) || '',
        );
        break;

      case 'LISTING_EXPIRING':
        await this.emailService.sendListingExpiringSoon(
          email,
          userName,
          (data.listingTitle as string) || dto.title,
          (data.daysLeft as number) || 7,
          (data.listingSlug as string) || '',
        );
        break;

      default:
        await this.emailService.send({
          to: email,
          subject: dto.title,
          html: `<p>${dto.body}</p>`,
        });
        break;
    }
  }
}

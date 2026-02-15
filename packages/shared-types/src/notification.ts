import { NotificationType, NotificationChannel } from './common';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channel: NotificationChannel;
  readAt: Date | null;
  createdAt: Date;
}

export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels: NotificationChannel[];
}

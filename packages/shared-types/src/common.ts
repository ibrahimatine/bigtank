export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type Currency = 'XOF';

export enum UserRole {
  USER = 'USER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export enum ListingCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  RESERVED = 'RESERVED',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED',
}

export enum NotificationType {
  WELCOME = 'WELCOME',
  LISTING_SOLD = 'LISTING_SOLD',
  NEW_MESSAGE = 'NEW_MESSAGE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_SENT = 'PAYMENT_SENT',
  LISTING_DELETED_BY_ADMIN = 'LISTING_DELETED_BY_ADMIN',
  NEW_LISTING_PUBLISHED = 'NEW_LISTING_PUBLISHED',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

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
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  RESERVED = 'RESERVED',
  DELETED = 'DELETED',
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTERED = 'COUNTERED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  ESCROW = 'ESCROW',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  WAVE = 'WAVE',
  ORANGE_MONEY = 'ORANGE_MONEY',
  FREE_MONEY = 'FREE_MONEY',
  CARD = 'CARD',
}

export enum PaymentProvider {
  PAYDUNYA = 'PAYDUNYA',
  PAYTECH = 'PAYTECH',
  NABOOPAY = 'NABOOPAY',
}

export enum NotificationType {
  WELCOME = 'WELCOME',
  LISTING_SOLD = 'LISTING_SOLD',
  NEW_OFFER = 'NEW_OFFER',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_SENT = 'PAYMENT_SENT',
  LISTING_DELETED_BY_ADMIN = 'LISTING_DELETED_BY_ADMIN',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

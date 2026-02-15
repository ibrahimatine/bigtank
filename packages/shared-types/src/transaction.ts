import { TransactionStatus, PaymentMethod, PaymentProvider } from './common';

export interface Transaction {
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  amountXof: number;
  commissionXof: number;
  paymentProvider: PaymentProvider;
  paymentRef: string | null;
  paymentMethod: PaymentMethod;
  transferRef: string | null;
  status: TransactionStatus;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InitiatePaymentDto {
  offerId: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentWebhookPayload {
  provider: PaymentProvider;
  paymentRef: string;
  status: 'success' | 'failed' | 'cancelled';
  metadata?: Record<string, unknown>;
}

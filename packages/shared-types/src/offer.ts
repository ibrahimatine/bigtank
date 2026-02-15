import { OfferStatus } from './common';

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amountXof: number;
  status: OfferStatus;
  message: string | null;
  parentOfferId: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOfferDto {
  listingId: string;
  amountXof: number;
  message?: string;
}

export interface CounterOfferDto {
  offerId: string;
  amountXof: number;
  message?: string;
}

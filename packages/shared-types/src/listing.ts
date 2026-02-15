import { ListingCondition, ListingStatus } from './common';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  brand: string;
  model: string;
  sizeEu: number;
  sizeUs: number | null;
  sizeUk: number | null;
  condition: ListingCondition;
  color: string;
  priceXof: number;
  status: ListingStatus;
  locationCity: string;
  locationRegion: string;
  viewsCount: number;
  images: ListingImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingImage {
  id: string;
  listingId: string;
  url: string;
  key: string;
  order: number;
  width: number;
  height: number;
}

export interface CreateListingDto {
  title: string;
  description: string;
  brand: string;
  model: string;
  sizeEu: number;
  sizeUs?: number;
  sizeUk?: number;
  condition: ListingCondition;
  color: string;
  priceXof: number;
  locationCity: string;
  locationRegion: string;
}

export interface ListingFilters {
  brand?: string;
  sizeEuMin?: number;
  sizeEuMax?: number;
  priceMin?: number;
  priceMax?: number;
  condition?: ListingCondition;
  color?: string;
  city?: string;
  region?: string;
  query?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'date' | 'popularity';
  cursor?: string;
  limit?: number;
}

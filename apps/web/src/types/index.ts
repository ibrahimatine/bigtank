import type { ListingCondition } from '@bigtank/shared-types';

export interface SearchFilterState {
  query: string;
  brand: string;
  sizeEuMin: string;
  sizeEuMax: string;
  priceMin: string;
  priceMax: string;
  condition: ListingCondition | '';
  region: string;
  city: string;
  sortBy: 'date' | 'price_asc' | 'price_desc' | 'popularity';
}

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  NEW: 'Neuf',
  LIKE_NEW: 'Comme neuf',
  GOOD: 'Bon etat',
  FAIR: 'Etat correct',
};

export const SORT_OPTIONS = [
  { value: 'date', label: 'Plus recents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix decroissant' },
  { value: 'popularity', label: 'Populaires' },
] as const;

export const POPULAR_BRANDS = [
  'Nike',
  'Adidas',
  'New Balance',
  'Puma',
  'Jordan',
  'Reebok',
  'Timberland',
  'Vans',
  'Converse',
] as const;

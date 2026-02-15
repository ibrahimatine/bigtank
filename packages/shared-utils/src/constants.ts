// Commission
export const COMMISSION_FREE_SALES = 1; // Nombre de ventes gratuites
export const COMMISSION_PER_SALE_XOF = 100; // Commission en FCFA par vente

// Auth
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_LENGTH = 6;

// Listings
export const MAX_IMAGES_PER_LISTING = 10;
export const MAX_IMAGE_SIZE_MB = 5;
export const LISTING_TITLE_MAX_LENGTH = 120;
export const LISTING_DESCRIPTION_MAX_LENGTH = 2000;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Offers
export const OFFER_EXPIRY_HOURS = 48;

// Escrow
export const ESCROW_AUTO_CONFIRM_DAYS = 7; // Auto-confirmer après 7 jours sans action

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;

// Régions du Sénégal
export const SENEGAL_REGIONS = [
  'Dakar',
  'Diourbel',
  'Fatick',
  'Kaffrine',
  'Kaolack',
  'Kédougou',
  'Kolda',
  'Louga',
  'Matam',
  'Saint-Louis',
  'Sédhiou',
  'Tambacounda',
  'Thiès',
  'Ziguinchor',
] as const;

export type SenegalRegion = (typeof SENEGAL_REGIONS)[number];

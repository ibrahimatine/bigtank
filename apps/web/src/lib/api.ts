const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string | number | undefined> },
): Promise<T> {
  const { params, ...fetchOptions } = options || {};

  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...fetchOptions?.headers },
    ...fetchOptions,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || body.message || 'Erreur API');
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

// Types

export interface ListingSearchResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  brand: string;
  model: string;
  sizeEu: number;
  sizeUs: number | null;
  condition: string;
  color: string;
  priceXof: number;
  status: string;
  locationCity: string;
  locationRegion: string;
  viewsCount: number;
  createdAt: number;
}

export interface ListingDetail {
  id: string;
  sellerId: string;
  slug: string;
  title: string;
  description: string;
  brand: string;
  model: string;
  sizeEu: number;
  sizeUs: number | null;
  sizeUk: number | null;
  condition: string;
  color: string;
  priceXof: number;
  status: string;
  locationCity: string;
  locationRegion: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  images: {
    id: string;
    url: string;
    key: string;
    order: number;
    width: number;
    height: number;
  }[];
  seller: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  total?: number;
  cursor: string | null;
  hasMore: boolean;
}

// API functions

export async function searchListings(
  filters: Record<string, string | number | undefined>,
): Promise<PaginatedResult<ListingSearchResult>> {
  return apiFetch<PaginatedResult<ListingSearchResult>>('/listings/search', {
    params: filters,
    next: { revalidate: 60 },
  });
}

export async function getListingBySlug(slug: string): Promise<ListingDetail> {
  return apiFetch<ListingDetail>(`/listings/${slug}`, {
    cache: 'no-store',
  });
}

export async function getRecentListings(
  limit = 8,
): Promise<PaginatedResult<ListingSearchResult>> {
  return apiFetch<PaginatedResult<ListingSearchResult>>('/listings/search', {
    params: { sortBy: 'date', limit },
    next: { revalidate: 60 },
  });
}

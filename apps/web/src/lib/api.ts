import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
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
  // Auth-service wraps responses in { success, data } — unwrap the inner data.
  // Listing-service returns the object directly (no wrapper for entities, or
  // { data: [...hits], total, cursor, hasMore } for paginated results).
  // Only unwrap when json.data exists AND is NOT an array (paginated results).
  if (json.data !== undefined && !Array.isArray(json.data)) {
    return json.data as T;
  }
  return json as T;
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
  thumbnailUrl: string | null;
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

// --- Authenticated API (server-side only) ---

async function authApiFetch<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string | number | undefined> },
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('bt_access')?.value;

  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
}

// My listings
export async function getMyListings(
  cursor?: string,
): Promise<PaginatedResult<ListingDetail>> {
  return authApiFetch<PaginatedResult<ListingDetail>>('/listings/my', {
    params: { cursor: cursor || undefined },
  });
}

export async function getMyListingById(id: string): Promise<ListingDetail> {
  return authApiFetch<ListingDetail>(`/listings/my/${id}`);
}

// CRUD listings
export async function createListing(
  data: Record<string, unknown>,
): Promise<ListingDetail> {
  return authApiFetch<ListingDetail>('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateListing(
  id: string,
  data: Record<string, unknown>,
): Promise<ListingDetail> {
  return authApiFetch<ListingDetail>(`/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateListingStatus(
  id: string,
  status: string,
): Promise<ListingDetail> {
  return authApiFetch<ListingDetail>(`/listings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteListing(id: string): Promise<void> {
  await authApiFetch<unknown>(`/listings/${id}`, {
    method: 'DELETE',
  });
}

// Images
export async function getPresignedUrl(
  listingId: string,
  data: { fileName: string; contentType: string },
): Promise<{ uploadUrl: string; key: string }> {
  return authApiFetch(`/listings/${listingId}/images/presign`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function confirmImageUpload(
  listingId: string,
  data: { key: string; order: number; width: number; height: number },
): Promise<unknown> {
  return authApiFetch(`/listings/${listingId}/images/confirm`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteImage(
  listingId: string,
  imageId: string,
): Promise<void> {
  await authApiFetch<unknown>(`/listings/${listingId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

// Profile
export async function getMyProfile(): Promise<Record<string, unknown>> {
  return authApiFetch('/auth/me');
}

export async function upgradeToSeller(): Promise<unknown> {
  return authApiFetch('/auth/upgrade-to-seller', {
    method: 'POST',
  });
}

// --- Chat types ---

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ChatListing {
  id: string;
  title: string;
  slug: string;
  images: { url: string }[];
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
  createdAt: string;
  listing: ChatListing;
  buyer: ChatUser;
  seller: ChatUser;
  _count?: { messages: number };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  sender: ChatUser;
}

// --- Chat API functions (server-side) ---

export async function getConversations(
  cursor?: string,
): Promise<PaginatedResult<Conversation>> {
  return authApiFetch<PaginatedResult<Conversation>>('/chat/conversations', {
    params: { cursor: cursor || undefined },
  });
}

export async function getConversationById(id: string): Promise<Conversation> {
  return authApiFetch<Conversation>(`/chat/conversations/${id}`);
}

export async function getConversationMessages(
  id: string,
  cursor?: string,
): Promise<PaginatedResult<ChatMessage>> {
  return authApiFetch<PaginatedResult<ChatMessage>>(
    `/chat/conversations/${id}/messages`,
    { params: { cursor: cursor || undefined } },
  );
}

export async function startConversation(data: {
  listingId: string;
  message: string;
}): Promise<{ conversation: Conversation; message: ChatMessage }> {
  return authApiFetch('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

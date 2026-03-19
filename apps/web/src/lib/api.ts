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
  imageUrls?: string[];
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
  expiresAt: string | null;
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

export interface SellerProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  region: string | null;
  createdAt: string;
  totalListings: number;
  totalSales: number;
}

// API functions

export async function getSellerProfile(id: string): Promise<SellerProfile> {
  return apiFetch<SellerProfile>(`/users/seller/${id}`, {
    next: { revalidate: 300 },
  });
}

export async function searchListings(
  filters: Record<string, string | number | undefined>,
): Promise<PaginatedResult<ListingSearchResult>> {
  return apiFetch<PaginatedResult<ListingSearchResult>>('/listings/search', {
    params: filters,
    cache: 'no-store',
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
    cache: 'no-store',
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

// Seller stats
export interface SellerStats {
  activeListings: number;
  soldListings: number;
  totalListings: number;
  totalViews: number;
  totalMessages: number;
  totalRevenue: number;
}

export async function getMyStats(): Promise<SellerStats> {
  return authApiFetch<SellerStats>('/listings/my/stats');
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

export async function getSalesHistory(
  cursor?: string,
): Promise<PaginatedResult<ListingDetail>> {
  return authApiFetch<PaginatedResult<ListingDetail>>('/listings/sales-history', {
    params: { cursor: cursor || undefined },
  });
}

export async function getPurchaseHistory(
  cursor?: string,
): Promise<PaginatedResult<ListingDetail & { conversationId?: string; lastMessageAt?: string }>> {
  return authApiFetch<PaginatedResult<ListingDetail & { conversationId?: string; lastMessageAt?: string }>>('/listings/purchase-history', {
    params: { cursor: cursor || undefined },
  });
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
  listingId: string | null;
  buyerId: string;
  sellerId: string;
  isSystem?: boolean;
  lastMessageAt: string | null;
  createdAt: string;
  listing: ChatListing | null;
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

// --- Admin types ---

export interface AdminStats {
  users: { total: number; sellers: number; suspended: number; banned: number; newToday: number };
  listings: { total: number; active: number; sold: number; deleted: number; featured: number };
  reports: { pending: number };
  messages: { today: number };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
  _count: { listings: number };
}

export interface AdminListing {
  id: string;
  title: string;
  brand: string;
  priceXof: number;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  slug: string;
  deletedAt: string | null;
  seller: { id: string; name: string; email: string | null };
  images: { url: string }[];
}

export interface AdminReport {
  id: string;
  userId: string;
  listingId: string;
  reason: string;
  description: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null };
  listing: {
    id: string;
    title: string;
    slug: string;
    status: string;
    seller: { id: string; name: string };
    images: { url: string }[];
  };
}

export interface BannedIp {
  id: string;
  ip: string;
  reason: string | null;
  bannedBy: string;
  createdAt: string;
}

export interface AdminPaginated<T> {
  users?: T[];
  listings?: T[];
  logs?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Admin API functions (server-side) ---

export async function getAdminStats(): Promise<AdminStats> {
  return authApiFetch<AdminStats>('/admin/stats');
}

export async function getAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<AdminPaginated<AdminUser>> {
  return authApiFetch<AdminPaginated<AdminUser>>('/admin/users', { params });
}

export async function getAdminListings(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<AdminPaginated<AdminListing>> {
  return authApiFetch<AdminPaginated<AdminListing>>('/admin/listings', { params });
}

export interface TransactionLog {
  id: string;
  action: string;
  targetId: string | null;
  metadata: {
    amount?: number;
    listingPrice?: number;
    paymentMethod?: string;
    refCommand?: string;
    listingTitle?: string;
    intechTransactionId?: string;
    error?: string;
  } | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null } | null;
}

export async function getAdminTransactions(params: {
  page?: number;
  limit?: number;
}): Promise<AdminPaginated<TransactionLog>> {
  return authApiFetch<AdminPaginated<TransactionLog>>('/admin/transactions', { params });
}

export async function getAdminReports(params: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ reports: AdminReport[]; total: number; page: number; limit: number; totalPages: number }> {
  return authApiFetch('/admin/reports', { params });
}

export async function getAdminBannedIps(): Promise<BannedIp[]> {
  return authApiFetch('/admin/tools/banned-ips');
}

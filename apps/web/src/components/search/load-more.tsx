'use client';

import { useState } from 'react';
import { ListingCard, ListingCardSkeleton } from '@/components/listing/listing-card';
import type { ListingSearchResult } from '@/lib/api';

interface Props {
  filters: Record<string, string | number | undefined>;
  initialCursor: string | null;
  initialHasMore: boolean;
}

export function LoadMore({ filters, initialCursor, initialHasMore }: Props) {
  const [listings, setListings] = useState<ListingSearchResult[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const params = new URLSearchParams();
      params.set('cursor', cursor);
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });

      const res = await fetch(`${API_BASE}/listings/search?${params.toString()}`);
      if (!res.ok) return;

      const json = await res.json();
      // listing-service returns { data: [...hits], cursor, hasMore } directly (no auth wrapper)
      const page = json.data !== undefined && !Array.isArray(json.data) ? json.data : json;
      const newItems: ListingSearchResult[] = Array.isArray(page) ? page : (page.data ?? []);

      setListings((prev) => [...prev, ...newItems]);
      setCursor(page.cursor ?? null);
      setHasMore(page.hasMore ?? false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (!initialHasMore && listings.length === 0) return null;

  return (
    <>
      {listings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            className="px-8 py-3 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
          >
            Charger plus d&apos;annonces
          </button>
        </div>
      )}
    </>
  );
}

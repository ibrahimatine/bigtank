'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ListingGrid } from '@/components/listing/listing-grid';
import { ListingCardSkeleton } from '@/components/listing/listing-card';
import type { ListingSearchResult } from '@/lib/api';
import { POPULAR_BRANDS, CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@samadal/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Filters {
  brand: string;
  sizeEuMin: string;
  sizeEuMax: string;
  priceMin: string;
  priceMax: string;
  condition: string;
}

const EMPTY_FILTERS: Filters = {
  brand: '',
  sizeEuMin: '',
  sizeEuMax: '',
  priceMin: '',
  priceMax: '',
  condition: '',
};

export function FilterableListings() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [listings, setListings] = useState<ListingSearchResult[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchListings = useCallback(async (f: Filters, loadCursor?: string) => {
    const params = new URLSearchParams();
    params.set('sortBy', 'date');
    params.set('limit', '20');
    if (loadCursor) params.set('cursor', loadCursor);
    if (f.brand) params.set('brand', f.brand);
    if (f.sizeEuMin) params.set('sizeEuMin', f.sizeEuMin);
    if (f.sizeEuMax) params.set('sizeEuMax', f.sizeEuMax);
    if (f.priceMin) params.set('priceMin', f.priceMin);
    if (f.priceMax) params.set('priceMax', f.priceMax);
    if (f.condition) params.set('condition', f.condition);

    const res = await fetch(`${API_BASE}/listings/search?${params.toString()}`);
    if (!res.ok) return { data: [] as ListingSearchResult[], cursor: null, hasMore: false };

    const json = await res.json();
    const page = json.data !== undefined && !Array.isArray(json.data) ? json.data : json;
    const items: ListingSearchResult[] = Array.isArray(page) ? page : (page.data ?? []);

    return {
      data: items,
      cursor: (page.cursor ?? null) as string | null,
      hasMore: (page.hasMore ?? false) as boolean,
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchListings(EMPTY_FILTERS)
      .then((result) => {
        setListings(result.data);
        setCursor(result.cursor);
        setHasMore(result.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchListings]);

  function handleSearch() {
    setLoading(true);
    setShowFilters(false);
    fetchListings(filters)
      .then((result) => {
        setListings(result.data);
        setCursor(result.cursor);
        setHasMore(result.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function handleQuickFilter(patch: Partial<Filters>) {
    const newFilters = { ...EMPTY_FILTERS, ...patch };
    setFilters(newFilters);
    setLoading(true);
    fetchListings(newFilters)
      .then((result) => {
        setListings(result.data);
        setCursor(result.cursor);
        setHasMore(result.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchListings(filters, cursor);
      setListings((prev) => [...prev, ...result.data]);
      setCursor(result.cursor);
      setHasMore(result.hasMore);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <>
      {/* Barre de filtres */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="max-w-[1280px] mx-auto px-4 py-3">

          {/* Mobile : bouton pour ouvrir/fermer les filtres */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtrer
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilters(EMPTY_FILTERS); handleQuickFilter({}); }}
                className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-accent)] transition-colors"
              >
                Effacer les filtres
              </button>
            )}
          </div>

          {/* Filtres — toujours visible sur lg+, toggle sur mobile */}
          <div className={`${showFilters ? 'flex' : 'hidden'} flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-2`}>
            {/* Marque */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Marque</label>
              <select
                value={filters.brand}
                onChange={(e) => updateFilter('brand', e.target.value)}
                className="h-9 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm"
              >
                <option value="">Toutes</option>
                {POPULAR_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Taille EU */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Taille EU</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.sizeEuMin}
                  onChange={(e) => updateFilter('sizeEuMin', e.target.value)}
                  className="h-9 w-full sm:w-16 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.sizeEuMax}
                  onChange={(e) => updateFilter('sizeEuMax', e.target.value)}
                  className="h-9 w-full sm:w-16 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm"
                />
              </div>
            </div>

            {/* Prix */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Prix FCFA</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin}
                  onChange={(e) => updateFilter('priceMin', e.target.value)}
                  className="h-9 w-full sm:w-20 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax}
                  onChange={(e) => updateFilter('priceMax', e.target.value)}
                  className="h-9 w-full sm:w-20 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm"
                />
              </div>
            </div>

            {/* Etat */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Etat</label>
              <select
                value={filters.condition}
                onChange={(e) => updateFilter('condition', e.target.value)}
                className="h-9 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm"
              >
                <option value="">Tous</option>
                {(Object.entries(CONDITION_LABELS) as [ListingCondition, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Bouton Rechercher */}
            <button
              onClick={handleSearch}
              className="h-9 px-4 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5" />
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* Quick filters */}
      <QuickFilters onFilter={handleQuickFilter} />

      {/* Resultats */}
      <section id="recent-listings" className="max-w-[1280px] mx-auto px-4 py-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">
          Toutes les annonces
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <ListingGrid listings={listings} />

            {loadingMore && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            )}

            {hasMore && !loadingMore && (
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
        ) : (
          <div className="text-center py-12 text-[var(--color-muted-foreground)]">
            <p>Aucune annonce pour le moment.</p>
            <p className="text-sm mt-1">Soyez le premier a publier !</p>
          </div>
        )}
      </section>
    </>
  );
}

const QUICK_FILTERS = [
  { label: 'Nike', patch: { brand: 'Nike' } },
  { label: 'Jordan', patch: { brand: 'Jordan' } },
  { label: 'Adidas', patch: { brand: 'Adidas' } },
  { label: 'New Balance', patch: { brand: 'New Balance' } },
  { label: 'EU 38-39', patch: { sizeEuMin: '38', sizeEuMax: '39' } },
  { label: 'EU 40-41', patch: { sizeEuMin: '40', sizeEuMax: '41' } },
  { label: 'EU 42-43', patch: { sizeEuMin: '42', sizeEuMax: '43' } },
  { label: 'EU 44-45', patch: { sizeEuMin: '44', sizeEuMax: '45' } },
  { label: 'EU 46+', patch: { sizeEuMin: '46' } },
  { label: 'Comme neuf', patch: { condition: 'LIKE_NEW' } },
];

function QuickFilters({ onFilter }: { onFilter: (patch: Partial<Filters>) => void }) {
  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="max-w-[1280px] mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => onFilter(f.patch)}
              className="shrink-0 px-3 py-1.5 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-foreground)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors whitespace-nowrap"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

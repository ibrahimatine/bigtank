import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { searchListings } from '@/lib/api';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import { ListingGridSkeleton } from '@/components/listing/listing-grid';

export const revalidate = 0;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.query === 'string' ? params.query : '';
  const brand = typeof params.brand === 'string' ? params.brand : '';

  const parts = ['Chaussures'];
  if (brand) parts.push(brand);
  if (query) parts.push(`"${query}"`);

  return {
    title: parts.join(' ') + ' | Samadal',
    description: `Trouvez des ${parts.join(' ').toLowerCase()} au Senegal sur Samadal.`,
  };
}

const QUICK_FILTERS: { label: string; params: Record<string, string> }[] = [
  { label: 'Nike', params: { brand: 'Nike' } },
  { label: 'Jordan', params: { brand: 'Jordan' } },
  { label: 'Adidas', params: { brand: 'Adidas' } },
  { label: 'New Balance', params: { brand: 'New Balance' } },
  { label: 'Puma', params: { brand: 'Puma' } },
  { label: 'EU 38-39', params: { sizeEuMin: '38', sizeEuMax: '39' } },
  { label: 'EU 40-41', params: { sizeEuMin: '40', sizeEuMax: '41' } },
  { label: 'EU 42-43', params: { sizeEuMin: '42', sizeEuMax: '43' } },
  { label: 'EU 44-45', params: { sizeEuMin: '44', sizeEuMax: '45' } },
  { label: 'EU 46+', params: { sizeEuMin: '46' } },
  { label: 'Comme neuf', params: { condition: 'LIKE_NEW' } },
  { label: 'Neuf', params: { condition: 'NEW' } },
];

function QuickFilterLink({ label, params: filterParams, currentParams }: {
  label: string;
  params: Record<string, string>;
  currentParams: Record<string, string | string[] | undefined>;
}) {
  const merged = new URLSearchParams();
  // Keep existing query if any
  const query = typeof currentParams.query === 'string' ? currentParams.query : '';
  if (query) merged.set('query', query);
  // Apply this filter's params
  for (const [k, v] of Object.entries(filterParams)) {
    merged.set(k, v);
  }

  // Check if this filter is active
  const isActive = Object.entries(filterParams).every(([k, v]) => {
    const current = typeof currentParams[k] === 'string' ? currentParams[k] : '';
    return current === v;
  });

  return (
    <Link
      href={isActive ? `/search${query ? `?query=${encodeURIComponent(query)}` : ''}` : `/search?${merged.toString()}`}
      className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
        isActive
          ? 'bg-[var(--color-primary)] text-white shadow-sm'
          : 'border border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5'
      }`}
    >
      {label}
    </Link>
  );
}

async function Results({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const filters: Record<string, string | number | undefined> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string' && value) {
      filters[key] = value;
    }
  }

  try {
    const result = await searchListings(filters);
    return <SearchResults result={result} filters={filters} />;
  } catch {
    return (
      <div className="text-center py-16 text-[var(--color-muted-foreground)]">
        <span className="text-5xl block mb-4">😵</span>
        <p className="text-lg font-medium">Erreur de chargement</p>
        <p className="text-sm mt-1">Impossible de charger les annonces. Reessayez plus tard.</p>
      </div>
    );
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = typeof params.query === 'string' ? params.query : '';

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-wider">
          {query ? `RESULTATS POUR "${query.toUpperCase()}"` : 'EXPLORER'}
        </h1>
        <div className="lg:hidden shrink-0">
          <Suspense>
            <SearchFilters />
          </Suspense>
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4 mb-4 sm:mb-6">
        {QUICK_FILTERS.map((f) => (
          <QuickFilterLink
            key={f.label}
            label={f.label}
            params={f.params}
            currentParams={params}
          />
        ))}
      </div>

      <div className="flex gap-6 lg:gap-10">
        <div className="hidden lg:block">
          <Suspense>
            <SearchFilters />
          </Suspense>
        </div>

        <div className="flex-1 min-w-0">
          <Suspense fallback={<ListingGridSkeleton />}>
            <Results searchParams={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

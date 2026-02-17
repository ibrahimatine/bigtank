import type { Metadata } from 'next';
import { Suspense } from 'react';
import { searchListings } from '@/lib/api';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import { ListingGridSkeleton } from '@/components/listing/listing-grid';

export const revalidate = 60;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.query === 'string' ? params.query : '';
  const brand = typeof params.brand === 'string' ? params.brand : '';

  const parts = ['Chaussures grandes tailles'];
  if (brand) parts.push(brand);
  if (query) parts.push(`"${query}"`);

  return {
    title: parts.join(' ') + ' | BigTank',
    description: `Trouvez des ${parts.join(' ').toLowerCase()} au Senegal sur BigTank.`,
  };
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
    return <SearchResults result={result} />;
  } catch {
    return (
      <div className="text-center py-12 text-[var(--color-muted-foreground)]">
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
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">
        {query ? `Resultats pour "${query}"` : 'Explorer les annonces'}
      </h1>

      <div className="flex gap-8">
        <Suspense>
          <SearchFilters />
        </Suspense>

        <div className="flex-1 min-w-0">
          <Suspense fallback={<ListingGridSkeleton />}>
            <Results searchParams={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

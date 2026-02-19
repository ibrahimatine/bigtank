import Link from 'next/link';
import type { ListingSearchResult, PaginatedResult } from '@/lib/api';
import { ListingGrid } from '@/components/listing/listing-grid';
import { LoadMore } from '@/components/search/load-more';

interface Props {
  result: PaginatedResult<ListingSearchResult>;
  filters: Record<string, string | number | undefined>;
}

function SearchEmptyState({ filters }: { filters: Record<string, string | number | undefined> }) {
  const query = typeof filters.query === 'string' ? filters.query : '';
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      {/* Illustration */}
      <svg
        viewBox="0 0 120 120"
        className="w-28 h-28 mb-6 text-[var(--color-muted-foreground)] opacity-30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Loupe */}
        <circle cx="52" cy="52" r="30" />
        <line x1="73" y1="73" x2="95" y2="95" strokeWidth="4" />
        {/* X a l'interieur */}
        <line x1="41" y1="41" x2="63" y2="63" />
        <line x1="63" y1="41" x2="41" y2="63" />
      </svg>

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold mb-2">
        Aucune annonce trouvee
      </h3>

      {query ? (
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs">
          Aucun resultat pour{' '}
          <span className="font-medium text-[var(--color-foreground)]">&ldquo;{query}&rdquo;</span>.
          Verifiez l&apos;orthographe ou essayez un autre terme.
        </p>
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-xs">
          Aucune annonce ne correspond a vos filtres. Modifiez vos criteres pour voir plus de resultats.
        </p>
      )}

      <div className="flex items-center gap-3 mt-6">
        {hasFilters && (
          <Link
            href="/search"
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Effacer les filtres
          </Link>
        )}
        <Link
          href="/"
          className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
        >
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  );
}

export function SearchResults({ result, filters }: Props) {
  if (result.data.length === 0) {
    return <SearchEmptyState filters={filters} />;
  }

  return (
    <div>
      {result.total !== undefined && (
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
          {result.total} annonce{result.total !== 1 ? 's' : ''} trouvee{result.total !== 1 ? 's' : ''}
        </p>
      )}
      <ListingGrid listings={result.data} />
      <LoadMore
        filters={filters}
        initialCursor={result.cursor}
        initialHasMore={result.hasMore}
      />
    </div>
  );
}

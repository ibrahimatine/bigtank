import type { ListingSearchResult, PaginatedResult } from '@/lib/api';
import { ListingGrid } from '@/components/listing/listing-grid';
import { LoadMore } from '@/components/search/load-more';

interface Props {
  result: PaginatedResult<ListingSearchResult>;
  filters: Record<string, string | number | undefined>;
}

export function SearchResults({ result, filters }: Props) {
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

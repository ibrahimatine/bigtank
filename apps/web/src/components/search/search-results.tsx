import type { ListingSearchResult, PaginatedResult } from '@/lib/api';
import { ListingGrid } from '@/components/listing/listing-grid';

export function SearchResults({
  result,
}: {
  result: PaginatedResult<ListingSearchResult>;
}) {
  return (
    <div>
      {result.total !== undefined && (
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
          {result.total} annonce{result.total !== 1 ? 's' : ''} trouvee{result.total !== 1 ? 's' : ''}
        </p>
      )}
      <ListingGrid listings={result.data} />
    </div>
  );
}

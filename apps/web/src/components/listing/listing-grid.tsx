import type { ListingSearchResult } from '@/lib/api';
import { ListingCard, ListingCardSkeleton } from './listing-card';

export function ListingGrid({ listings }: { listings: ListingSearchResult[] }) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-muted-foreground)]">
        <p className="text-lg font-medium">Aucune annonce trouvee</p>
        <p className="text-sm mt-1">Essayez de modifier vos filtres.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

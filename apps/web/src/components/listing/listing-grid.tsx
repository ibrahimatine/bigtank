import type { ListingSearchResult } from '@/lib/api';
import { ListingCard, ListingCardSkeleton } from './listing-card';

export function ListingGrid({ listings }: { listings: ListingSearchResult[] }) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--color-muted-foreground)]">
        <span className="text-5xl block mb-4">👟</span>
        <p className="text-lg font-medium">Aucune annonce trouvee</p>
        <p className="text-sm mt-1">Essayez de modifier vos filtres.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {listings.map((listing, i) => (
        <div
          key={listing.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
        >
          <ListingCard listing={listing} />
        </div>
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

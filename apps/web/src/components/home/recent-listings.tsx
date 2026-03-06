import { searchListings } from '@/lib/api';
import { ListingGrid } from '@/components/listing/listing-grid';
import { LoadMore } from '@/components/search/load-more';

export async function RecentListings() {
  let result: Awaited<ReturnType<typeof searchListings>> = {
    data: [],
    cursor: null,
    hasMore: false,
  };

  try {
    result = await searchListings({ sortBy: 'date', limit: 20 });
  } catch {
    // API not available — show empty state
  }

  return (
    <section id="recent-listings" className="max-w-[1280px] mx-auto px-4 py-12">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">
        Toutes les annonces
      </h2>

      {result.data.length > 0 ? (
        <>
          <ListingGrid listings={result.data} />
          <LoadMore
            filters={{ sortBy: 'date', limit: 20 }}
            initialCursor={result.cursor}
            initialHasMore={result.hasMore}
          />
        </>
      ) : (
        <div className="text-center py-12 text-[var(--color-muted-foreground)]">
          <p>Aucune annonce pour le moment.</p>
          <p className="text-sm mt-1">Soyez le premier a publier !</p>
        </div>
      )}
    </section>
  );
}

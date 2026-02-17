import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getRecentListings } from '@/lib/api';
import { ListingGrid } from '@/components/listing/listing-grid';

export async function RecentListings() {
  let listings: Awaited<ReturnType<typeof getRecentListings>>['data'] = [];

  try {
    const result = await getRecentListings(8);
    listings = result.data;
  } catch {
    // API not available — show empty state
  }

  return (
    <section className="max-w-[1280px] mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Annonces recentes
        </h2>
        <Link
          href="/search"
          className="flex items-center gap-1 text-sm text-[var(--color-accent)] hover:underline"
        >
          Voir tout <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {listings.length > 0 ? (
        <ListingGrid listings={listings} />
      ) : (
        <div className="text-center py-12 text-[var(--color-muted-foreground)]">
          <p>Aucune annonce pour le moment.</p>
          <p className="text-sm mt-1">Soyez le premier a publier !</p>
        </div>
      )}
    </section>
  );
}

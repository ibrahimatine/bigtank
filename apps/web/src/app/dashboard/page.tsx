import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { getMyListings } from '@/lib/api';
import { MyListingCard } from '@/components/dashboard/my-listing-card';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  let listings: Awaited<ReturnType<typeof getMyListings>>['data'] = [];

  try {
    const result = await getMyListings();
    listings = result.data;
  } catch {
    // Auth error or API not available
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Mes annonces
        </h1>
        <Button asChild className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90">
          <Link href="/dashboard/new" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Nouvelle annonce
          </Link>
        </Button>
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <MyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">
          <p className="text-lg font-medium">Aucune annonce</p>
          <p className="text-sm mt-1">
            Publiez votre premiere annonce pour commencer a vendre.
          </p>
          <Button asChild className="mt-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90">
            <Link href="/dashboard/new">Publier une annonce</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

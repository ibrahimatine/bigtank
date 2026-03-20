import Link from 'next/link';
import { PlusCircle, ArrowUpCircle, Eye, ShoppingBag, TrendingUp, Package } from 'lucide-react';
import { getMyListings, getMyProfile, getMyStats } from '@/lib/api';
import type { SellerStats } from '@/lib/api';
import { MyListingCard } from '@/components/dashboard/my-listing-card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return n.toString();
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          accent
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
            : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
        }`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-xl font-bold truncate">{value}</p>
          <p className="text-xs text-[var(--color-muted-foreground)] truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  let role = 'USER';
  let listings: Awaited<ReturnType<typeof getMyListings>>['data'] = [];
  let stats: SellerStats | null = null;

  try {
    const profile = await getMyProfile();
    role = (profile.role as string) || 'USER';
  } catch {
    // session expirée ou API indisponible
  }

  // Compte acheteur — inviter à devenir vendeur
  if (role !== 'SELLER') {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
          <ArrowUpCircle className="h-7 w-7 text-[var(--color-accent)]" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold mb-2">
          Devenez vendeur
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-6 max-w-sm mx-auto">
          Votre compte est en mode acheteur. Activez le mode vendeur pour publier des annonces gratuitement.
        </p>
        <Button asChild className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90">
          <Link href="/profile">Activer mon compte vendeur</Link>
        </Button>
      </div>
    );
  }

  try {
    const [listingsResult, statsResult] = await Promise.all([
      getMyListings(),
      getMyStats(),
    ]);
    listings = listingsResult.data;
    stats = statsResult;
  } catch {
    // API indisponible
  }

  return (
    <div>
      {/* Stats vendeur */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Package} label="Actives" value={stats.activeListings.toString()} accent />
          <StatCard icon={ShoppingBag} label="Vendues" value={stats.soldListings.toString()} />
          <StatCard icon={Eye} label="Vues totales" value={formatNumber(stats.totalViews)} accent />
          <StatCard icon={TrendingUp} label="Annonces" value={stats.totalListings.toString()} />
        </div>
      )}

      {/* Header + bouton */}
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

      {/* Liste des annonces */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

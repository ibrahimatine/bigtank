import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, Calendar, Package, ShoppingBag, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getSellerProfile, searchListings } from '@/lib/api';
import { ListingCard } from '@/components/listing/listing-card';
import { Separator } from '@/components/ui/separator';

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-SN', {
    month: 'long',
    year: 'numeric',
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const seller = await getSellerProfile(id);
    return {
      title: `${seller.name} — Profil vendeur | BigTank`,
      description: `Découvrez les annonces de ${seller.name} sur BigTank. ${seller.totalListings} annonce${seller.totalListings !== 1 ? 's' : ''} en ligne.`,
    };
  } catch {
    return { title: 'Vendeur non trouvé | BigTank' };
  }
}

export default async function SellerProfilePage({ params }: Props) {
  const { id } = await params;

  let seller;
  try {
    seller = await getSellerProfile(id);
  } catch {
    notFound();
  }

  let listings: Awaited<ReturnType<typeof searchListings>> = {
    data: [],
    total: 0,
    cursor: null,
    hasMore: false,
  };
  try {
    listings = await searchListings({ sellerId: id, limit: 20 });
  } catch {
    // ignore
  }

  const initials = seller.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] mb-6">
        <Link href="/" className="hover:text-[var(--color-foreground)] transition-colors">Accueil</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[var(--color-foreground)] font-medium">{seller.name}</span>
      </nav>

      {/* Profile card */}
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          {seller.avatarUrl ? (
            <img
              src={seller.avatarUrl}
              alt={seller.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-[var(--color-accent)]">{initials}</span>
            </div>
          )}

          <div className="text-center sm:text-left flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              {seller.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-[var(--color-muted-foreground)]">
              {(seller.city || seller.region) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {[seller.city, seller.region].filter(Boolean).join(', ')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Membre depuis {formatDate(seller.createdAt)}
              </span>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-center sm:justify-start gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-[var(--color-accent)]">
                  <Package className="h-5 w-5" />
                  <span className="text-2xl font-bold">{seller.totalListings}</span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  Annonce{seller.totalListings !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-[var(--color-accent)]">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="text-2xl font-bold">{seller.totalSales}</span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  Vente{seller.totalSales !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller listings */}
      <div className="mt-10">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold mb-6">
          Annonces de {seller.name}
        </h2>

        {listings.data.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.data.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--color-muted-foreground)]">
            <User className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Aucune annonce pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, Eye, Calendar, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getListingBySlug, searchListings } from '@/lib/api';
import { generateListingJsonLd } from '@/lib/seo';
import { ListingGallery } from '@/components/listing/listing-gallery';
import { ListingCard } from '@/components/listing/listing-card';
import { ShareButton } from '@/components/listing/share-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CONDITION_LABELS } from '@/types';
import { StartConversationButton } from '@/components/chat/start-conversation-button';
import type { ListingCondition } from '@samadal/shared-types';

const STATUS_CONFIG: Record<string, { label: string; style: string; bg: string }> = {
  ACTIVE: { label: 'Disponible', style: 'bg-green-100 text-green-700', bg: '' },
  SOLD: { label: 'Vendue', style: 'bg-red-100 text-red-700', bg: 'bg-red-50 border-red-200' },
  RESERVED: { label: 'Reservee', style: 'bg-yellow-100 text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
};

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-SN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const listing = await getListingBySlug(slug);
    return {
      title: `${listing.title} — ${listing.brand} EU ${listing.sizeEu}`,
      description: listing.description.slice(0, 160),
      openGraph: {
        title: listing.title,
        description: listing.description.slice(0, 160),
        images: listing.images.map((img) => ({
          url: img.url,
          width: img.width,
          height: img.height,
        })),
      },
    };
  } catch {
    return { title: 'Annonce non trouvee | BigTank' };
  }
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;

  let listing;
  try {
    listing = await getListingBySlug(slug);
  } catch {
    notFound();
  }

  const conditionLabel =
    CONDITION_LABELS[listing.condition as ListingCondition] || listing.condition;
  const jsonLd = generateListingJsonLd(listing);

  // Similar listings — même marque, trier par pertinence
  let similarListings: Awaited<ReturnType<typeof searchListings>>['data'] = [];
  try {
    const similar = await searchListings({ brand: listing.brand, limit: 5 });
    similarListings = similar.data.filter((l) => l.id !== listing.id).slice(0, 4);
  } catch {
    // ignore
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-[1280px] mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] mb-6 flex-wrap">
          <Link href="/" className="hover:text-[var(--color-foreground)] transition-colors">Accueil</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link href="/search" className="hover:text-[var(--color-foreground)] transition-colors">Annonces</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link
            href={`/search?brand=${encodeURIComponent(listing.brand)}`}
            className="hover:text-[var(--color-foreground)] transition-colors"
          >
            {listing.brand}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[var(--color-foreground)] font-medium truncate max-w-[200px]">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gallery */}
          <ListingGallery images={listing.images} />

          {/* Info */}
          <div>
            <p className="text-sm text-[var(--color-muted-foreground)] uppercase tracking-wide">
              {listing.brand} &middot; {listing.model}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold mt-1">
              {listing.title}
            </h1>

            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline">EU {listing.sizeEu}</Badge>
              {listing.sizeUs && <Badge variant="outline">US {listing.sizeUs}</Badge>}
              {listing.sizeUk && <Badge variant="outline">UK {listing.sizeUk}</Badge>}
              <Badge variant="secondary">{conditionLabel}</Badge>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-accent)]">
                {formatPrice(listing.priceXof)}
              </p>
              {STATUS_CONFIG[listing.status] && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_CONFIG[listing.status].style}`}>
                  {STATUS_CONFIG[listing.status].label}
                </span>
              )}
            </div>

            {(listing.status === 'SOLD' || listing.status === 'RESERVED') && (
              <div className={`mt-3 px-4 py-2.5 rounded-xl border text-sm font-medium ${STATUS_CONFIG[listing.status]?.bg}`}>
                {listing.status === 'SOLD'
                  ? 'Cet article a deja ete vendu.'
                  : 'Cet article est actuellement reserve.'}
              </div>
            )}

            <Separator className="my-6" />

            <div className="space-y-3 text-sm text-[var(--color-muted-foreground)]">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{listing.locationCity}, {listing.locationRegion}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{listing.viewsCount} vue{listing.viewsCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Publiee le {formatDate(listing.createdAt)}</span>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Seller info */}
            <Link
              href={`/seller/${listing.sellerId}`}
              className="flex items-center gap-3 group/seller p-2 -m-2 rounded-lg hover:bg-[var(--color-muted)]/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
                <User className="h-5 w-5 text-[var(--color-muted-foreground)]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover/seller:text-[var(--color-accent)] transition-colors">{listing.seller.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">Voir le profil</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--color-muted-foreground)] opacity-0 group-hover/seller:opacity-100 transition-opacity" />
            </Link>

            <Separator className="my-6" />

            {/* Description */}
            <div>
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Color */}
            {listing.color && (
              <div className="mt-4">
                <span className="text-sm font-medium">Couleur : </span>
                <span className="text-sm text-[var(--color-muted-foreground)]">{listing.color}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              {listing.status === 'ACTIVE' ? (
                <StartConversationButton
                  listingId={listing.id}
                  sellerId={listing.sellerId}
                />
              ) : (
                <button
                  disabled
                  className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-500 font-semibold text-sm cursor-not-allowed"
                >
                  {listing.status === 'SOLD' ? 'Article vendu' : 'Article reserve'}
                </button>
              )}
              <ShareButton
                title={listing.title}
                url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://bigtank.sn'}/shoes/${listing.slug}`}
              />
            </div>
          </div>
        </div>

        {/* Similar listings */}
        {similarListings.length > 0 && (
          <div className="mt-16">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold mb-6">
              Annonces similaires — {listing.brand}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarListings.map((similar) => (
                <ListingCard key={similar.id} listing={similar} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

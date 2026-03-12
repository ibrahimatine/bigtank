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
import { CONDITION_LABELS } from '@/types';
import { StartConversationButton } from '@/components/chat/start-conversation-button';
import type { ListingCondition } from '@samadal/shared-types';

const STATUS_CONFIG: Record<string, { label: string; style: string; bg: string }> = {
  ACTIVE: { label: 'Disponible', style: 'bg-emerald-500/10 text-emerald-600', bg: '' },
  SOLD: { label: 'Vendue', style: 'bg-stone-800/10 text-stone-700 dark:text-stone-300', bg: 'bg-stone-100 dark:bg-stone-800/30 border-stone-200 dark:border-stone-700' },
  RESERVED: { label: 'Reservee', style: 'bg-amber-500/10 text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
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
    return { title: 'Annonce non trouvee | Samadal' };
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

      <div className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Gallery */}
          <ListingGallery images={listing.images} />

          {/* Info */}
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-[0.15em] font-semibold">
              {listing.brand} {listing.model ? `· ${listing.model}` : ''}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-wider mt-2 leading-tight">
              {listing.title.toUpperCase()}
            </h1>

            {/* Tailles */}
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="text-sm font-semibold px-3 py-1">EU {listing.sizeEu}</Badge>
              {listing.sizeUs && <Badge variant="outline" className="px-3 py-1">US {listing.sizeUs}</Badge>}
              {listing.sizeUk && <Badge variant="outline" className="px-3 py-1">UK {listing.sizeUk}</Badge>}
              <Badge variant="secondary" className="px-3 py-1">{conditionLabel}</Badge>
            </div>

            {/* Prix + statut */}
            <div className="flex items-center gap-4 mt-5">
              <p className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl text-[var(--color-accent)] tracking-wider leading-none">
                {formatPrice(listing.priceXof)}
              </p>
              {STATUS_CONFIG[listing.status] && (
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_CONFIG[listing.status].style}`}>
                  {STATUS_CONFIG[listing.status].label}
                </span>
              )}
            </div>

            {(listing.status === 'SOLD' || listing.status === 'RESERVED') && (
              <div className={`mt-4 px-4 py-3 rounded-xl border text-sm font-medium ${STATUS_CONFIG[listing.status]?.bg}`}>
                {listing.status === 'SOLD'
                  ? 'Cet article a deja ete vendu.'
                  : 'Cet article est actuellement reserve.'}
              </div>
            )}

            {/* Separator */}
            <div className="h-px bg-[var(--color-border)] my-6" />

            {/* Details */}
            <div className="space-y-3 text-sm text-[var(--color-muted-foreground)]">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{listing.locationCity}, {listing.locationRegion}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Eye className="h-4 w-4 shrink-0" />
                <span>{listing.viewsCount} vue{listing.viewsCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Publiee le {formatDate(listing.createdAt)}</span>
              </div>
            </div>

            <div className="h-px bg-[var(--color-border)] my-6" />

            {/* Seller info */}
            <Link
              href={`/seller/${listing.sellerId}`}
              className="flex items-center gap-3 group/seller p-3 -mx-3 rounded-xl hover:bg-[var(--color-muted)] transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                <User className="h-5 w-5 text-[var(--color-primary-foreground)]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm group-hover/seller:text-[var(--color-accent)] transition-colors">{listing.seller.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">Voir le profil</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--color-muted-foreground)] opacity-0 group-hover/seller:opacity-100 transition-opacity" />
            </Link>

            <div className="h-px bg-[var(--color-border)] my-6" />

            {/* Description */}
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg tracking-wider mb-2">DESCRIPTION</h2>
              <p className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>

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
                  className="flex-1 py-3.5 rounded-xl bg-[var(--color-muted)] text-[var(--color-muted-foreground)] font-semibold text-sm cursor-not-allowed"
                >
                  {listing.status === 'SOLD' ? 'Article vendu' : 'Article reserve'}
                </button>
              )}
              <ShareButton
                title={listing.title}
                url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://samadal.net'}/shoes/${listing.slug}`}
              />
            </div>
          </div>
        </div>

        {/* Similar listings */}
        {similarListings.length > 0 && (
          <div className="mt-16 sm:mt-20">
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wider mb-6 sm:mb-8">
              ANNONCES SIMILAIRES
            </h2>
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
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

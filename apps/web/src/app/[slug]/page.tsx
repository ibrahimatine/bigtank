import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, Eye, Calendar, User } from 'lucide-react';
import { getListingBySlug } from '@/lib/api';
import { generateListingJsonLd } from '@/lib/seo';
import { ListingGallery } from '@/components/listing/listing-gallery';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@bigtank/shared-types';

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-[1280px] mx-auto px-4 py-8">
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

            <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-accent)] mt-4">
              {formatPrice(listing.priceXof)}
            </p>

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
                <User className="h-5 w-5 text-[var(--color-muted-foreground)]" />
              </div>
              <div>
                <p className="font-medium text-sm">{listing.seller.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">Vendeur</p>
              </div>
            </div>

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

            {/* Action buttons — disabled for Phase 5a */}
            <div className="flex gap-3 mt-8">
              <button
                disabled
                className="flex-1 py-3 rounded-lg bg-[var(--color-accent)] text-white font-medium opacity-50 cursor-not-allowed"
              >
                Contacter le vendeur
              </button>
              <button
                disabled
                className="flex-1 py-3 rounded-lg border border-[var(--color-border)] font-medium opacity-50 cursor-not-allowed"
              >
                Faire une offre
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

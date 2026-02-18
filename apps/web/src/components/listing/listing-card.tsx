import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ListingSearchResult } from '@/lib/api';
import { CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@bigtank/shared-types';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

export function ListingCard({ listing }: { listing: ListingSearchResult }) {
  const conditionLabel =
    CONDITION_LABELS[listing.condition as ListingCondition] || listing.condition;

  return (
    <Link href={`/shoes/${listing.slug}`} className="group block">
      <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square bg-[var(--color-muted)]">
          {listing.thumbnailUrl ? (
            <img
              src={listing.thumbnailUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
              Pas de photo
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wide">
            {listing.brand}
          </p>
          <h3 className="font-medium text-sm mt-0.5 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              EU {listing.sizeEu}
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {conditionLabel}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="font-[family-name:var(--font-display)] font-bold text-[var(--color-accent)]">
              {formatPrice(listing.priceXof)}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--color-muted-foreground)]">
              <MapPin className="h-3 w-3" />
              {listing.locationCity}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden">
      <Skeleton className="aspect-square" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

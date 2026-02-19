import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ListingSearchResult } from '@/lib/api';
import { CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@bigtank/shared-types';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

const CONDITION_COLORS: Record<ListingCondition, string> = {
  NEW: 'bg-green-100 text-green-700',
  LIKE_NEW: 'bg-blue-100 text-blue-700',
  GOOD: 'bg-amber-100 text-amber-700',
  FAIR: 'bg-gray-100 text-gray-500',
};

export function ListingCard({ listing }: { listing: ListingSearchResult }) {
  const conditionLabel =
    CONDITION_LABELS[listing.condition as ListingCondition] || listing.condition;
  const conditionColor =
    CONDITION_COLORS[listing.condition as ListingCondition] || 'bg-gray-100 text-gray-500';

  return (
    <Link href={`/shoes/${listing.slug}`} className="group block">
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
        {/* Image — ratio 4/3 pour avoir plus d'espace infos */}
        <div className="relative aspect-[4/3] bg-[var(--color-muted)]">
          {listing.thumbnailUrl ? (
            <img
              src={listing.thumbnailUrl}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--color-muted-foreground)]">
              <span className="text-3xl select-none">👟</span>
              <span className="text-xs">Pas de photo</span>
            </div>
          )}
          {/* Badge taille sur fond solide — jamais texte sur image brute */}
          <div className="absolute top-2 left-2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            EU {listing.sizeEu}
          </div>
        </div>

        {/* Infos */}
        <div className="p-3">
          <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase tracking-widest font-medium">
            {listing.brand}
          </p>
          <h3 className="font-semibold text-sm mt-0.5 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
            {listing.title}
          </h3>

          <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${conditionColor}`}>
            {conditionLabel}
          </span>

          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--color-border)]">
            <span className="font-[family-name:var(--font-display)] font-bold text-[var(--color-accent)] text-sm">
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
    <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
      <Skeleton className="aspect-[4/3]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
        <div className="flex justify-between pt-1 border-t border-[var(--color-border)] mt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

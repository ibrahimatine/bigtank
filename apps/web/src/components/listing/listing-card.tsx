import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ListingSearchResult } from '@/lib/api';
import { CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@samadal/shared-types';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' F';
}

function timeAgo(ts: number): string {
  const ms = ts < 1e10 ? ts * 1000 : ts;
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return "a l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  if (diff < 2592000) return `il y a ${Math.floor(diff / 604800)} sem`;
  return `il y a ${Math.floor(diff / 2592000)} mois`;
}

const CONDITION_COLORS: Record<ListingCondition, string> = {
  NEW: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  LIKE_NEW: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  GOOD: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  FAIR: 'bg-stone-500/10 text-stone-500',
};

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  ACTIVE: { label: 'Disponible', style: 'bg-emerald-500 text-white' },
  SOLD: { label: 'Vendue', style: 'bg-stone-800 text-white' },
  RESERVED: { label: 'Reservee', style: 'bg-amber-500 text-white' },
};

export function ListingCard({ listing }: { listing: ListingSearchResult }) {
  const conditionLabel =
    CONDITION_LABELS[listing.condition as ListingCondition] || listing.condition;
  const conditionColor =
    CONDITION_COLORS[listing.condition as ListingCondition] || 'bg-stone-500/10 text-stone-500';
  const isSoldOrReserved = listing.status === 'SOLD' || listing.status === 'RESERVED';
  const statusInfo = STATUS_CONFIG[listing.status];

  return (
    <Link href={`/shoes/${listing.slug}`} className="group block">
      <div className={`bg-[var(--color-card)] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1 ${isSoldOrReserved ? 'opacity-60' : ''}`}>
        {/* Image */}
        <div className="relative aspect-[4/5] bg-gradient-to-b from-[var(--color-muted)] to-[var(--color-muted)]/60 overflow-hidden">
          {listing.thumbnailUrl ? (
            <Image
              src={listing.thumbnailUrl}
              alt={listing.title}
              fill
              className={`object-cover shoe-image-hover ${isSoldOrReserved ? 'grayscale' : ''}`}
              sizes="(max-width: 480px) 100vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--color-muted-foreground)]">
              <span className="text-4xl select-none">👟</span>
            </div>
          )}

          {/* Taille — badge premium */}
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
            <span className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg tracking-wide">
              EU {listing.sizeEu}
            </span>
          </div>

          {/* Statut */}
          {statusInfo && listing.status !== 'ACTIVE' && (
            <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
              <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg ${statusInfo.style}`}>
                {statusInfo.label}
              </span>
            </div>
          )}

          {/* Gradient overlay bas */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Infos */}
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] sm:text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-[0.15em] font-semibold truncate">
              {listing.brand}
            </p>
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${conditionColor}`}>
              {conditionLabel}
            </span>
          </div>

          <h3 className="font-medium text-sm sm:text-[15px] mt-1.5 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-end justify-between mt-3 pt-3 border-t border-[var(--color-border)]/60">
            <span className="font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[var(--color-accent)] leading-none tracking-wide">
              {formatPrice(listing.priceXof)}
            </span>
            <div className="flex flex-col items-end gap-0.5">
              {listing.locationCity && (
                <span className="flex items-center gap-0.5 text-[10px] text-[var(--color-muted-foreground)]">
                  <MapPin className="h-2.5 w-2.5" />
                  <span className="truncate max-w-[70px]">{listing.locationCity}</span>
                </span>
              )}
              <span className="text-[10px] text-[var(--color-muted-foreground)]/50">
                {timeAgo(listing.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[4/5]" />
      <div className="p-3 sm:p-4 space-y-2.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between pt-2.5 border-t border-[var(--color-border)]/60">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

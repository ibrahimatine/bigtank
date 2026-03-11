import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ListingSearchResult } from '@/lib/api';
import { CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@samadal/shared-types';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

function timeAgo(ts: number): string {
  // Meilisearch stores createdAt as Unix seconds
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
  NEW: 'bg-green-100 text-green-700',
  LIKE_NEW: 'bg-blue-100 text-blue-700',
  GOOD: 'bg-amber-100 text-amber-700',
  FAIR: 'bg-gray-100 text-gray-500',
};

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  ACTIVE: { label: 'Disponible', style: 'bg-green-500 text-white' },
  SOLD: { label: 'Vendue', style: 'bg-red-500 text-white' },
  RESERVED: { label: 'Reservee', style: 'bg-yellow-500 text-white' },
};

export function ListingCard({ listing }: { listing: ListingSearchResult }) {
  const conditionLabel =
    CONDITION_LABELS[listing.condition as ListingCondition] || listing.condition;
  const conditionColor =
    CONDITION_COLORS[listing.condition as ListingCondition] || 'bg-gray-100 text-gray-500';
  const isSoldOrReserved = listing.status === 'SOLD' || listing.status === 'RESERVED';
  const statusInfo = STATUS_CONFIG[listing.status];

  return (
    <Link href={`/shoes/${listing.slug}`} className="group block">
      <div className={`bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 ${isSoldOrReserved ? 'opacity-75' : ''}`}>
        {/* Image — ratio 4/3 pour avoir plus d'espace infos */}
        <div className="relative aspect-[4/3] bg-[var(--color-muted)]">
          {listing.thumbnailUrl ? (
            <Image
              src={listing.thumbnailUrl}
              alt={listing.title}
              fill
              className={`object-contain group-hover:scale-105 transition-transform duration-300 ${isSoldOrReserved ? 'grayscale' : ''}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--color-muted-foreground)]">
              <span className="text-3xl select-none">👟</span>
              <span className="text-xs">Pas de photo</span>
            </div>
          )}
          {/* Badge taille sur fond solide — jamais texte sur image brute */}
          <div className="absolute top-2 left-2 bg-[var(--color-primary)] text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            EU {listing.sizeEu}
          </div>
          {/* Badge statut */}
          {statusInfo && (
            <div className={`absolute top-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm ${statusInfo.style}`}>
              {statusInfo.label}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-3">
          <p className="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-widest font-medium">
            {listing.brand}
          </p>
          <h3 className="font-semibold text-sm mt-0.5 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
            {listing.title}
          </h3>

          <span className={`inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${conditionColor}`}>
            {conditionLabel}
          </span>

          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--color-border)]">
            <span className="font-[family-name:var(--font-display)] font-bold text-[var(--color-accent)] text-sm truncate">
              {formatPrice(listing.priceXof)}
            </span>
            <span className="flex items-center gap-0.5 text-[11px] text-[var(--color-muted-foreground)] shrink-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[60px]">{listing.locationCity}</span>
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-muted-foreground)]/60 mt-1">
            {timeAgo(listing.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
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

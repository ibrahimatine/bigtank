import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ListingActions } from './listing-actions';
import type { ListingDetail } from '@/lib/api';
import { CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@samadal/shared-types';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SOLD: 'bg-blue-100 text-blue-700',
  RESERVED: 'bg-yellow-100 text-yellow-700',
  DELETED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
  DRAFT: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Disponible',
  SOLD: 'Vendue',
  RESERVED: 'Reservee',
  DELETED: 'Supprimee',
  EXPIRED: 'Expiree',
  DRAFT: 'Brouillon',
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

function getExpirationInfo(expiresAt: string | null, status: string) {
  if (!expiresAt || status !== 'ACTIVE') return null;
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { text: 'Expire bientot', urgent: true };
  if (diffDays <= 7) return { text: `Expire dans ${diffDays}j`, urgent: true };
  if (diffDays <= 30) return { text: `Expire dans ${diffDays}j`, urgent: false };
  return null;
}

export function MyListingCard({ listing }: { listing: ListingDetail }) {
  const conditionLabel =
    CONDITION_LABELS[listing.condition as ListingCondition] || listing.condition;
  const expiration = getExpirationInfo(listing.expiresAt, listing.status);

  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[var(--color-muted)] via-[var(--color-muted)]/80 to-[var(--color-muted)]/40">
        {listing.images?.[0] ? (
          <Image
            src={listing.images[0].url}
            alt={listing.title}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--color-muted-foreground)]">
            <svg className="w-10 h-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M2 18c0-1 1-2 3-2.5S8 15 9 14s1.5-2.5 2-3.5S12.5 8 14 7s3-1 4.5-.5S21 8 21.5 9s.5 2.5.5 3.5V18c0 1-1 2-2 2H4c-1 0-2-1-2-2z" />
            </svg>
            <span className="text-xs opacity-50">Pas de photo</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <ListingActions listingId={listing.id} status={listing.status} />
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wide">
            {listing.brand}
          </p>
          <Badge className={STATUS_STYLES[listing.status] || ''}>
            {STATUS_LABELS[listing.status] || listing.status}
          </Badge>
        </div>
        <h3 className="font-medium text-sm line-clamp-1">{listing.title}</h3>

        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            EU {listing.sizeEu}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {conditionLabel}
          </Badge>
        </div>

        <p className="font-[family-name:var(--font-display)] font-bold text-[var(--color-accent)] mt-2">
          {formatPrice(listing.priceXof)}
        </p>
        <p className="text-[10px] text-[var(--color-muted-foreground)] mt-1">
          {listing.viewsCount} vue{listing.viewsCount !== 1 ? 's' : ''}
        </p>
        {expiration && (
          <p className={`text-[10px] mt-1 flex items-center gap-1 ${expiration.urgent ? 'text-red-500 font-medium' : 'text-[var(--color-muted-foreground)]'}`}>
            <Clock className="h-3 w-3" />
            {expiration.text}
          </p>
        )}
      </div>
    </div>
  );
}

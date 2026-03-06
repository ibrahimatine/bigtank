import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ListingActions } from './listing-actions';
import type { ListingDetail } from '@/lib/api';
import { CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@bigtank/shared-types';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SOLD: 'bg-blue-100 text-blue-700',
  RESERVED: 'bg-yellow-100 text-yellow-700',
  DELETED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Disponible',
  SOLD: 'Vendue',
  RESERVED: 'Reservee',
  DELETED: 'Supprimee',
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

export function MyListingCard({ listing }: { listing: ListingDetail }) {
  const conditionLabel =
    CONDITION_LABELS[listing.condition as ListingCondition] || listing.condition;

  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
      <div className="relative aspect-video bg-[var(--color-muted)]">
        {listing.images?.[0] ? (
          <Image
            src={listing.images[0].url}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
            Pas de photo
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
      </div>
    </div>
  );
}

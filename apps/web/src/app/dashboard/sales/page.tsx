import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShoppingBag } from 'lucide-react';
import { getSalesHistory } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Mes ventes',
};

export const dynamic = 'force-dynamic';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function SalesPage() {
  let sales: Awaited<ReturnType<typeof getSalesHistory>>['data'] = [];

  try {
    const result = await getSalesHistory();
    sales = result.data;
  } catch {
    // API indisponible
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">
        Mes ventes
      </h1>

      {sales.length > 0 ? (
        <div className="space-y-3">
          {sales.map((item) => (
            <Link
              key={item.id}
              href={`/shoes/${item.slug}`}
              className="flex items-center gap-4 p-4 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-muted)] shrink-0">
                {item.images?.[0] ? (
                  <Image
                    src={item.images[0].url}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-muted-foreground)]">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {item.brand} &middot; EU {item.sizeEu}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  Vendue le {formatDate(item.updatedAt)}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-[family-name:var(--font-display)] font-bold text-[var(--color-accent)]">
                  {formatPrice(item.priceXof)}
                </p>
                <Badge className="bg-blue-100 text-blue-700 mt-1">Vendue</Badge>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">Aucune vente</p>
          <p className="text-sm mt-1">
            Vos ventes apparaitront ici une fois qu&apos;un acheteur aura achete une de vos annonces.
          </p>
        </div>
      )}
    </div>
  );
}

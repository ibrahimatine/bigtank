import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Package } from 'lucide-react';
import { getPurchaseHistory } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Mes achats',
};

export const dynamic = 'force-dynamic';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

export default async function PurchasesPage() {
  let purchases: Awaited<ReturnType<typeof getPurchaseHistory>>['data'] = [];

  try {
    const result = await getPurchaseHistory();
    purchases = result.data;
  } catch {
    // API indisponible
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">
        Mes achats
      </h1>

      {purchases.length > 0 ? (
        <div className="space-y-3">
          {purchases.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)]"
            >
              <Link
                href={`/shoes/${item.slug}`}
                className="relative w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-muted)] shrink-0"
              >
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
                    <Package className="h-5 w-5" />
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/shoes/${item.slug}`} className="hover:underline">
                  <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                </Link>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {item.brand} &middot; EU {item.sizeEu}
                </p>
                {item.seller && (
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    Vendeur : {item.seller.name}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="font-[family-name:var(--font-display)] font-bold text-[var(--color-accent)]">
                  {formatPrice(item.priceXof)}
                </p>
                <Badge className="bg-blue-100 text-blue-700 mt-1">Achetee</Badge>
                {item.conversationId && (
                  <Link
                    href={`/chat/${item.conversationId}`}
                    className="block text-xs text-[var(--color-accent)] hover:underline mt-1"
                  >
                    Voir conversation
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">Aucun achat</p>
          <p className="text-sm mt-1">
            Vos achats apparaitront ici une fois qu&apos;une transaction sera completee.
          </p>
        </div>
      )}
    </div>
  );
}

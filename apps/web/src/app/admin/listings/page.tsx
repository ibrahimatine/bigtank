import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAdminListings } from '@/lib/api';
import { ListingDeleteAction } from '@/components/admin/listing-delete-action';
import { ListingStatusAction } from '@/components/admin/listing-status-action';
import { ShoppingBag } from 'lucide-react';

export const metadata: Metadata = { title: 'Annonces' };
export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-50 text-gray-700',
  ACTIVE: 'bg-green-50 text-green-700',
  SOLD: 'bg-blue-50 text-blue-700',
  RESERVED: 'bg-yellow-50 text-yellow-700',
  EXPIRED: 'bg-orange-50 text-orange-700',
  DELETED: 'bg-red-50 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Disponible',
  SOLD: 'Vendue',
  RESERVED: 'Réservée',
  EXPIRED: 'Expirée',
  DELETED: 'Supprimée',
};

function formatPrice(xof: number) {
  return xof.toLocaleString('fr-SN') + ' FCFA';
}

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function AdminListingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1', 10);
  const { search, status } = sp;

  const result = await getAdminListings({ page, limit: 20, search, status });
  const listings = result.listings ?? [];

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Annonces</h1>
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {result.total} au total
        </span>
      </div>

      {/* Filtres */}
      <form className="flex gap-3 mb-6 flex-wrap">
        <input
          name="search"
          defaultValue={search}
          placeholder="Titre, marque..."
          className="flex-1 min-w-0 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={status || ''}
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="DRAFT">Brouillon</option>
          <option value="ACTIVE">Disponible</option>
          <option value="SOLD">Vendue</option>
          <option value="RESERVED">Réservée</option>
          <option value="EXPIRED">Expirée</option>
          <option value="DELETED">Supprimée</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          Filtrer
        </button>
        <a
          href="/admin/listings"
          className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-muted)] transition-colors"
        >
          Réinitialiser
        </a>
      </form>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {listings.length === 0 ? (
          <p className="text-center py-12 text-[var(--color-muted-foreground)]">
            Aucune annonce trouvée
          </p>
        ) : (
          listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3"
            >
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-muted)] shrink-0 flex items-center justify-center">
                  {listing.images[0] ? (
                    <Image
                      src={listing.images[0].url}
                      alt={listing.title}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shoes/${listing.slug}`}
                    target="_blank"
                    className="font-medium hover:underline truncate block text-sm"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{listing.brand}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {listing.seller.name} &middot; {new Date(listing.createdAt).toLocaleDateString('fr-SN')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium">{formatPrice(listing.priceXof)}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[listing.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABELS[listing.status] || listing.status}
                    </span>
                  </div>
                </div>
              </div>
              {listing.status !== 'DELETED' && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--color-border)]">
                  <ListingStatusAction
                    listingId={listing.id}
                    currentStatus={listing.status}
                  />
                  <ListingDeleteAction
                    listingId={listing.id}
                    listingTitle={listing.title}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
                <th className="text-left px-4 py-3 font-medium">Annonce</th>
                <th className="text-left px-4 py-3 font-medium">Vendeur</th>
                <th className="text-left px-4 py-3 font-medium">Prix</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-muted-foreground)]">
                    Aucune annonce trouvée
                  </td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-[var(--color-muted)]/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-muted)] shrink-0 flex items-center justify-center">
                          {listing.images[0] ? (
                            <Image
                              src={listing.images[0].url}
                              alt={listing.title}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <ShoppingBag className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/shoes/${listing.slug}`}
                            target="_blank"
                            className="font-medium hover:underline truncate block max-w-[200px]"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-xs text-[var(--color-muted-foreground)]">
                            {listing.brand}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      <p>{listing.seller.name}</p>
                      <p className="text-xs">{listing.seller.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(listing.priceXof)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[listing.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_LABELS[listing.status] || listing.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {new Date(listing.createdAt).toLocaleDateString('fr-SN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {listing.status !== 'DELETED' && (
                          <>
                            <ListingStatusAction
                              listingId={listing.id}
                              currentStatus={listing.status}
                            />
                            <ListingDeleteAction
                              listingId={listing.id}
                              listingTitle={listing.title}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          {page > 1 && (
            <a
              href={`/admin/listings?page=${page - 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}
              className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-muted)] transition-colors"
            >
              ← Précédent
            </a>
          )}
          <span className="px-4 py-2 text-sm text-[var(--color-muted-foreground)]">
            Page {page} / {result.totalPages}
          </span>
          {page < result.totalPages && (
            <a
              href={`/admin/listings?page=${page + 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}
              className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-muted)] transition-colors"
            >
              Suivant →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

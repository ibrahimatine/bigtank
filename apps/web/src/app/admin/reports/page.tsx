import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAdminReports } from '@/lib/api';
import { ReportActions } from '@/components/admin/report-actions';
import { ShoppingBag } from 'lucide-react';

export const metadata: Metadata = { title: 'Signalements' };
export const dynamic = 'force-dynamic';

const REASON_LABELS: Record<string, string> = {
  FRAUD: 'Arnaque',
  FAKE_PRODUCT: 'Contrefaçon',
  SPAM: 'Spam',
  OTHER: 'Autre',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-orange-50 text-orange-700',
  REVIEWED: 'bg-green-50 text-green-700',
  DISMISSED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  REVIEWED: 'Traité',
  DISMISSED: 'Rejeté',
};

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1', 10);
  const { status } = sp;

  const result = await getAdminReports({ page, limit: 20, status });
  const reports = result.reports ?? [];

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Signalements</h1>
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {result.total} au total
        </span>
      </div>

      {/* Filtres */}
      <form className="flex gap-3 mb-6 flex-wrap">
        <select
          name="status"
          defaultValue={status || ''}
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="REVIEWED">Traité</option>
          <option value="DISMISSED">Rejeté</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          Filtrer
        </button>
        <a
          href="/admin/reports"
          className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-muted)] transition-colors"
        >
          Réinitialiser
        </a>
      </form>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {reports.length === 0 ? (
          <p className="text-center py-12 text-[var(--color-muted-foreground)]">
            Aucun signalement trouvé
          </p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3"
            >
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-muted)] shrink-0 flex items-center justify-center">
                  {report.listing.images[0] ? (
                    <Image
                      src={report.listing.images[0].url}
                      alt={report.listing.title}
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
                    href={`/shoes/${report.listing.slug}`}
                    target="_blank"
                    className="font-medium hover:underline truncate block text-sm"
                  >
                    {report.listing.title}
                  </Link>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Signalé par {report.user.name} &middot; {REASON_LABELS[report.reason] || report.reason}
                  </p>
                  {report.description && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 line-clamp-2">
                      {report.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[report.status]}`}
                    >
                      {STATUS_LABELS[report.status]}
                    </span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {new Date(report.createdAt).toLocaleDateString('fr-SN')}
                    </span>
                  </div>
                </div>
              </div>
              {report.status === 'PENDING' && (
                <div className="mt-3 pt-2 border-t border-[var(--color-border)]">
                  <ReportActions
                    reportId={report.id}
                    listingTitle={report.listing.title}
                    sellerName={report.listing.seller.name}
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
                <th className="text-left px-4 py-3 font-medium">Signalé par</th>
                <th className="text-left px-4 py-3 font-medium">Raison</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-muted-foreground)]">
                    Aucun signalement trouvé
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-[var(--color-muted)]/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-muted)] shrink-0 flex items-center justify-center">
                          {report.listing.images[0] ? (
                            <Image
                              src={report.listing.images[0].url}
                              alt={report.listing.title}
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
                            href={`/shoes/${report.listing.slug}`}
                            target="_blank"
                            className="font-medium hover:underline truncate block max-w-[200px]"
                          >
                            {report.listing.title}
                          </Link>
                          <p className="text-xs text-[var(--color-muted-foreground)]">
                            Vendeur : {report.listing.seller.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {report.user.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                      {report.description && (
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1 max-w-[200px] truncate">
                          {report.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[report.status]}`}
                      >
                        {STATUS_LABELS[report.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {new Date(report.createdAt).toLocaleDateString('fr-SN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {report.status === 'PENDING' && (
                        <ReportActions
                          reportId={report.id}
                          listingTitle={report.listing.title}
                          sellerName={report.listing.seller.name}
                        />
                      )}
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
              href={`/admin/reports?page=${page - 1}${status ? `&status=${status}` : ''}`}
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
              href={`/admin/reports?page=${page + 1}${status ? `&status=${status}` : ''}`}
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

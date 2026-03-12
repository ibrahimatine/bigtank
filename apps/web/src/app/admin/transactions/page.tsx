import type { Metadata } from 'next';
import { getAdminTransactions } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Transactions' };
export const dynamic = 'force-dynamic';

const ACTION_LABELS: Record<string, { label: string; style: string }> = {
  PAYMENT_FREE: { label: 'Gratuit', style: 'bg-green-100 text-green-700' },
  PAYMENT_INITIATED: { label: 'Initie', style: 'bg-yellow-100 text-yellow-700' },
  PAYMENT_COMPLETED: { label: 'Paye', style: 'bg-blue-100 text-blue-700' },
  PAYMENT_FAILED: { label: 'Echoue', style: 'bg-red-100 text-red-700' },
  PAYMENT_REFUNDED: { label: 'Rembourse', style: 'bg-purple-100 text-purple-700' },
};

const METHOD_LABELS: Record<string, string> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  FREE_MONEY: 'Free Money',
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-SN').format(price) + ' FCFA';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const result = await getAdminTransactions({ page, limit: 30 });
  const logs = result.logs || [];

  const totalRevenue = logs
    .filter((l) => l.action === 'PAYMENT_COMPLETED')
    .reduce((sum, l) => sum + (l.metadata?.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="text-sm text-[var(--color-muted-foreground)]">
          {result.total} transaction{result.total !== 1 ? 's' : ''} au total
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">Cette page</p>
          <p className="text-lg font-bold">{logs.length} transactions</p>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <p className="text-xs text-[var(--color-muted-foreground)]">Revenus (cette page)</p>
          <p className="text-lg font-bold text-green-600">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Tableau */}
      {logs.length > 0 ? (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Statut</th>
                  <th className="text-left p-3 font-medium">Vendeur</th>
                  <th className="text-left p-3 font-medium">Annonce</th>
                  <th className="text-left p-3 font-medium">Methode</th>
                  <th className="text-right p-3 font-medium">Commission</th>
                  <th className="text-right p-3 font-medium">Prix annonce</th>
                  <th className="text-left p-3 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action] || {
                    label: log.action,
                    style: 'bg-gray-100 text-gray-700',
                  };
                  const method = log.metadata?.paymentMethod
                    ? METHOD_LABELS[log.metadata.paymentMethod] || log.metadata.paymentMethod
                    : '-';

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/30"
                    >
                      <td className="p-3 whitespace-nowrap text-[var(--color-muted-foreground)]">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="p-3">
                        <Badge className={actionInfo.style}>{actionInfo.label}</Badge>
                      </td>
                      <td className="p-3">
                        {log.user ? (
                          <div>
                            <p className="font-medium">{log.user.name}</p>
                            <p className="text-xs text-[var(--color-muted-foreground)]">
                              {log.user.phone || log.user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[var(--color-muted-foreground)]">-</span>
                        )}
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <p className="truncate">
                          {log.metadata?.listingTitle || log.targetId || '-'}
                        </p>
                      </td>
                      <td className="p-3 whitespace-nowrap">{method}</td>
                      <td className="p-3 text-right font-medium whitespace-nowrap">
                        {log.metadata?.amount !== undefined
                          ? formatPrice(log.metadata.amount)
                          : '-'}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap text-[var(--color-muted-foreground)]">
                        {log.metadata?.listingPrice
                          ? formatPrice(log.metadata.listingPrice)
                          : '-'}
                      </td>
                      <td className="p-3 text-xs font-mono text-[var(--color-muted-foreground)]">
                        {log.metadata?.refCommand || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Page {result.page} / {result.totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`/admin/transactions?page=${page - 1}`}
                    className="px-3 py-1 text-sm rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
                  >
                    Precedent
                  </a>
                )}
                {page < result.totalPages && (
                  <a
                    href={`/admin/transactions?page=${page + 1}`}
                    className="px-3 py-1 text-sm rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]"
                  >
                    Suivant
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">
          <p className="text-lg font-medium">Aucune transaction</p>
          <p className="text-sm mt-1">Les transactions apparaitront ici apres le premier paiement.</p>
        </div>
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import { getAdminStats } from '@/lib/api';
import { Users, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--color-muted-foreground)]">{label}</span>
        <div className={`p-2 rounded-lg ${accent || 'bg-[var(--color-muted)]'}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString('fr-SN')}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Utilisateurs" value={stats.users.total} icon={Users} />
        <StatCard label="Vendeurs" value={stats.users.sellers} icon={TrendingUp} accent="bg-green-50" />
        <StatCard label="Suspendus" value={stats.users.suspended} icon={AlertCircle} accent="bg-red-50" />
        <StatCard label="Annonces" value={stats.listings.total} icon={ShoppingBag} />
        <StatCard label="Actives" value={stats.listings.active} icon={TrendingUp} accent="bg-blue-50" />
        <StatCard label="Vendues" value={stats.listings.sold} icon={TrendingUp} accent="bg-purple-50" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="font-semibold mb-4">Gestion rapide</h2>
          <div className="space-y-2 text-sm">
            <a href="/admin/users" className="flex items-center gap-2 p-3 rounded-lg hover:bg-[var(--color-muted)] transition-colors">
              <Users className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              Gérer les utilisateurs
            </a>
            <a href="/admin/listings" className="flex items-center gap-2 p-3 rounded-lg hover:bg-[var(--color-muted)] transition-colors">
              <ShoppingBag className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              Modérer les annonces
            </a>
          </div>
        </div>

        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="font-semibold mb-4">Indicateurs</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Taux vendeurs</span>
              <span className="font-medium">
                {stats.users.total > 0
                  ? Math.round((stats.users.sellers / stats.users.total) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Annonces actives</span>
              <span className="font-medium">
                {stats.listings.total > 0
                  ? Math.round((stats.listings.active / stats.listings.total) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Taux de vente</span>
              <span className="font-medium">
                {stats.listings.total > 0
                  ? Math.round((stats.listings.sold / stats.listings.total) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

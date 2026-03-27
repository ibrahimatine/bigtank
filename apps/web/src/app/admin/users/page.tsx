import type { Metadata } from 'next';
import { getAdminUsers } from '@/lib/api';
import { UserActions } from '@/components/admin/user-actions';

export const metadata: Metadata = { title: 'Utilisateurs' };
export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, string> = {
  USER: 'Acheteur',
  SELLER: 'Vendeur',
  ADMIN: 'Admin',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  SUSPENDED: 'bg-red-50 text-red-700',
  BANNED: 'bg-gray-100 text-gray-600',
};

interface Props {
  searchParams: Promise<{ page?: string; search?: string; role?: string; status?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1', 10);
  const { search, role, status } = sp;

  const result = await getAdminUsers({ page, limit: 20, search, role, status });
  const users = result.users ?? [];

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {result.total} au total
        </span>
      </div>

      {/* Filtres */}
      <form className="flex gap-3 mb-6 flex-wrap">
        <input
          name="search"
          defaultValue={search}
          placeholder="Nom, email, téléphone..."
          className="flex-1 min-w-0 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
        />
        <select
          name="role"
          defaultValue={role || ''}
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les rôles</option>
          <option value="USER">Acheteur</option>
          <option value="SELLER">Vendeur</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          name="status"
          defaultValue={status || ''}
          className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="SUSPENDED">Suspendu</option>
          <option value="BANNED">Banni</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          Filtrer
        </button>
        <a
          href="/admin/users"
          className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-muted)] transition-colors"
        >
          Réinitialiser
        </a>
      </form>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {users.length === 0 ? (
          <p className="text-center py-12 text-[var(--color-muted-foreground)]">
            Aucun utilisateur trouvé
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                    {user.email || user.phone || '—'}
                  </p>
                  {user.suspendedReason && (
                    <p className="text-xs text-red-600 mt-0.5">{user.suspendedReason}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-muted)]">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[user.status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {user.status === 'ACTIVE' ? 'Actif' : user.status === 'SUSPENDED' ? 'Suspendu' : user.status}
                  </span>
                </div>
              </div>
              {user.role !== 'ADMIN' && (
                <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center min-h-[44px]">
                  <UserActions
                    userId={user.id}
                    userStatus={user.status}
                    userName={user.name}
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
                <th className="text-left px-4 py-3 font-medium">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium">Rôle</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Annonces</th>
                <th className="text-left px-4 py-3 font-medium">Inscrit le</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--color-muted-foreground)]">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--color-muted)]/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {user.email || user.phone || '—'}
                        </p>
                        {user.suspendedReason && (
                          <p className="text-xs text-red-600 mt-0.5">
                            {user.suspendedReason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-muted)]">
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[user.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {user.status === 'ACTIVE' ? 'Actif' : user.status === 'SUSPENDED' ? 'Suspendu' : user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {user._count.listings}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {new Date(user.createdAt).toLocaleDateString('fr-SN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== 'ADMIN' && (
                        <UserActions
                          userId={user.id}
                          userStatus={user.status}
                          userName={user.name}
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
              href={`/admin/users?page=${page - 1}${search ? `&search=${search}` : ''}${role ? `&role=${role}` : ''}${status ? `&status=${status}` : ''}`}
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
              href={`/admin/users?page=${page + 1}${search ? `&search=${search}` : ''}${role ? `&role=${role}` : ''}${status ? `&status=${status}` : ''}`}
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

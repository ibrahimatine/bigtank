'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ban, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface UserActionsProps {
  userId: string;
  userStatus: string;
  userName: string;
}

export function UserActions({ userId, userStatus, userName }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reason, setReason] = useState('');

  async function handleAction(url: string, method: string, body?: object) {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur');
      }
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate() {
    if (await handleAction(`/api/admin/users/${userId}/activate`, 'PATCH')) {
      toast.success(`${userName} réactivé`);
      router.refresh();
    }
  }

  async function handleUnban() {
    if (await handleAction(`/api/admin/users/${userId}/unban`, 'PATCH')) {
      toast.success(`${userName} débanni`);
      router.refresh();
    }
  }

  async function handleSuspend() {
    if (reason.trim().length < 5) {
      toast.error('Raison trop courte (min 5 caractères)');
      return;
    }
    if (await handleAction(`/api/admin/users/${userId}/suspend`, 'PATCH', { reason: reason.trim() })) {
      toast.success(`${userName} suspendu`);
      setShowSuspendDialog(false);
      setReason('');
      router.refresh();
    }
  }

  async function handleBan() {
    if (reason.trim().length < 5) {
      toast.error('Raison trop courte (min 5 caractères)');
      return;
    }
    if (await handleAction(`/api/admin/users/${userId}/ban`, 'PATCH', { reason: reason.trim() })) {
      toast.success(`${userName} banni — annonces supprimées`);
      setShowBanDialog(false);
      setReason('');
      router.refresh();
    }
  }

  async function handleDelete() {
    if (await handleAction(`/api/admin/users/${userId}`, 'DELETE')) {
      toast.success(`${userName} supprimé`);
      setShowDeleteDialog(false);
      router.refresh();
    }
  }

  // Banned user
  if (userStatus === 'BANNED') {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleUnban}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Débannir'}
        </button>
      </div>
    );
  }

  // Suspended user
  if (userStatus === 'SUSPENDED') {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleActivate}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Réactiver'}
        </button>
      </div>
    );
  }

  // Active user
  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowSuspendDialog(true)}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
        >
          Suspendre
        </button>
        <button
          onClick={() => setShowBanDialog(true)}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <Ban className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setShowDeleteDialog(true)}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <Link
          href={`/admin/users?search=${userId}`}
          className="text-xs px-2 py-1.5 rounded-lg hover:bg-[var(--color-muted)] transition-colors text-[var(--color-muted-foreground)]"
          title="Voir les annonces"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Modal Suspendre */}
      {showSuspendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-card)] rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-1">Suspendre {userName}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              L&apos;utilisateur ne pourra plus se connecter temporairement.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Raison de la suspension..."
              className="w-full border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none h-24 mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowSuspendDialog(false); setReason(''); }}
                className="text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSuspend}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'En cours...' : 'Suspendre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bannir */}
      {showBanDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-card)] rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-1 text-red-600">Bannir {userName}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              Toutes ses annonces actives seront supprimées et il ne pourra plus se connecter.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Raison du bannissement..."
              className="w-full border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none h-24 mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowBanDialog(false); setReason(''); }}
                className="text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleBan}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'En cours...' : 'Bannir définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Supprimer */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-card)] rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-1 text-red-600">Supprimer {userName}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              Le compte sera banni et toutes ses annonces supprimées. Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

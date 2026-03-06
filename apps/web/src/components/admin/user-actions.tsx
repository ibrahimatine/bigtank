'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UserActionsProps {
  userId: string;
  userStatus: string;
  userName: string;
}

export function UserActions({ userId, userStatus, userName }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [reason, setReason] = useState('');

  async function handleActivate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error();
      toast.success(`${userName} réactivé`);
      router.refresh();
    } catch {
      toast.error('Erreur lors de la réactivation');
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend() {
    if (reason.trim().length < 5) {
      toast.error('Raison trop courte (min 5 caractères)');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${userName} suspendu`);
      setShowSuspendDialog(false);
      setReason('');
      router.refresh();
    } catch {
      toast.error('Erreur lors de la suspension');
    } finally {
      setLoading(false);
    }
  }

  if (userStatus === 'SUSPENDED') {
    return (
      <button
        onClick={handleActivate}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        {loading ? '...' : 'Réactiver'}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowSuspendDialog(true)}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        Suspendre
      </button>

      {showSuspendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-card)] rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-1">Suspendre {userName}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              Indiquez la raison de la suspension (visible par l&apos;équipe).
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
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'En cours...' : 'Confirmer la suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

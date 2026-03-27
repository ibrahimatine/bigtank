'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function CleanupUnverifiedButton() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ count: number; users: { id: string; name: string; email: string | null; phone: string | null; createdAt: string }[] } | null>(null);

  async function handlePreview() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tools/cleanup-unverified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: false }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPreview(data);
    } catch {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tools/cleanup-unverified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`${data.deleted} compte(s) supprime(s) definitivement`);
      setPreview(null);
    } catch {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!preview ? (
        <button
          onClick={handlePreview}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Analyse...' : 'Analyser les comptes non verifies'}
        </button>
      ) : (
        <div>
          <p className="text-sm mb-3">
            <strong>{preview.count}</strong> compte(s) avec email non verifie depuis 3+ jours.
          </p>
          {preview.users.length > 0 && (
            <div className="max-h-40 overflow-y-auto mb-3 space-y-1">
              {preview.users.map((u) => (
                <p key={u.id} className="text-xs text-[var(--color-muted-foreground)]">
                  {u.name} ({u.email || u.phone || 'pas de contact'}) — inscrit le {new Date(u.createdAt).toLocaleDateString('fr-SN')}
                </p>
              ))}
              {preview.count > preview.users.length && (
                <p className="text-xs text-[var(--color-muted-foreground)] italic">
                  ... et {preview.count - preview.users.length} autre(s)
                </p>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-muted)] transition-colors"
            >
              Annuler
            </button>
            {preview.count > 0 && (
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Suppression...' : `Supprimer ${preview.count} compte(s)`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

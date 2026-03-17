'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ReportActionsProps {
  reportId: string;
  listingTitle: string;
  sellerName: string;
}

export function ReportActions({ reportId, listingTitle, sellerName }: ReportActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  async function handleReview(action: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      const labels: Record<string, string> = {
        DELETE_LISTING: 'Annonce supprimée',
        BAN_SELLER: 'Vendeur banni',
        REVIEW_ONLY: 'Signalement traité',
      };
      toast.success(labels[action] || 'Traité');
      setShowActions(false);
      router.refresh();
    } catch {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/dismiss`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      toast.success('Signalement rejeté');
      setShowActions(false);
      router.refresh();
    } catch {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowActions(true)}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Traiter
      </button>

      {showActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-card)] rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-1">Traiter le signalement</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              Annonce : <strong>{listingTitle}</strong> — Vendeur : <strong>{sellerName}</strong>
            </p>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleReview('DELETE_LISTING')}
                disabled={loading}
                className="w-full text-left text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Supprimer l&apos;annonce
              </button>
              <button
                onClick={() => handleReview('BAN_SELLER')}
                disabled={loading}
                className="w-full text-left text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Bannir le vendeur (supprime aussi l&apos;annonce)
              </button>
              <button
                onClick={() => handleReview('REVIEW_ONLY')}
                disabled={loading}
                className="w-full text-left text-sm px-4 py-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Marquer comme examiné (aucune action)
              </button>
              <button
                onClick={handleDismiss}
                disabled={loading}
                className="w-full text-left text-sm px-4 py-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Rejeter le signalement
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowActions(false)}
                className="text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Flag } from 'lucide-react';

const REASONS = [
  { value: 'FRAUD', label: 'Arnaque / Fraude' },
  { value: 'FAKE_PRODUCT', label: 'Produit contrefait' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OTHER', label: 'Autre' },
];

export function ReportListingButton({ listingId }: { listingId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!reason) {
      toast.error('Veuillez choisir une raison');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur');
      }
      toast.success('Signalement envoyé. Merci !');
      setShowModal(false);
      setReason('');
      setDescription('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du signalement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-red-600 transition-colors"
      >
        <Flag className="h-4 w-4" />
        Signaler
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-card)] rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
            <h3 className="font-semibold mb-1">Signaler cette annonce</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              Pourquoi souhaitez-vous signaler cette annonce ?
            </p>
            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reason === r.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails supplémentaires (optionnel)..."
              className="w-full border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none h-20 mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowModal(false); setReason(''); setDescription(''); }}
                className="text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Envoyer le signalement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function MassEmailForm() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tools/mass-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Email envoyé à ${data.sent}/${data.total} utilisateurs`);
      setShowConfirm(false);
      setSubject('');
      setBody('');
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Sujet de l'email"
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Contenu de l'email..."
          className="w-full border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none h-32 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <button
          onClick={() => setShowConfirm(true)}
          disabled={subject.length < 3 || body.length < 10}
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-card)] rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-2">Confirmer l&apos;envoi</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              Cet email sera envoyé a <strong>tous les utilisateurs actifs</strong>. Continuer ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Envoi en cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

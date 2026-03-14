'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export function ReindexButton() {
  const [loading, setLoading] = useState(false);

  async function handleReindex() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reindex', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Erreur');
      toast.success(`Reindex terminé : ${data.reindexed ?? 0} annonces`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du reindex');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReindex}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Reindex...' : 'Reindexer'}
    </button>
  );
}

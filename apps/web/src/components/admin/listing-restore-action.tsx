'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

export function ListingRestoreAction({ listingId, listingTitle }: { listingId: string; listingTitle: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/restore`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      toast.success(`"${listingTitle}" restaurée en brouillon`);
      router.refresh();
    } catch {
      toast.error('Erreur lors de la restauration');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRestore}
      disabled={loading}
      className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
      title="Restaurer l'annonce"
    >
      <RotateCcw className="h-4 w-4" />
    </button>
  );
}

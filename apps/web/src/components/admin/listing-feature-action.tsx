'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

export function ListingFeatureAction({ listingId, isFeatured }: { listingId: string; isFeatured: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/feature`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      toast.success(isFeatured ? 'Annonce retirée de la mise en avant' : 'Annonce mise en avant');
      router.refresh();
    } catch {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isFeatured
          ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
          : 'text-gray-400 hover:bg-gray-50 hover:text-yellow-600'
      }`}
      title={isFeatured ? 'Retirer la mise en avant' : 'Mettre en avant'}
    >
      <Star className={`h-4 w-4 ${isFeatured ? 'fill-current' : ''}`} />
    </button>
  );
}

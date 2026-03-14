'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon', color: 'text-gray-700 bg-gray-50' },
  { value: 'ACTIVE', label: 'Disponible', color: 'text-green-700 bg-green-50' },
  { value: 'SOLD', label: 'Vendue', color: 'text-blue-700 bg-blue-50' },
  { value: 'RESERVED', label: 'Réservée', color: 'text-yellow-700 bg-yellow-50' },
  { value: 'EXPIRED', label: 'Expirée', color: 'text-orange-700 bg-orange-50' },
];

interface ListingStatusActionProps {
  listingId: string;
  currentStatus: string;
}

export function ListingStatusAction({ listingId, currentStatus }: ListingStatusActionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleChange(newStatus: string) {
    if (newStatus === currentStatus) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || err?.error || 'Erreur inconnue');
      }
      const label = STATUS_OPTIONS.find((o) => o.value === newStatus)?.label || newStatus;
      toast.success(`Statut changé : ${label}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error && err.message !== 'Erreur inconnue' ? err.message : 'Erreur lors du changement de statut');
    } finally {
      setLoading(false);
    }
  }

  const options = STATUS_OPTIONS.filter((o) => o.value !== currentStatus);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        title="Changer le statut"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </button>

      {/* Bottom sheet modal — works on all screen sizes */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="relative w-full sm:max-w-xs bg-[var(--color-card)] rounded-t-2xl sm:rounded-2xl p-4 pb-6 sm:pb-4 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Changer le statut</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--color-muted)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange(option.value)}
                  disabled={loading}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${option.color} hover:opacity-80`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
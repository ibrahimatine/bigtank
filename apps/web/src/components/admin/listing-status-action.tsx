'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon', color: 'text-gray-700' },
  { value: 'ACTIVE', label: 'Disponible', color: 'text-green-700' },
  { value: 'SOLD', label: 'Vendue', color: 'text-blue-700' },
  { value: 'RESERVED', label: 'Reservee', color: 'text-yellow-700' },
  { value: 'EXPIRED', label: 'Expiree', color: 'text-orange-700' },
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
      toast.success(`Statut change : ${label}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error && err.message !== 'Erreur inconnue' ? err.message : 'Erreur lors du changement de statut');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        title="Changer le statut"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden min-w-[140px]">
            {STATUS_OPTIONS.filter((o) => o.value !== currentStatus).map((option) => (
              <button
                key={option.value}
                onClick={() => handleChange(option.value)}
                disabled={loading}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-muted)] transition-colors ${option.color}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

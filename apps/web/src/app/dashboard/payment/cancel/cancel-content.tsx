'use client';

import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function CancelContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');

  return (
    <div className="min-h-screen bg-[var(--color-muted)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[var(--color-card)] text-[var(--color-card-foreground)] rounded-2xl shadow-sm border border-[var(--color-border)] p-8 text-center">
        <div className="flex justify-center mb-4">
          <XCircle className="h-16 w-16 text-red-400" />
        </div>
        <h1 className="text-xl font-bold mb-2">
          Paiement annulé
        </h1>
        <p className="text-[var(--color-muted-foreground)] text-sm mb-6">
          Votre annonce a été sauvegardée en brouillon. Vous pouvez réessayer
          le paiement à tout moment depuis votre tableau de bord.
        </p>
        <div className="flex flex-col gap-3">
          {listingId && (
            <Link
              href={`/dashboard/pay/${listingId}`}
              className="w-full bg-[var(--color-accent)] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              Réessayer le paiement
            </Link>
          )}
          <Link
            href="/dashboard"
            className="w-full text-[var(--color-muted-foreground)] font-medium py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-sm"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}

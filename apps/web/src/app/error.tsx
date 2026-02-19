'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-5xl font-bold text-[var(--color-accent)] mb-4">Oops</p>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold mb-2">
        Une erreur est survenue
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-8 max-w-sm">
        Quelque chose s&apos;est mal passe. Rafraichissez la page ou revenez a l&apos;accueil.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Reessayer
        </Button>
        <Button
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90"
          onClick={() => (window.location.href = '/')}
        >
          Retour a l&apos;accueil
        </Button>
      </div>
    </div>
  );
}

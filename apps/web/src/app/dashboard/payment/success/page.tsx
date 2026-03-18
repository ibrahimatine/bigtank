import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[var(--color-muted)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[var(--color-card)] text-[var(--color-card-foreground)] rounded-2xl shadow-sm border border-[var(--color-border)] p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">
          Annonce publiée avec succès !
        </h1>
        <p className="text-[var(--color-muted-foreground)] text-sm mb-6">
          Votre annonce est maintenant visible par tous les acheteurs.
          Elle restera active pendant <strong>60 jours</strong>.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full bg-[var(--color-primary)] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            Voir mes annonces
          </Link>
          <Link
            href="/dashboard/new"
            className="w-full text-[var(--color-foreground)] font-medium py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-sm"
          >
            Publier une autre annonce
          </Link>
        </div>
      </div>
    </div>
  );
}

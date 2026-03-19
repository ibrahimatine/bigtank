import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 py-24 text-center">
      <p className="font-[family-name:var(--font-display)] text-8xl sm:text-9xl tracking-wider text-[var(--color-accent)]">
        404
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wider">
        PAGE INTROUVABLE
      </h1>
      <p className="mt-3 text-sm text-[var(--color-muted-foreground)] max-w-md mx-auto">
        Cette page n&apos;existe pas ou a ete deplacee. Verifiez l&apos;adresse ou explorez nos annonces.
      </p>
      <div className="flex items-center justify-center gap-4 mt-8">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors shadow-lg shadow-[var(--color-accent)]/20"
        >
          Accueil
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 rounded-xl border border-[var(--color-border)] font-medium text-sm hover:bg-[var(--color-muted)] transition-colors"
        >
          Explorer les annonces
        </Link>
      </div>
    </div>
  );
}

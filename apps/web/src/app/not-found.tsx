import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 py-24 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-6xl font-bold text-[var(--color-primary)]">
        404
      </h1>
      <p className="mt-4 text-lg text-[var(--color-muted-foreground)]">
        Cette annonce n&apos;existe pas ou a ete supprimee.
      </p>
      <div className="flex items-center justify-center gap-4 mt-8">
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          Accueil
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 rounded-lg border border-[var(--color-border)] font-medium hover:bg-[var(--color-muted)] transition-colors"
        >
          Explorer les annonces
        </Link>
      </div>
    </div>
  );
}

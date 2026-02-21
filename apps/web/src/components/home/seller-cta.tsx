'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';

export function SellerCta() {
  const { user } = useAuth();
  const isSeller = user?.role === 'SELLER' || user?.role === 'ADMIN';

  // Vendeur connecte : proposer de publier une annonce
  if (isSeller) {
    return (
      <section className="bg-[var(--color-primary)] text-white py-14">
        <div className="max-w-[1280px] mx-auto px-4 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
            Pret a publier une annonce ?
          </h2>
          <p className="mt-3 text-white/60 max-w-sm mx-auto text-sm">
            Vos prochaines sneakers trouvent preneur en quelques minutes.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/dashboard/new"
              className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              Publier une annonce
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl border border-white/20 text-white/80 font-medium text-sm hover:bg-white/10 transition-colors"
            >
              Mes annonces
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Acheteur ou non connecte : proposer de devenir vendeur
  return (
    <section className="bg-[var(--color-primary)] text-white py-14">
      <div className="max-w-[1280px] mx-auto px-4 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
          Vous avez des chaussures a vendre ?
        </h2>
        <p className="mt-3 text-white/60 max-w-sm mx-auto text-sm">
          Publiez gratuitement. Touchez des milliers d&apos;acheteurs au Senegal.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          {user ? (
            // Connecte mais pas vendeur : rediriger vers profil pour activer le mode vendeur
            <Link
              href="/profile"
              className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              Activer le mode vendeur
            </Link>
          ) : (
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              Creer un compte vendeur
            </Link>
          )}
          <Link
            href="/search"
            className="px-6 py-3 rounded-xl border border-white/20 text-white/80 font-medium text-sm hover:bg-white/10 transition-colors"
          >
            Explorer d&apos;abord
          </Link>
        </div>
      </div>
    </section>
  );
}

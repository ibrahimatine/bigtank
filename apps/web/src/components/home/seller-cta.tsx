'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';

export function SellerCta() {
  const { user } = useAuth();
  const isSeller = user?.role === 'SELLER' || user?.role === 'ADMIN';

  if (isSeller) {
    return (
      <section className="relative bg-[var(--color-primary)] text-white py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2l2 3.5-2 3zm0-20V18' fill='%23fff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-[1280px] mx-auto px-4 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl tracking-wider">
            PUBLIEZ UNE ANNONCE
          </h2>
          <p className="mt-4 text-white/50 max-w-sm mx-auto text-sm">
            Vos prochaines sneakers trouvent preneur en quelques minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/dashboard/new"
              className="px-7 py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              Publier une annonce
            </Link>
            <Link
              href="/dashboard"
              className="px-7 py-3.5 rounded-xl border border-white/20 text-white/80 font-medium text-sm hover:bg-white/5 transition-colors"
            >
              Mes annonces
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-[var(--color-primary)] text-white py-16 sm:py-20 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2l2 3.5-2 3zm0-20V18' fill='%23fff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      }} />
      <div className="relative max-w-[1280px] mx-auto px-4 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl tracking-wider">
          VENDEZ VOS CHAUSSURES
        </h2>
        <p className="mt-4 text-white/50 max-w-sm mx-auto text-sm">
          Publiez gratuitement. Touchez des milliers d&apos;acheteurs au Senegal.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          {user ? (
            <Link
              href="/profile"
              className="px-7 py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              Activer le mode vendeur
            </Link>
          ) : (
            <Link
              href="/register"
              className="px-7 py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              Creer un compte vendeur
            </Link>
          )}
          <Link
            href="/search"
            className="px-7 py-3.5 rounded-xl border border-white/20 text-white/80 font-medium text-sm hover:bg-white/5 transition-colors"
          >
            Explorer d&apos;abord
          </Link>
        </div>
      </div>
    </section>
  );
}

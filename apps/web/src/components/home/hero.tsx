'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

export function Hero() {
  const scrollToListings = () => {
    document.getElementById('recent-listings')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-[var(--color-primary)] text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative max-w-[1280px] mx-auto px-4 py-14 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <span className="text-xs font-medium text-white/60 tracking-wide">
              Marketplace #1 au Senegal
            </span>
          </div>

          {/* Titre */}
          <h1 className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <span className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-8xl leading-[0.9] tracking-wider block">
              ACHETEZ &
            </span>
            <span className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-8xl leading-[0.9] tracking-wider block">
              VENDEZ VOS
            </span>
            <span className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-8xl leading-[0.9] tracking-wider text-[var(--color-accent)] block">
              SNEAKERS
            </span>
          </h1>

          <p className="mt-5 text-white/50 max-w-md text-sm sm:text-base leading-relaxed animate-fade-up" style={{ animationDelay: '200ms' }}>
            Nike, Jordan, Adidas et plus — toutes tailles, du 36 au 50+. Paiement securise via Wave, Orange Money et Free Money.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mt-8 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={scrollToListings}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              <Search className="h-4 w-4" />
              Explorer les annonces
            </button>
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-xl border border-white/20 text-white/80 font-medium text-sm hover:bg-white/5 transition-colors"
            >
              Vendre mes chaussures
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-10 pt-8 border-t border-white/10 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wider text-white">100%</p>
              <p className="text-[11px] text-white/40 mt-0.5">Gratuit pour les acheteurs</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wider text-white">FCFA</p>
              <p className="text-[11px] text-white/40 mt-0.5">Prix du marche local</p>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="hidden sm:block">
              <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wider text-white">🇸🇳</p>
              <p className="text-[11px] text-white/40 mt-0.5">Made in Senegal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

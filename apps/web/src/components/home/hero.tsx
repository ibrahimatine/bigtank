'use client';

import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

export function Hero() {
  const { user } = useAuth();
  const scrollToListings = () => {
    document.getElementById('recent-listings')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-[var(--color-primary)] text-white overflow-hidden">
      {/* Sneaker pattern background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M10 60c0-4 4-8 12-10s16-2 20 0 6 6 8 10 4 10 8 12 10 2 16 0 10-6 10-10v-8c0-4-2-10-4-12s-6-4-10-4-8 2-12 4-8 4-14 4-12-2-16-4-6-4-8-8 0-10 4-12 10-4 16-2 12 4 14 8'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Floating sneaker silhouettes */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-center justify-center opacity-[0.06]">
        <svg viewBox="0 0 200 140" className="w-[500px] h-[350px]" fill="white">
          <path d="M20 100c0-8 5-15 15-18s20-3 28-1 14 8 18 14 6 14 12 18 14 4 22 2 14-8 16-14 2-14 0-20-6-12-12-16-14-6-22-6-16 2-22 6-12 8-18 8-14-2-18-6-6-8-4-14 4-12 10-14 14-4 20-2 12 4 16 10" />
        </svg>
      </div>

      <div className="relative max-w-[1280px] mx-auto px-4 py-14 sm:py-20 lg:py-28">
        <div className="max-w-2xl">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <span className="text-xs font-medium text-white/60 tracking-wide">
              Marketplace de chaussures #1 au Senegal
            </span>
          </div>

          {/* Titre */}
          <h1 className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <span className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-8xl leading-[0.9] tracking-wider block">
              TROUVEZ VOS
            </span>
            <span className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-8xl leading-[0.9] tracking-wider text-[var(--color-accent)] block">
              CHAUSSURES
            </span>
            <span className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl lg:text-8xl leading-[0.9] tracking-wider block">
              PARFAITES
            </span>
          </h1>

          <p className="mt-5 text-white/50 max-w-md text-sm sm:text-base leading-relaxed animate-fade-up" style={{ animationDelay: '200ms' }}>
            Nike, Jordan, Adidas et plus — <span className="text-white/80 font-semibold">toutes tailles du 36 au 50+</span>. Achat et vente entre particuliers au Senegal.
          </p>

          {/* Tailles populaires */}
          <div className="flex flex-wrap gap-2 mt-5 animate-fade-up" style={{ animationDelay: '250ms' }}>
            {['38', '40', '42', '44', '46', '48+'].map((size) => (
              <Link
                key={size}
                href={`/search?sizeEuMin=${size.replace('+', '')}`}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
              >
                EU {size}
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mt-8 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={scrollToListings}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent)]/90 transition-colors shadow-lg shadow-[var(--color-accent)]/20"
            >
              <Search className="h-4 w-4" />
              Explorer les annonces
            </button>
            <Link
              href={user ? '/dashboard/new' : '/register'}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 text-white/80 font-medium text-sm hover:bg-white/5 transition-colors"
            >
              Vendre mes chaussures
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 sm:gap-8 mt-10 pt-8 border-t border-white/10 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wider text-white">36-50+</p>
              <p className="text-[11px] text-white/40 mt-0.5">Toutes les pointures</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wider text-white">FCFA</p>
              <p className="text-[11px] text-white/40 mt-0.5">Prix du marche local</p>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="hidden sm:block">
              <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wider text-white">0 F</p>
              <p className="text-[11px] text-white/40 mt-0.5">Gratuit pour les acheteurs</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

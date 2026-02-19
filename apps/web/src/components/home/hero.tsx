'use client';

import Link from 'next/link';
import { ArrowDown } from 'lucide-react';

export function Hero() {
  const scrollToListings = () => {
    document.getElementById('recent-listings')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-[var(--color-primary)] text-white py-12 sm:py-16">
      <div className="max-w-[1280px] mx-auto px-4 text-center">
        <p className="text-[var(--color-accent)] text-xs font-semibold tracking-widest uppercase mb-3">
          Marketplace #1 au Senegal
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
          Chaussures{' '}
          <span className="text-[var(--color-accent)]">Grandes Tailles</span>
          <br className="hidden sm:block" />
          {' '}EU 46 et plus
        </h1>
        <p className="mt-3 text-white/60 max-w-sm mx-auto text-sm">
          Nike, Jordan, Adidas et bien d&apos;autres — livrables partout au Senegal.
        </p>

        <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={scrollToListings}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent)]/90 transition-colors text-sm"
          >
            Explorer les chaussures
            <ArrowDown className="h-4 w-4" />
          </button>
          <Link
            href="/search"
            className="px-6 py-3 rounded-xl border border-white/20 text-white/80 font-medium hover:bg-white/10 transition-colors text-sm"
          >
            Toutes les annonces
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-white/30">
          <span>Wave</span>
          <span className="w-px h-3 bg-white/20" />
          <span>Orange Money</span>
          <span className="w-px h-3 bg-white/20" />
          <span>Free Money</span>
        </div>
      </div>
    </section>
  );
}

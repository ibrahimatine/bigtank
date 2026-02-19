'use client';

import { ArrowDown } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';

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

        {/* Barre de recherche prominente dans le hero */}
        <div className="mt-7 max-w-lg mx-auto">
          <SearchBar />
        </div>

        <button
          onClick={scrollToListings}
          className="mt-5 flex items-center gap-1.5 mx-auto text-white/40 hover:text-white/70 transition-colors text-xs"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Explorer les annonces
        </button>
      </div>
    </section>
  );
}

import { SearchBar } from '@/components/search/search-bar';

export function Hero() {
  return (
    <section className="bg-[var(--color-primary)] text-white py-16 sm:py-24">
      <div className="max-w-[1280px] mx-auto px-4 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl font-bold leading-tight">
          Chaussures <span className="text-[var(--color-accent)]">Grandes Tailles</span>
          <br />
          au Senegal
        </h1>
        <p className="mt-4 text-white/70 max-w-md mx-auto">
          Trouvez votre paire en taille 46 et plus. Nike, Jordan, Adidas et bien
          d&apos;autres.
        </p>
        <div className="mt-8 max-w-lg mx-auto">
          <SearchBar />
        </div>
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/50">
          <span>Wave</span>
          <span>Orange Money</span>
          <span>Free Money</span>
        </div>
      </div>
    </section>
  );
}

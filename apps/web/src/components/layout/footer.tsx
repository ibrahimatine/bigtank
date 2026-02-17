import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[var(--color-secondary)] text-white/80 mt-16">
      <div className="max-w-[1280px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-3">
              Big<span className="text-[var(--color-accent)]">Tank</span>
            </h3>
            <p className="text-sm">
              La marketplace N°1 pour les chaussures grandes tailles au Senegal.
            </p>
            <p className="text-xs mt-2 text-white/50">Built for Bigger Steps</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Explorer</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="hover:text-white transition-colors">
                  Toutes les annonces
                </Link>
              </li>
              <li>
                <Link href="/search?brand=Nike" className="hover:text-white transition-colors">
                  Nike
                </Link>
              </li>
              <li>
                <Link href="/search?brand=Jordan" className="hover:text-white transition-colors">
                  Jordan
                </Link>
              </li>
              <li>
                <Link href="/search?brand=Adidas" className="hover:text-white transition-colors">
                  Adidas
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Tailles</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search?sizeEuMin=46&sizeEuMax=46" className="hover:text-white transition-colors">
                  EU 46
                </Link>
              </li>
              <li>
                <Link href="/search?sizeEuMin=47&sizeEuMax=47" className="hover:text-white transition-colors">
                  EU 47
                </Link>
              </li>
              <li>
                <Link href="/search?sizeEuMin=48&sizeEuMax=48" className="hover:text-white transition-colors">
                  EU 48
                </Link>
              </li>
              <li>
                <Link href="/search?sizeEuMin=49" className="hover:text-white transition-colors">
                  EU 49+
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Paiements acceptes</h4>
            <ul className="space-y-2 text-sm">
              <li>Wave</li>
              <li>Orange Money</li>
              <li>Free Money</li>
              <li>Carte bancaire</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/50">
          <p>&copy; {new Date().getFullYear()} BigTank. Tous droits reserves.</p>
          <p>Made in Senegal 🇸🇳</p>
        </div>
      </div>
    </footer>
  );
}

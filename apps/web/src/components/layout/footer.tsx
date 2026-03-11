import Link from 'next/link';

const PAYMENT_METHODS = [
  { label: 'Wave', color: '#1BA8FF' },
  { label: 'Orange Money', color: '#FF6600' },
  { label: 'Free Money', color: '#E30613' },
  { label: 'Carte bancaire', color: '#6B7280' },
];

export function Footer() {
  return (
    <footer className="bg-[var(--color-secondary)] text-white/70 mt-8">
      <div className="max-w-[1280px] mx-auto px-4 pt-8 pb-4">

        {/* Grille principale */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-white/10">

          {/* Branding */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-3">
              Sama<span className="text-[var(--color-accent)]">dal</span>
            </h3>
            <p className="text-sm leading-relaxed">
              La marketplace de reference pour acheter et vendre des chaussures au Senegal.
            </p>
            <p className="text-xs mt-3 text-white/30 italic">Votre prochaine paire vous attend</p>
          </div>

          {/* Explorer */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-2">Explorer</h4>
            <ul className="space-y-1.5 text-sm">
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
              <li>
                <Link href="/search?sizeEuMin=49" className="hover:text-white transition-colors">
                  Taille EU 49+
                </Link>
              </li>
            </ul>
          </div>

          {/* Liens */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-2">Informations</h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  A propos
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Conditions d&apos;utilisation
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Confidentialite
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Paiements */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-2">Moyens de paiement</h4>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(({ label, color }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/80"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </span>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-3 leading-relaxed">
              Transactions securisees via nos partenaires de paiement locaux.
            </p>
          </div>
        </div>

        {/* Bas de footer */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/30">
          <p>&copy; {new Date().getFullYear()} Samadal. Tous droits reserves.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-white/60 transition-colors">CGU</Link>
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Confidentialite</Link>
            <span>Made in Senegal 🇸🇳</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

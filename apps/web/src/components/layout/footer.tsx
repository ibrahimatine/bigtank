import Link from 'next/link';

const PAYMENT_METHODS = [
  { label: 'Wave', color: '#1BA8FF' },
  { label: 'Orange Money', color: '#FF6600' },
  { label: 'Free Money', color: '#E30613' },
  { label: 'Carte bancaire', color: '#6B7280' },
];

export function Footer() {
  return (
    <footer className="bg-[var(--color-primary)] text-white/70 mt-8">
      <div className="max-w-[1280px] mx-auto px-4 pt-10 pb-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/10">

          {/* Branding */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-9 w-9" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
                <path d="M10 21.5c0-1.2.8-2.2 2.4-2.8 1.6-.6 3-.4 4.2-1.2s1.6-2.2 2-3.4.8-2.4 1.8-3.2 2.2-.8 3-.4" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <circle cx="11" cy="22.5" r="1.2" fill="white" opacity="0.6" />
                <circle cx="14.5" cy="18" r="0.8" fill="white" opacity="0.4" />
              </svg>
              <h3 className="font-[family-name:var(--font-display)] text-3xl tracking-[0.08em] text-white font-bold">
                samadal
              </h3>
            </div>
            <p className="text-sm leading-relaxed">
              La marketplace de chaussures de reference au Senegal. Toutes tailles du 36 au 50+.
            </p>
            <p className="text-xs mt-3 text-white/30">Votre prochaine paire vous attend</p>
          </div>

          {/* Explorer */}
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] text-white mb-3">EXPLORER</h4>
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
              <li>
                <Link href="/search?sizeEuMin=46" className="hover:text-white transition-colors">
                  Taille EU 46+
                </Link>
              </li>
            </ul>
          </div>

          {/* Liens */}
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] text-white mb-3">INFORMATIONS</h4>
            <ul className="space-y-2 text-sm">
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
            <h4 className="font-[family-name:var(--font-display)] text-sm tracking-[0.2em] text-white mb-3">PAIEMENTS</h4>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(({ label, color }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80"
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

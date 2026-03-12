import { ShieldCheck, Search, Tag, Ruler } from 'lucide-react';
import { Hero } from '@/components/home/hero';
import { FilterableListings } from '@/components/home/filterable-listings';
import { SellerCta } from '@/components/home/seller-cta';
import { generateWebsiteJsonLd } from '@/lib/seo';

const WHY_ITEMS = [
  {
    icon: Ruler,
    title: 'DU 36 AU 50+',
    desc: 'Petites ou grandes pointures, trouvez enfin la paire a votre taille. Fini les ruptures de stock.',
  },
  {
    icon: Tag,
    title: 'PRIX JUSTES EN FCFA',
    desc: 'Achetez Nike, Jordan, Adidas entre particuliers au Senegal. Prix du marche local, negociables.',
  },
  {
    icon: ShieldCheck,
    title: 'PAIEMENT SECURISE',
    desc: 'Wave, Orange Money ou Free Money. Fonds securises jusqu\'a confirmation de reception.',
  },
  {
    icon: Search,
    title: 'TROUVEZ EN 30 SEC',
    desc: 'Filtrez par marque, taille et budget. Recherche instantanee parmi toutes les annonces.',
  },
];

export default function HomePage() {
  const jsonLd = generateWebsiteJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero />

      <FilterableListings />

      {/* Pourquoi Samadal */}
      <section className="bg-[var(--color-card)] border-t border-[var(--color-border)] py-16 sm:py-20">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-5xl tracking-wider text-center mb-3">
            POURQUOI SAMADAL ?
          </h2>
          <p className="text-center text-sm text-[var(--color-muted-foreground)] mb-12 max-w-md mx-auto">
            La marketplace de chaussures de reference en Afrique de l&apos;Ouest.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {WHY_ITEMS.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="group relative p-6 rounded-2xl bg-[var(--color-background)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 group-hover:bg-[var(--color-accent)]/20 flex items-center justify-center mb-4 transition-colors">
                  <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-lg tracking-wider mb-2">{title}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)] group-hover:text-white/60 leading-relaxed transition-colors">{desc}</p>
                <span className="absolute top-4 right-4 font-[family-name:var(--font-display)] text-4xl text-[var(--color-border)] group-hover:text-white/10 transition-colors">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SellerCta />
    </>
  );
}

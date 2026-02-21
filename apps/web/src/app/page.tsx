import Link from 'next/link';
import { Suspense } from 'react';
import { ShieldCheck, Search, Tag } from 'lucide-react';
import { Hero } from '@/components/home/hero';
import { RecentListings } from '@/components/home/recent-listings';
import { SellerCta } from '@/components/home/seller-cta';
import { ListingGridSkeleton } from '@/components/listing/listing-grid';
import { generateWebsiteJsonLd } from '@/lib/seo';

const QUICK_FILTERS = [
  { label: 'Nike', href: '/search?brand=Nike' },
  { label: 'Jordan', href: '/search?brand=Jordan' },
  { label: 'Adidas', href: '/search?brand=Adidas' },
  { label: 'New Balance', href: '/search?brand=New Balance' },
  { label: 'EU 46', href: '/search?sizeEuMin=46&sizeEuMax=46' },
  { label: 'EU 47', href: '/search?sizeEuMin=47&sizeEuMax=47' },
  { label: 'EU 48', href: '/search?sizeEuMin=48&sizeEuMax=48' },
  { label: 'EU 49+', href: '/search?sizeEuMin=49' },
  { label: 'Comme neuf', href: '/search?condition=LIKE_NEW' },
  { label: 'Dakar', href: '/search?region=Dakar' },
];

const WHY_ITEMS = [
  {
    icon: Search,
    title: 'Specialise grandes tailles',
    desc: 'Uniquement des pointures EU 46 et plus. Fini de chercher parmi des milliers d\'articles pour trouver votre taille.',
  },
  {
    icon: Tag,
    title: 'Prix du marche local',
    desc: 'Achetez et vendez entre particuliers au Senegal. Des prix justes, negociables, en FCFA.',
  },
  {
    icon: ShieldCheck,
    title: 'Transactions securisees',
    desc: 'Paiement via Wave, Orange Money ou Free Money. Fonds securises jusqu\'a confirmation de reception.',
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

      {/* Filtres rapides — scroll horizontal mobile */}
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {QUICK_FILTERS.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="shrink-0 px-3 py-1.5 rounded-full border border-[var(--color-border)] text-xs font-medium text-[var(--color-foreground)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors whitespace-nowrap"
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Annonces recentes */}
      <Suspense
        fallback={
          <div className="max-w-[1280px] mx-auto px-4 py-12">
            <ListingGridSkeleton />
          </div>
        }
      >
        <RecentListings />
      </Suspense>

      {/* Pourquoi BigTank ? */}
      <section className="bg-white border-t border-[var(--color-border)] py-16">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-center mb-2">
            Pourquoi BigTank ?
          </h2>
          <p className="text-center text-sm text-[var(--color-muted-foreground)] mb-10 max-w-md mx-auto">
            La premiere marketplace dediee aux grandes pointures en Afrique de l&apos;Ouest.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {WHY_ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-3 p-6 rounded-xl border border-[var(--color-border)] hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA vendeur — contextuel selon le role */}
      <SellerCta />
    </>
  );
}

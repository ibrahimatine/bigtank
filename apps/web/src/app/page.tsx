import { Suspense } from 'react';
import { Hero } from '@/components/home/hero';
import { RecentListings } from '@/components/home/recent-listings';
import { ListingGridSkeleton } from '@/components/listing/listing-grid';
import { generateWebsiteJsonLd } from '@/lib/seo';

export default function HomePage() {
  const jsonLd = generateWebsiteJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Suspense
        fallback={
          <div className="max-w-[1280px] mx-auto px-4 py-12">
            <ListingGridSkeleton />
          </div>
        }
      >
        <RecentListings />
      </Suspense>

      <section className="bg-[var(--color-primary)] text-white py-16 mt-8">
        <div className="max-w-[1280px] mx-auto px-4 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
            Vous avez des chaussures a vendre ?
          </h2>
          <p className="mt-3 text-white/70 max-w-md mx-auto">
            Publiez votre annonce gratuitement et touchez des milliers d&apos;acheteurs
            au Senegal.
          </p>
        </div>
      </section>
    </>
  );
}

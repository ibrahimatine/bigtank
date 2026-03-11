import type { ListingDetail } from './api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://samadal.net';

export function generateListingJsonLd(listing: ListingDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    image: listing.images.map((img) => img.url),
    brand: {
      '@type': 'Brand',
      name: listing.brand,
    },
    offers: {
      '@type': 'Offer',
      price: listing.priceXof,
      priceCurrency: 'XOF',
      availability:
        listing.status === 'ACTIVE'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      itemCondition:
        listing.condition === 'NEW'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'Person',
        name: listing.seller.name,
      },
    },
    url: `${SITE_URL}/shoes/${listing.slug}`,
    sku: listing.id,
    color: listing.color,
  };
}

export function generateWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Samadal',
    url: SITE_URL,
    description: 'Marketplace de chaussures grandes tailles au Senegal',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?query={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

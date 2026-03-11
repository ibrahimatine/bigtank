import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://samadal.net';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchAllSlugs(): Promise<{ slug: string; updatedAt?: string }[]> {
  const slugs: { slug: string; updatedAt?: string }[] = [];

  try {
    // Récupère jusqu'à 500 annonces actives pour le sitemap
    const res = await fetch(`${API_BASE}/listings/search?limit=500&sortBy=date`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return slugs;

    const json = await res.json();
    const data = Array.isArray(json) ? json : (json.data ?? []);
    const items: Array<{ slug: string; createdAt?: number }> = Array.isArray(data)
      ? data
      : (data.data ?? []);

    for (const item of items) {
      if (item.slug) {
        slugs.push({
          slug: item.slug,
          updatedAt: item.createdAt
            ? new Date(item.createdAt < 1e10 ? item.createdAt * 1000 : item.createdAt).toISOString()
            : undefined,
        });
      }
    }
  } catch {
    // En cas d'erreur, retourner les routes statiques uniquement
  }

  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchAllSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const listingRoutes: MetadataRoute.Sitemap = slugs.map(({ slug, updatedAt }) => ({
    url: `${BASE_URL}/shoes/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...listingRoutes];
}

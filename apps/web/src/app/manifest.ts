import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Samadal',
    short_name: 'Samadal',
    description: 'Marketplace de chaussures au Senegal',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#e94560',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}

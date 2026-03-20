import withSerwist from '@serwist/next';
import { withSentryConfig } from '@sentry/nextjs';

const isVercelPreview = process.env.VERCEL_ENV === 'preview';

const withSerwistConfig = withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: isVercelPreview,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Le linter ESLint legacy a un conflit avec la nouvelle config flat
    // Ca ne bloque pas la compilation, juste un probleme de compatibilite
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@samadal/shared-types', '@samadal/shared-utils'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
    ],
  },
};

export default withSentryConfig(withSerwistConfig(nextConfig), {
  silent: true,
  disableLogger: true,
});

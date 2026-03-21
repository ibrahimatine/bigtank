import type { Metadata } from 'next';
import { Outfit, Bebas_Neue } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AuthProvider } from '@/components/providers/auth-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://samadal.net';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Samadal — La Marketplace de Chaussures au Senegal',
    template: '%s | Samadal',
  },
  description:
    'La marketplace N°1 pour acheter et vendre des chaussures au Senegal. Toutes tailles, toutes marques. Wave, Orange Money, Free Money acceptes.',
  keywords: [
    'chaussures',
    'Senegal',
    'marketplace',
    'sneakers',
    'Nike',
    'Jordan',
    'Adidas',
    'achat vente chaussures',
    'toutes tailles',
  ],
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    locale: 'fr_SN',
    siteName: 'Samadal',
    title: 'Samadal — La Marketplace de Chaussures au Senegal',
    description:
      'La marketplace N°1 pour acheter et vendre des chaussures au Senegal. Toutes tailles, toutes marques.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Samadal — La Marketplace de Chaussures au Senegal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samadal — La Marketplace de Chaussures au Senegal',
    description:
      'La marketplace N°1 pour acheter et vendre des chaussures au Senegal. Toutes tailles, toutes marques.',
    images: ['/og-image.png'],
  },
  other: {
    'theme-color': '#e94560',
  },
  applicationName: 'Samadal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${bebasNeue.variable}`} suppressHydrationWarning>
      <body className="font-[family-name:var(--font-sans)] bg-[var(--color-background)] text-[var(--color-foreground)] min-h-screen flex flex-col">
        <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster position="bottom-right" richColors closeButton />
          </SocketProvider>
        </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

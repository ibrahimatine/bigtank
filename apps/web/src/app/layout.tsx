import type { Metadata } from 'next';
import { Outfit, Bebas_Neue } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AuthProvider } from '@/components/providers/auth-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
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
  openGraph: {
    type: 'website',
    url: SITE_URL,
    locale: 'fr_SN',
    siteName: 'Samadal',
    title: 'Samadal — La Marketplace de Chaussures au Senegal',
    description:
      'La marketplace N°1 pour acheter et vendre des chaussures au Senegal. Toutes tailles, toutes marques.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samadal — La Marketplace de Chaussures au Senegal',
    description:
      'La marketplace N°1 pour acheter et vendre des chaussures au Senegal. Toutes tailles, toutes marques.',
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
      </body>
    </html>
  );
}

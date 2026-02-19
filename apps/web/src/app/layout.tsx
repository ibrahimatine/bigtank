import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AuthProvider } from '@/components/providers/auth-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bigtank.sn';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BigTank — Chaussures Grandes Tailles au Senegal',
    template: '%s | BigTank',
  },
  description:
    'La marketplace N°1 pour acheter et vendre des chaussures grandes tailles (46+) au Senegal. Wave, Orange Money, Free Money acceptes.',
  keywords: [
    'chaussures grandes tailles',
    'Senegal',
    'marketplace',
    'taille 46',
    'taille 47',
    'taille 48',
    'Nike',
    'Jordan',
    'Adidas',
  ],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    locale: 'fr_SN',
    siteName: 'BigTank',
    title: 'BigTank — Chaussures Grandes Tailles au Senegal',
    description:
      'La marketplace N°1 pour acheter et vendre des chaussures grandes tailles (46+) au Senegal.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BigTank — Chaussures Grandes Tailles au Senegal',
    description:
      'La marketplace N°1 pour acheter et vendre des chaussures grandes tailles (46+) au Senegal.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-[family-name:var(--font-sans)] bg-[var(--color-background)] text-[var(--color-foreground)] min-h-screen flex flex-col">
        <AuthProvider>
          <SocketProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster position="bottom-right" richColors closeButton />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

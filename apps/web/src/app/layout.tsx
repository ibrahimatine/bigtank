import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BigTank — Chaussures Grandes Tailles au Sénégal',
  description:
    'La marketplace N°1 pour acheter et vendre des chaussures grandes tailles (46+) au Sénégal. Wave, Orange Money, Free Money acceptés.',
  keywords: ['chaussures', 'grandes tailles', 'Sénégal', 'marketplace', '46', '47', '48'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

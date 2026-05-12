import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const interBase = Inter({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const interHeading = Inter({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nexus - Plateforme Intelligente de Gestion',
  description: 'Plateforme de gestion de projets intelligente avec backend Spring',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${interBase.variable} ${interHeading.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { AuthSync } from '@/components/layout/AuthSync';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cielo Clone - Crypto Trading Analytics',
  description: 'Track wallets, analyze trends, and monitor your crypto portfolio in real-time',
  keywords: ['crypto', 'trading', 'analytics', 'blockchain', 'defi'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthSync />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}

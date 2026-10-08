import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Poppins, Playfair_Display } from 'next/font/google';
import '../styles/tailwind.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PremiumPaywallProvider } from '@/contexts/PremiumPaywallContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-playfair',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Avalon Dating — Real People, Real Connections',
  description: 'Avalon Dating connects real singles through verified profiles, swipe-based discovery, and premium chat — find your perfect match today.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable}`}>
      <body className={poppins.className}>
        <AuthProvider>
          <PremiumPaywallProvider>
            {children}
          </PremiumPaywallProvider>
        </AuthProvider>
</body>
    </html>
  );
}
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

import { en } from '@/i18n/locales/en';

export const metadata: Metadata = {
  title: en.meta.title,
  description: en.meta.description,
};

import { LanguageProvider } from '@/i18n/LanguageContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <main id="main-content">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}

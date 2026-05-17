import type { Metadata } from 'next';
import './globals.css';
import { meta } from '@/lib/content';

const SITE_URL = 'https://portfolio-ivory-six-36.vercel.app';

export const metadata: Metadata = {
  title:       meta.title,
  description: meta.description,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title:       meta.title,
    description: meta.description,
    url:         SITE_URL,
    siteName:    meta.title,
    type:        'website',
    locale:      'en_US',
  },
  twitter: {
    card:        'summary_large_image',
    title:       meta.title,
    description: meta.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

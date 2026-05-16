import type { Metadata } from 'next';
import './globals.css';
import { meta } from '@/lib/content';

export const metadata: Metadata = {
  title:       meta.title,
  description: meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

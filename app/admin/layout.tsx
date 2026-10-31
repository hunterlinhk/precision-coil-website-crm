import '@fontsource/barlow/300.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import './admin.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: { default: 'Arcwind Admin', template: '%s | Arcwind Admin' }, robots: { index: false, follow: false }, icons: { icon: '/icon.svg' } };
export const dynamic = 'force-dynamic';

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="admin">{children}</body>
    </html>
  );
}

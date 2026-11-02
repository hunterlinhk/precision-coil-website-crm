import '@fontsource/barlow/300.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import './admin.css';
import type { Metadata } from 'next';
import { adminLang } from '@/lib/admin-lang';

export const metadata: Metadata = { title: { default: 'Arcwind Admin', template: '%s | Arcwind Admin' }, robots: { index: false, follow: false }, icons: { icon: '/icon.svg' } };
export const dynamic = 'force-dynamic';

export default async function AdminRoot({ children }: { children: React.ReactNode }) {
  const l = await adminLang();
  return (
    <html lang={l === 'zh' ? 'zh-CN' : 'en'}>
      <body className="admin">{children}</body>
    </html>
  );
}

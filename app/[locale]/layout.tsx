import '@fontsource/barlow/200.css';
import '@fontsource/barlow/300.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '../site.css';
import '../flair.css';
import { notFound } from 'next/navigation';
import type { Metadata, Viewport } from 'next';
import { isLocale, site, type Locale } from '@/lib/site';
import { Header, Footer } from '@/components/site/Chrome';
import { RfqProvider, SourceTracker, PageBeacon } from '@/components/site/client';
import { orgJsonLd, JsonLd } from '@/lib/seo';
import { Motion, motionBootScript } from '@/components/site/motion';
import { withBase } from '@/lib/base';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const zh = locale === 'zh';
  return {
    metadataBase: new URL(site.url),
    title: { default: zh ? `${site.brandZh} ${site.brand} | 精密线圈制造商` : `${site.brand} | Precision coil manufacturer`, template: zh ? `%s | ${site.brandZh}` : `%s | ${site.brand}` },
    description: zh
      ? 'VCM 线圈、空心线圈、骨架线圈、无线充电线圈、线性马达与无线充电器制造商，全球约 10% 的 VCM 线圈出自我们的产线。'
      : 'Manufacturer of VCM coils, air-core and bobbin coils, wireless charging coils, linear motors and wireless chargers. About 10% of VCM coils shipped worldwide are wound on our lines.',
    openGraph: { siteName: site.brand, locale: zh ? 'zh_CN' : 'en_US', type: 'website' },
    icons: { icon: withBase('/icon.svg') },
  };
}

export const viewport: Viewport = { themeColor: '#f2f2f0', width: 'device-width', initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: motionBootScript }} /></head>
      <body className={`site lang-${locale}`}>
        <a href="#main" className="skip">{locale === 'zh' ? '跳到正文' : 'Skip to content'}</a>
        <RfqProvider>
          <Header locale={locale as Locale} />
          <main id="main">{children}</main>
          <Footer locale={locale as Locale} />
        </RfqProvider>
        <SourceTracker />
        <PageBeacon locale={locale} />
        <Motion />
        <JsonLd data={orgJsonLd(locale as Locale)} />
      </body>
    </html>
  );
}

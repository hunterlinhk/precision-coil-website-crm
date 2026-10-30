import type { Metadata } from 'next';
import type { Locale } from '@/lib/site';
import { t } from '@/lib/i18n';
import { alternates } from '@/lib/seo';
import { ProductsView } from '@/components/site/ProductsView';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const d = t(locale);
  return { title: d.products.title, description: d.products.lead, alternates: alternates(locale, '/products') };
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <ProductsView locale={locale} />;
}

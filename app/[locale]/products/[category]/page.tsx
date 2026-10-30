import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/site';
import { L } from '@/lib/i18n';
import { getCategory } from '@/lib/content';
import { alternates } from '@/lib/seo';
import { ProductsView } from '@/components/site/ProductsView';

type P = { params: Promise<{ locale: Locale; category: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  return { title: L(c, 'name', locale), description: L(c, 'summary', locale), alternates: alternates(locale, `/products/${c.slug}`) };
}

export default async function Page({ params }: P) {
  const { locale, category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  return <ProductsView locale={locale} category={c} />;
}

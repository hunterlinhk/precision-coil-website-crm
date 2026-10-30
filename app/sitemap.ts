import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { getCategories, getProducts, getArticles } from '@/lib/content';
import { applications } from '@/lib/applications';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${site.url}/en${path}`,
    lastModified: lastModified ? new Date(lastModified.replace(' ', 'T') + 'Z') : new Date(),
    priority,
    alternates: { languages: { en: `${site.url}/en${path}`, 'zh-CN': `${site.url}/zh${path}` } },
  });
  return [
    entry('', undefined, 1),
    entry('/products', undefined, 0.9),
    ...getCategories().map((c) => entry(`/products/${c.slug}`, undefined, 0.8)),
    ...getProducts().map((p) => entry(`/products/${p.category_slug}/${p.slug}`, p.updated_at, 0.8)),
    entry('/applications'),
    ...applications.map((a) => entry(`/applications/${a.slug}`)),
    entry('/engineering', undefined, 0.8),
    entry('/manufacturing', undefined, 0.8),
    entry('/resources'),
    ...getArticles().map((a) => entry(`/resources/${a.slug}`, a.updated_at, 0.6)),
    entry('/contact', undefined, 0.7),
  ];
}

import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { applications } from '@/lib/applications';
import { getProductsForApplication } from '@/lib/content';
import { alternates } from '@/lib/seo';
import { Breadcrumbs } from '@/components/site/ArticleList';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const d = t(locale);
  return { title: d.apps.title, description: d.apps.lead, alternates: alternates(locale, '/applications') };
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = t(locale);
  const base = `/${locale}`;
  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.apps.title]]} />
        <h1 className="h1">{d.apps.title}</h1>
        <p className="lead">{d.apps.lead}</p>
      </div>
      <div className="wrap" style={{ padding: '48px var(--gutter) 96px' }}>
        <ul className="app-grid">
          {applications.map((a) => {
            const prods = getProductsForApplication(a.slug);
            return (
              <li key={a.slug} style={{ display: 'contents' }}>
                <Link href={`${base}/applications/${a.slug}`} className="app-card">
                  <h2>{L(a, 'name', locale)}</h2>
                  <p>{L(a, 'lead', locale)}</p>
                  <span className="app-parts">{prods.map((p) => p.model).join(', ')}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

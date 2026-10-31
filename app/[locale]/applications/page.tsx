import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { applications } from '@/lib/applications';
import { getProductsForApplication } from '@/lib/content';
import { productRenderName } from '@/lib/renders';
import { alternates } from '@/lib/seo';
import { Breadcrumbs } from '@/components/site/ArticleList';
import { Render } from '@/components/site/Render';

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
      <div className="wrap" style={{ paddingBottom: 'var(--section)' }}>
        <ul className="apps app-index">
          {applications.map((a) => {
            const prods = getProductsForApplication(a.slug);
            return (
              <li key={a.slug}>
                <Link href={`${base}/applications/${a.slug}`} className="app-row">
                  <h2 className="h3" style={{ fontSize: 'clamp(1.6rem, 1.1rem + 1.4vw, 2.5rem)', fontWeight: 300, letterSpacing: '-0.02em' }}>{L(a, 'name', locale)}</h2>
                  <p>{L(a, 'lead', locale)}<span style={{ display: 'block', marginTop: 10, fontSize: 'var(--t-small)', color: 'var(--faint)' }}>{prods.map((p) => p.model).join('  ')}</span></p>
                  <span className="app-thumb">{prods[0] && <Render name={productRenderName(prods[0])} alt="" sizes="160px" />}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

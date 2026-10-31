import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getApplication } from '@/lib/applications';
import { getProductsForApplication, articlesForApplication } from '@/lib/content';
import { productRenderName } from '@/lib/renders';
import { alternates } from '@/lib/seo';
import { ArticleList, Breadcrumbs } from '@/components/site/ArticleList';
import { MiniProducts } from '@/components/site/MiniProducts';
import { Render } from '@/components/site/Render';

type P = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = getApplication(slug);
  return a ? { title: L(a, 'name', locale), description: L(a, 'lead', locale), alternates: alternates(locale, `/applications/${slug}`) } : {};
}

export default async function Page({ params }: P) {
  const { locale, slug } = await params;
  const a = getApplication(slug);
  if (!a) notFound();
  const d = t(locale);
  const base = `/${locale}`;
  const prods = getProductsForApplication(slug);
  const arts = articlesForApplication(slug).slice(0, 3);
  const needs = locale === 'zh' ? a.needs_zh : a.needs_en;
  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.apps.title, `${base}/applications`], [L(a, 'name', locale)]]} />
        <div className="cat-hero">
          <div className="cat-hero-copy">
            <h1 className="h1">{L(a, 'name', locale)}</h1>
            <p className="lead">{L(a, 'lead', locale)}</p>
          </div>
          {prods[0] && <div className="cat-hero-art"><Render name={productRenderName(prods[0])} alt={`${prods[0].model}`} sizes="(max-width: 900px) 100vw, 50vw" priority /></div>}
        </div>
      </div>
      <section className="section tight">
        <div className="wrap split">
          <h2 className="h2 split-l">{d.apps.needs}</h2>
          <ul className="need-list split-r">{needs.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      </section>
      <section className="section dark">
        <div className="wrap split">
          <h2 className="h2 split-l">{d.apps.how}</h2>
          <div className="split-r">
            <p className="lead" style={{ color: 'var(--on-dark)' }}>{L(a, 'how', locale)}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
              <Link href={`${base}/contact?type=drawing`} className="btn btn-light">{d.home.ctaDrawing}</Link>
              <Link href={`${base}/engineering`} className="btn btn-ghost-dark">{d.nav.engineering}</Link>
            </div>
          </div>
        </div>
      </section>
      {prods.length > 0 && (
        <section className="section">
          <div className="wrap">
            <header className="head"><h2 className="h2">{d.apps.parts}</h2></header>
            <MiniProducts products={prods} locale={locale} />
          </div>
        </section>
      )}
      {arts.length > 0 && (
        <section className="section sweep">
          <div className="wrap">
            <header className="head"><h2 className="h2">{d.apps.reading}</h2></header>
            <ArticleList articles={arts} locale={locale} />
          </div>
        </section>
      )}
    </>
  );
}

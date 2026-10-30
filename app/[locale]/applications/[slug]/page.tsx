import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getApplication } from '@/lib/applications';
import { getProductsForApplication, articlesForApplication } from '@/lib/content';
import { alternates } from '@/lib/seo';
import { ArticleList, Breadcrumbs } from '@/components/site/ArticleList';
import { MiniProducts } from '@/components/site/MiniProducts';

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
        <div className="app-hero">
          <div>
            <h1 className="h1">{L(a, 'name', locale)}</h1>
            <p className="lead">{L(a, 'lead', locale)}</p>
          </div>
          <div>
            <h2 className="h3" style={{ fontSize: '1.1rem' }}>{d.apps.needs}</h2>
            <ul className="need-list">{needs.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        </div>
      </div>
      <section className="section">
        <div className="wrap two-col">
          <h2 className="h2">{d.apps.how}</h2>
          <div>
            <p className="lead" style={{ color: 'var(--ink)' }}>{L(a, 'how', locale)}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <Link href={`${base}/contact?type=drawing`} className="btn btn-ink">{d.home.ctaDrawing}</Link>
              <Link href={`${base}/engineering`} className="btn btn-line">{d.nav.engineering}</Link>
            </div>
          </div>
        </div>
      </section>
      {prods.length > 0 && (
        <section className="section section-tint">
          <div className="wrap">
            <h2 className="h2" style={{ marginBottom: 32 }}>{d.apps.parts}</h2>
            <MiniProducts products={prods} locale={locale} />
          </div>
        </section>
      )}
      {arts.length > 0 && (
        <section className="section">
          <div className="wrap">
            <h2 className="h2" style={{ marginBottom: 32 }}>{d.apps.reading}</h2>
            <ArticleList articles={arts} locale={locale} />
          </div>
        </section>
      )}
    </>
  );
}

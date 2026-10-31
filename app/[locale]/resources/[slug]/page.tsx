import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site, type Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getArticle, getProductsByModels, getArticles } from '@/lib/content';
import { getApplication } from '@/lib/applications';
import { currentUser, can } from '@/lib/auth';
import { Markdown } from '@/lib/markdown';
import { alternates, JsonLd, articleJsonLd } from '@/lib/seo';
import { Breadcrumbs, fmtDate } from '@/components/site/ArticleList';
import { MiniProducts } from '@/components/site/MiniProducts';

type P = { params: Promise<{ locale: Locale; slug: string }>; searchParams: Promise<{ preview?: string }> };

async function load(slug: string, preview?: string) {
  let drafts = false;
  if (preview) { const u = await currentUser(); drafts = !!u && can.cms(u); }
  return getArticle(slug, drafts);
}

export async function generateMetadata({ params, searchParams }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = await load(slug, (await searchParams).preview);
  if (!a) return {};
  return {
    title: L(a, 'seo_title', locale) || L(a, 'title', locale), description: L(a, 'seo_desc', locale) || L(a, 'excerpt', locale),
    alternates: alternates(locale, `/resources/${slug}`), openGraph: { type: 'article' },
    robots: a.status !== 'published' ? { index: false } : undefined,
  };
}

export default async function Page({ params, searchParams }: P) {
  const { locale, slug } = await params;
  const a = await load(slug, (await searchParams).preview);
  if (!a) notFound();
  const d = t(locale);
  const base = `/${locale}`;
  const prods = getProductsByModels(a.products);
  const more = getArticles({ limit: 4 }).filter((x) => x.slug !== a.slug).slice(0, 3);
  return (
    <>
      {a.status !== 'published' && <div className="draft-banner">{d.products.draftBanner}</div>}
      <div className="wrap">
        <header className="article-head">
          <Breadcrumbs items={[[d.common.home, base], [d.res.title, `${base}/resources`], [d.res[a.type], `${base}/resources?type=${a.type}`]]} />
          <h1 className="h1">{L(a, 'title', locale)}</h1>
          <p className="lead">{L(a, 'excerpt', locale)}</p>
          <div className="article-meta">
            <time dateTime={a.published_at || a.updated_at}>{fmtDate(a.published_at || a.updated_at, locale)}</time>
            <span>{a.reading_min} {d.res.read}</span>
            <span>{site.brand} {locale === 'zh' ? '工程团队' : 'engineering team'}</span>
          </div>
        </header>
        <div className="article-layout">
          <article className="prose"><Markdown source={L(a, 'body', locale)} /></article>
          <aside className="article-aside">
            {a.applications.length > 0 && (
              <div>
                <h2 className="kicker" style={{ marginBottom: 14 }}>{d.products.apps}</h2>
                <div className="chips">{a.applications.map((s) => { const ap = getApplication(s); return ap && <Link key={s} href={`${base}/applications/${s}`}>{L(ap, 'name', locale)}</Link>; })}</div>
              </div>
            )}
            <div className="custom-box">
              <h2>{d.products.askEngineer}</h2>
              <p>{d.eng.briefLead}</p>
              <Link href={`${base}/contact?type=drawing`} className="btn btn-light">{d.home.ctaDrawing}</Link>
            </div>
          </aside>
        </div>
      </div>
      {prods.length > 0 && (
        <section className="section sweep">
          <div className="wrap">
            <header className="head"><h2 className="h2">{d.res.products}</h2></header>
            <MiniProducts products={prods} locale={locale} />
          </div>
        </section>
      )}
      <section className="section">
        <div className="wrap">
          <header className="head">
            <h2 className="h2">{d.home.resourcesTitle}</h2>
            <div className="head-aside"><Link href={`${base}/resources`} className="link">{d.res.back}</Link></div>
          </header>
          <ul className="articles">
            {more.map((m) => (
              <li key={m.slug}>
                <Link href={`${base}/resources/${m.slug}`} className="article-card">
                  <span className={`kind kind-${m.type}`}>{d.res[m.type]}</span>
                  <h3>{L(m, 'title', locale)}</h3>
                  <p>{L(m, 'excerpt', locale)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <JsonLd data={articleJsonLd(a, locale, `${site.url}${base}/resources/${slug}`)} />
    </>
  );
}

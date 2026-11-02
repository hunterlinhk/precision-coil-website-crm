import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site, type Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getArticle, getProductsByModels, getArticles } from '@/lib/content';
import { getApplication } from '@/lib/applications';
import { currentUser, can } from '@/lib/auth';
import { Markdown } from '@/lib/markdown';
import { alternates, JsonLd, articleJsonLd, faqJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { ArticleList } from '@/components/site/ArticleList';
import { renderSrc, hasRender } from '@/lib/renders';
import { Breadcrumbs, fmtDate } from '@/components/site/ArticleList';
import { MiniProducts } from '@/components/site/MiniProducts';
import { SplitTitle } from '@/components/site/Flair';

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
  const zh = locale === 'zh';
  const takeaways = L(a, 'takeaways', locale);
  const faq: [string, string][] = (a.faq || []).map((f) => (zh ? [f[2] || f[0], f[3] || f[1]] : [f[0], f[1]]) as [string, string]).filter(([q, ans]) => q && ans);
  const image = a.cover ? `/api/media/${a.cover}` : renderSrc(a.products.find(hasRender) || 'section')?.src;
  const url = `${site.url}${base}/resources/${slug}`;
  return (
    <>
      {a.status !== 'published' && <div className="draft-banner">{d.products.draftBanner}</div>}
      <div className="wrap">
        <header className="article-head">
          <Breadcrumbs items={[[d.common.home, base], [d.res.title, `${base}/resources`], [d.res[a.type], `${base}/resources?type=${a.type}`]]} />
          <SplitTitle text={L(a, 'title', locale)} className="h1" />
          <p className="lead">{L(a, 'excerpt', locale)}</p>
          <div className="article-meta">
            <time dateTime={a.published_at || a.updated_at}>{fmtDate(a.published_at || a.updated_at, locale)}</time>
            <span>{a.reading_min} {d.res.read}</span>
            <span>{a.author || site.brand}</span>
          </div>
        </header>
        {a.cover && <figure className="article-cover"><img src={`/api/media/${a.cover}`} alt="" /></figure>}
        {takeaways && (
          <aside className="takeaways" aria-label={zh ? '要点' : 'Key points'}>
            <h2>{zh ? '要点' : 'Key points'}</h2>
            <p>{takeaways}</p>
          </aside>
        )}
        <div className="article-layout">
          <article className="prose">
            <Markdown source={L(a, 'body', locale)} />
            {faq.length > 0 && (
              <section className="article-faq">
                <h2>{zh ? '常见问题' : 'Questions and answers'}</h2>
                <dl className="faq">{faq.map(([q, ans]) => <div key={q}><dt>{q}</dt><dd>{ans}</dd></div>)}</dl>
              </section>
            )}
          </article>
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
            <header className="head"><h2 className="h2" data-reveal>{d.res.products}</h2></header>
            <MiniProducts products={prods} locale={locale} />
          </div>
        </section>
      )}
      <section className="section">
        <div className="wrap">
          <header className="head">
            <h2 className="h2" data-reveal>{d.home.resourcesTitle}</h2>
            <div className="head-aside"><Link href={`${base}/resources`} className="link">{d.res.back}</Link></div>
          </header>
          <ArticleList articles={more} locale={locale} />
        </div>
      </section>
      <JsonLd data={[
        articleJsonLd(a, locale, url, image),
        ...(faq.length ? [faqJsonLd(faq)] : []),
        breadcrumbJsonLd([[d.res.title, `${base}/resources`], [L(a, 'title', locale), `${base}/resources/${slug}`]]),
      ]} />
    </>
  );
}

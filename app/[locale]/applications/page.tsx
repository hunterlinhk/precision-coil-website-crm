import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { applications } from '@/lib/applications';
import { getProductsForApplication } from '@/lib/content';
import { productRenderName } from '@/lib/renders';
import { appTone } from '@/lib/tones';
import { alternates } from '@/lib/seo';
import { Breadcrumbs } from '@/components/site/ArticleList';
import { Render } from '@/components/site/Render';
import { SplitTitle } from '@/components/site/Flair';
import { ScrollSpy } from '@/components/site/motion';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const d = t(locale);
  return { title: d.apps.title, description: d.apps.lead, alternates: alternates(locale, '/applications') };
}

// Industries as a scroll story: the list scrolls, the stage on the left follows along,
// changing colour and product for each industry.
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = t(locale);
  const zh = locale === 'zh';
  const base = `/${locale}`;
  const items = applications.map((a) => ({ a, prods: getProductsForApplication(a.slug) }));
  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.apps.title]]} />
        <SplitTitle text={d.apps.title} className="h1" />
        <p className="lead" data-reveal>{d.apps.lead}</p>
      </div>
      <ScrollSpy className="wrap story">
        <div className="story-stage" aria-hidden="true">
          {items.map(({ a, prods }, i) => (
            <div key={a.slug} className="story-frame" data-for={String(i)} data-on={i === 0 || undefined} data-tone={appTone[a.slug]}>
              {prods[0] && <Render name={productRenderName(prods[0])} alt="" sizes="(max-width: 900px) 100vw, 50vw" />}
              {prods[1] && <span className="story-second"><Render name={productRenderName(prods[1])} alt="" sizes="200px" /></span>}
              <span className="story-idx">{String(i + 1).padStart(2, '0')}<small> / {String(items.length).padStart(2, '0')}</small></span>
              <span className="story-model">{prods[0]?.model}</span>
            </div>
          ))}
        </div>
        <ol className="story-list">
          {items.map(({ a, prods }, i) => (
            <li key={a.slug} className="story-step" data-step={String(i)} data-on={i === 0 || undefined} data-tone={appTone[a.slug]}>
              <span className="story-n">{String(i + 1).padStart(2, '0')}</span>
              <div className="story-thumb">{prods[0] && <Render name={productRenderName(prods[0])} alt="" sizes="(max-width: 900px) 100vw, 1px" />}</div>
              <h2>{L(a, 'name', locale)}</h2>
              <p>{L(a, 'lead', locale)}</p>
              <ul className="story-needs">{(zh ? a.needs_zh : a.needs_en).map((n) => <li key={n}>{n}</li>)}</ul>
              <div className="story-foot">
                <div className="chips">{prods.slice(0, 4).map((p) => <Link key={p.slug} href={`${base}/products/${p.category_slug}/${p.slug}`}>{p.model}</Link>)}</div>
                <Link href={`${base}/applications/${a.slug}`} className="btn btn-solid btn-sm btn-arrow">{zh ? '了解详情' : 'Read more'}<svg className="arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></Link>
              </div>
            </li>
          ))}
        </ol>
      </ScrollSpy>
    </>
  );
}

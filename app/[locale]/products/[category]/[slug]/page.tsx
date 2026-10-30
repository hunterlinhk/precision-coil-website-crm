import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site, type Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getProduct, getCategory, articlesForProduct, type Product } from '@/lib/content';
import { getApplication } from '@/lib/applications';
import { currentUser, can } from '@/lib/auth';
import { Markdown } from '@/lib/markdown';
import { alternates, JsonLd, productJsonLd, faqJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { ProductArt } from '@/components/site/ProductArt';
import { DimensionDrawing } from '@/components/site/DimensionDrawing';
import { FigureTabs } from '@/components/site/FigureTabs';
import { AddToRfq } from '@/components/site/client';
import { ArticleList, Breadcrumbs } from '@/components/site/ArticleList';

type P = { params: Promise<{ locale: Locale; category: string; slug: string }>; searchParams: Promise<{ preview?: string }> };

async function load(slug: string, preview?: string) {
  let drafts = false;
  if (preview) { const u = await currentUser(); drafts = !!u && can.cms(u); }
  return getProduct(slug, drafts);
}

export async function generateMetadata({ params, searchParams }: P): Promise<Metadata> {
  const { locale, category, slug } = await params;
  const p = await load(slug, (await searchParams).preview);
  if (!p) return {};
  return {
    title: L(p, 'seo_title', locale) || `${p.model} ${L(p, 'name', locale)}`,
    description: L(p, 'seo_desc', locale) || L(p, 'summary', locale),
    alternates: alternates(locale, `/products/${category}/${slug}`),
    robots: p.status !== 'published' ? { index: false } : undefined,
  };
}

function productFaq(p: Product, locale: Locale): [string, string][] {
  const zh = locale === 'zh';
  const vietnam = ['air-core-coils', 'bobbin-coils', 'linear-motors'].includes(p.category_slug);
  return zh ? [
    [`${p.model} 的最小起订量是多少？`, '样品 10 件起。量产起订量取决于是否需要新治具，标准线圈通常为 10,000 件。'],
    [`${p.model} 的打样周期多久？`, '使用现有治具约 1 周；需要新治具时为 2–3 周，并附首件尺寸与电性能报告。'],
    [`${p.model} 可以定制吗？`, L(p, 'custom', locale) || '可以，尺寸、线径与端子均可按图纸调整。'],
    ['在哪里生产？', vietnam ? '可在中国东莞或越南北宁生产，两地使用相同工艺规范，可双基地供货。' : '在中国东莞总部工厂生产。'],
  ] : [
    [`What is the MOQ for ${p.model}?`, 'Samples from 10 pieces. Production MOQ depends on whether new fixtures are needed; for standard coils it is typically 10,000 pieces.'],
    [`How long do ${p.model} samples take?`, 'About one week from existing fixtures, or 2–3 weeks when new fixtures are needed, shipped with a dimensional and electrical first-article report.'],
    [`Can ${p.model} be customized?`, L(p, 'custom', locale) || 'Yes. Dimensions, wire and terminations can be changed to your drawing.'],
    ['Where is it produced?', vietnam ? 'In Dongguan, China or Bắc Ninh, Vietnam, under the same process specification, so it can be dual-sourced.' : 'At our headquarters plant in Dongguan, China.'],
  ];
}

export default async function ProductPage({ params, searchParams }: P) {
  const { locale, category, slug } = await params;
  const preview = (await searchParams).preview;
  const p = await load(slug, preview);
  if (!p || p.category_slug !== category) notFound();
  const c = getCategory(category)!;
  const d = t(locale);
  const base = `/${locale}`;
  const url = `${site.url}${base}/products/${category}/${slug}`;
  const related = articlesForProduct(slug).slice(0, 3);
  const faq = productFaq(p, locale);
  const rfqItem = { model: p.model, slug: p.slug, category: p.category_slug, name_en: p.name_en, name_zh: p.name_zh };

  const tabs = [
    { label: d.products.drawing, node: <DimensionDrawing dims={p.dims} model={p.model} /> },
    ...p.images.map((img, i) => ({ label: `${locale === 'zh' ? '图片' : 'Photo'} ${i + 1}`, node: <img src={`/api/media/${img.id}`} alt={`${p.model} ${img.name}`} /> })),
    { label: locale === 'zh' ? '示意图' : 'Illustration', node: <ProductArt dims={p.dims} title={p.model} /> },
  ];

  return (
    <>
      {p.status !== 'published' && <div className="draft-banner">{d.products.draftBanner}</div>}
      <div className="wrap">
        <div className="pd-head">
          <div>
            <Breadcrumbs items={[[d.common.home, base], [d.nav.products, `${base}/products`], [L(c, 'name', locale), `${base}/products/${category}`], [p.model]]} />
            <h1>
              <span className="pd-model">{p.model}</span>
              <span className="pd-name" style={{ display: 'block' }}>{L(p, 'name', locale)}</span>
            </h1>
            <p className="pd-summary">{L(p, 'summary', locale)}</p>
          </div>
          <div className="pd-actions">
            <AddToRfq item={rfqItem} labels={{ add: d.products.addRfq, added: d.products.inRfq }} />
            <Link href={`${base}/contact?type=sample&model=${encodeURIComponent(p.model)}`} className="btn btn-ink">{d.products.requestSample}</Link>
            <Link href={`${base}/products/${category}/${slug}/datasheet`} className="btn btn-line">{d.products.datasheet}</Link>
          </div>
        </div>

        <div className="pd-body">
          <FigureTabs tabs={tabs} />
          <div className="pd-specs">
            <h2>{d.products.specs}</h2>
            <table className="spec-table">
              <tbody>
                {p.specs.map((s) => (
                  <tr key={s.k}><th scope="row">{locale === 'zh' ? s.zh : s.en}</th><td>{s.v}{s.u && <small>{s.u}</small>}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="spec-note">{d.products.unitsNote}</p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="pd-sections">
          <div>
            <div className="prose"><Markdown source={L(p, 'body', locale)} /></div>
            <div className="pd-section" style={{ marginTop: 48 }}>
              <h2>{d.products.faq}</h2>
              <dl className="faq">{faq.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
            </div>
          </div>
          <aside className="pd-aside">
            <div className="custom-box">
              <h2>{d.products.custom}</h2>
              <p>{L(p, 'custom', locale)}</p>
              <Link href={`${base}/contact?type=drawing&model=${encodeURIComponent(p.model)}`} className="btn btn-copper">{d.products.askEngineer}</Link>
            </div>
            {p.applications.length > 0 && (
              <div className="pd-section">
                <h2>{d.products.apps}</h2>
                <div className="chip-list">
                  {p.applications.map((a) => { const app = getApplication(a); return app && <Link key={a} href={`${base}/applications/${a}`}>{L(app, 'name', locale)}</Link>; })}
                </div>
              </div>
            )}
            <div className="pd-section">
              <h2>{d.products.docs}</h2>
              <ul className="doc-list">
                <li><Link href={`${base}/products/${category}/${slug}/datasheet`}><DocIcon />{d.products.datasheet}<small>HTML / PDF</small></Link></li>
                {p.files.map((f) => (
                  <li key={f.id}><a href={`/api/media/${f.id}`} download={f.name}><DocIcon />{f.name}<small>{f.size ? `${Math.max(1, Math.round(f.size / 1024))} KB` : 'PDF'}</small></a></li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section section-tint">
          <div className="wrap">
            <h2 className="h2" style={{ marginBottom: 32 }}>{d.products.related}</h2>
            <ArticleList articles={related} locale={locale} />
          </div>
        </section>
      )}
      <JsonLd data={[productJsonLd(p, locale, url), faqJsonLd(faq), breadcrumbJsonLd([[d.nav.products, `${base}/products`], [L(c, 'name', locale), `${base}/products/${category}`], [p.model, `${base}/products/${category}/${slug}`]])]} />
    </>
  );
}

function DocIcon() {
  return <svg viewBox="0 0 18 22" aria-hidden="true"><path d="M1 1h11l5 5v15H1z M12 1v5h5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M4 11h10M4 14h10M4 17h6" stroke="currentColor" strokeWidth="1.2" /></svg>;
}

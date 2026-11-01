import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site, type Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getProduct, getCategory, getProducts, articlesForProduct, type Product } from '@/lib/content';
import { getApplication } from '@/lib/applications';
import { currentUser, can } from '@/lib/auth';
import { Markdown } from '@/lib/markdown';
import { productRenderName, renderSrc } from '@/lib/renders';
import { Loupe } from '@/components/site/motion';
import { toneOf } from '@/lib/tones';
import { alternates, JsonLd, productJsonLd, faqJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { DimensionDrawing } from '@/components/site/DimensionDrawing';
import { Render } from '@/components/site/Render';
import { Stage } from '@/components/site/Stage';
import { AddToRfq } from '@/components/site/client';
import { ArticleList, Breadcrumbs } from '@/components/site/ArticleList';
import { MiniProducts } from '@/components/site/MiniProducts';

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

// The four values a buyer scans first, pulled from the spec list when present.
function keyFigures(p: Product, locale: Locale) {
  const want = ['outline', 'od', 'size', 'height', 'thickness', 'wire', 'resistance', 'inductance', 'f0', 'output', 'impedance', 'voltage'];
  const picked = want.map((k) => p.specs.find((s) => s.k === k)).filter(Boolean).slice(0, 4) as Product['specs'];
  return picked.map((s) => {
    let label = locale === 'zh' ? s.zh : s.en;
    let value = s.v, unit = s.u || '';
    // "0.040 mm self-bonding" → value 0.040, unit mm, note moves to the label
    const m = !unit && s.v.match(/^([\d.,\s×±+−–-]+?)\s*(mm|Ω|µH|nH|mH|W|V|Hz|G)\b\s*(.*)$/);
    if (m) { value = m[1].trim(); unit = m[2]; if (m[3]) label = `${label}, ${m[3]}`; }
    return { label, value, unit };
  });
}

export default async function ProductPage({ params, searchParams }: P) {
  const { locale, category, slug } = await params;
  const preview = (await searchParams).preview;
  const p = await load(slug, preview);
  if (!p || p.category_slug !== category) notFound();
  const c = getCategory(category)!;
  const d = t(locale);
  const zh = locale === 'zh';
  const base = `/${locale}`;
  const url = `${site.url}${base}/products/${category}/${slug}`;
  const related = articlesForProduct(slug).slice(0, 3);
  const siblings = getProducts({ category }).filter((x) => x.slug !== slug).slice(0, 3);
  const faq = productFaq(p, locale);
  const figs = keyFigures(p, locale);
  const rfqItem = { model: p.model, slug: p.slug, category: p.category_slug, name_en: p.name_en, name_zh: p.name_zh };
  const photo = p.images[0]
    ? <img src={`/api/media/${p.images[0].id}`} alt={`${p.model} ${p.images[0].name}`} />
    : <Render name={productRenderName(p)} alt={`${p.model} ${L(p, 'name', locale)}`} sizes="(max-width: 980px) 100vw, 58vw" priority />;
  const rs = renderSrc(productRenderName(p));
  const lensSrc = p.images[0] ? `/api/media/${p.images[0].id}` : rs ? (rs.srcSet.includes('-xl') ? rs.src.replace('.webp', '-xl.webp') : rs.src) : '';

  return (
    <>
      {p.status !== 'published' && <div className="draft-banner">{d.products.draftBanner}</div>}
      <div className="wrap" style={{ paddingTop: 'clamp(24px, 3vw, 40px)' }}>
        <Breadcrumbs items={[[d.common.home, base], [d.nav.products, `${base}/products`], [L(c, 'name', locale), `${base}/products/${category}`], [p.model]]} />
        <div className="pd">
          <div className="pd-stage" data-tone={toneOf(category)}>
            <Stage photo={<Loupe src={lensSrc} zoom={2.4} label={zh ? '悬停放大' : 'Hover to magnify'}>{photo}</Loupe>} drawing={<div className="draw-wrap" data-draw><DimensionDrawing dims={p.dims} model={p.model} /></div>} dims={p.dims} slug={p.slug}
              labels={zh
                ? { photo: '图片', model: '3D', drawing: '尺寸图', hint: '拖动旋转，滚轮缩放', viewer: `${p.model} 三维模型` }
                : { photo: 'Photo', model: '3D', drawing: 'Drawing', hint: 'Drag to rotate, scroll to zoom', viewer: `${p.model} 3D model` }} />
          </div>
          <div className="pd-info">
            <Link href={`${base}/products/${category}`} className="pd-family">{L(c, 'name', locale)}</Link>
            <h1>
              <span className="pd-model">{p.model.split('-').map((part, i, a) => <span key={i} className="pd-model-part" style={{ ['--i' as any]: i }}>{part}{i < a.length - 1 ? '-' : ''}</span>)}</span>
              <span className="pd-name">{L(p, 'name', locale)}</span>
            </h1>
            <p className="pd-summary">{L(p, 'summary', locale)}</p>
            <dl className="keyfigs" data-stagger>
              {figs.map((f) => <div key={f.label}><dt>{f.label}</dt><dd className={f.value.length > 9 ? 'long' : undefined} data-count>{f.value}{f.unit && <small>{f.unit}</small>}</dd></div>)}
            </dl>
            <div className="pd-actions">
              <AddToRfq item={rfqItem} labels={{ add: d.products.addRfq, added: d.products.inRfq }} />
              <Link href={`${base}/contact?type=sample&model=${encodeURIComponent(p.model)}`} className="btn btn-line">{d.products.requestSample}</Link>
              <Link href={`${base}/products/${category}/${slug}/datasheet`} className="btn btn-line">{d.products.datasheet}</Link>
            </div>
            <p className="pd-meta">
              <span>{zh ? '样品 10 件起' : 'Samples from 10 pcs'}</span>
              <span>{zh ? '首样 1–3 周' : 'First articles in 1–3 weeks'}</span>
              <a href="#custom">{d.products.custom}</a>
            </p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <section className="spec-block" aria-labelledby="specs">
          <h2 id="specs" className="h2" data-reveal>{d.products.specs}</h2>
          <div className="spec-body">
            <table className="spec-table" data-reveal>
              <tbody>{p.specs.map((s) => <tr key={s.k}><th scope="row">{zh ? s.zh : s.en}</th><td>{s.v}{s.u && <small>{s.u}</small>}</td></tr>)}</tbody>
            </table>
            <p className="spec-note">{d.products.unitsNote}</p>
          </div>
        </section>

        <section className="spec-block" aria-labelledby="about">
          <h2 id="about" className="h2" data-reveal>{zh ? '说明' : 'About this part'}</h2>
          <div className="spec-body aside-stack">
            <div className="prose"><Markdown source={L(p, 'body', locale)} /></div>
            <div className="custom-box" id="custom">
              <h3>{d.products.custom}</h3>
              <p>{L(p, 'custom', locale)}</p>
              <Link href={`${base}/contact?type=drawing&model=${encodeURIComponent(p.model)}`} className="btn btn-light">{d.products.askEngineer}</Link>
            </div>
            <div className="split" style={{ gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              {p.applications.length > 0 && (
                <div>
                  <h3 className="label" style={{ fontSize: 'var(--t-small)', fontWeight: 500, color: 'var(--muted)', marginBottom: 14 }}>{d.products.apps}</h3>
                  <div className="chips">{p.applications.map((a) => { const app = getApplication(a); return app && <Link key={a} href={`${base}/applications/${a}`}>{L(app, 'name', locale)}</Link>; })}</div>
                </div>
              )}
              <div>
                <h3 className="label" style={{ fontSize: 'var(--t-small)', fontWeight: 500, color: 'var(--muted)', marginBottom: 14 }}>{d.products.docs}</h3>
                <ul className="doc-list">
                  <li><Link href={`${base}/products/${category}/${slug}/datasheet`}><DocIcon />{d.products.datasheet}<small>PDF</small></Link></li>
                  {p.files.map((f) => <li key={f.id}><a href={`/api/media/${f.id}`} download={f.name}><DocIcon />{f.name}<small>{f.size ? `${Math.max(1, Math.round(f.size / 1024))} KB` : 'PDF'}</small></a></li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="spec-block" aria-labelledby="faq">
          <h2 id="faq" className="h2" data-reveal>{d.products.faq}</h2>
          <dl className="faq spec-body">{faq.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
        </section>
      </div>

      {siblings.length > 0 && (
        <section className="section sweep">
          <div className="wrap">
            <header className="head"><h2 className="h2">{zh ? `同系列：${L(c, 'name', locale)}` : `More ${L(c, 'name', locale)}`}</h2></header>
            <MiniProducts products={siblings} locale={locale} />
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="section">
          <div className="wrap">
            <header className="head"><h2 className="h2">{d.products.related}</h2></header>
            <ArticleList articles={related} locale={locale} />
          </div>
        </section>
      )}
      <JsonLd data={[productJsonLd(p, locale, url), faqJsonLd(faq), breadcrumbJsonLd([[d.nav.products, `${base}/products`], [L(c, 'name', locale), `${base}/products/${category}`], [p.model, `${base}/products/${category}/${slug}`]])]} />
    </>
  );
}

function DocIcon() {
  return <svg viewBox="0 0 16 20" aria-hidden="true"><path d="M1 1h9l5 5v13H1z M10 1v5h5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>;
}

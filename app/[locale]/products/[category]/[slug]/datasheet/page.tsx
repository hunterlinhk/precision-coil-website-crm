import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site, type Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getProduct } from '@/lib/content';
import { DimensionDrawing } from '@/components/site/DimensionDrawing';
import { PrintButton } from '@/components/site/PrintButton';

type P = { params: Promise<{ locale: Locale; category: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = getProduct(slug);
  return p ? { title: `${p.model} ${locale === 'zh' ? '规格书' : 'datasheet'}`, robots: { index: false } } : {};
}

export default async function Datasheet({ params }: P) {
  const { locale, category, slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  const d = t(locale);
  const zh = locale === 'zh';
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="ds">
      <div className="ds-actions">
        <PrintButton label={zh ? '打印 / 另存为 PDF' : 'Print or save as PDF'} />
        <Link href={`/${locale}/products/${category}/${slug}`} className="btn btn-line btn-sm">{d.common.back}</Link>
      </div>
      <header className="ds-head">
        <div>
          <div className="pd-model">{p.model}</div>
          <div className="pd-name">{L(p, 'name', locale)}</div>
          <p className="pd-summary" style={{ fontSize: '1rem' }}>{L(p, 'summary', locale)}</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
          <strong className="brand-word">{site.brand}</strong><br />
          {site.email}<br />{site.phone}
        </div>
      </header>
      <div className="ds-grid">
        <div>
          <DimensionDrawing dims={p.dims} model={p.model} />
          <h2 className="h3" style={{ fontSize: '1.1rem', marginTop: 20 }}>{d.products.custom}</h2>
          <p style={{ color: 'var(--ink-2)', marginTop: 6 }}>{L(p, 'custom', locale)}</p>
        </div>
        <div>
          <table className="spec-table">
            <tbody>{p.specs.map((s) => <tr key={s.k}><th scope="row">{zh ? s.zh : s.en}</th><td>{s.v}{s.u && <small>{s.u}</small>}</td></tr>)}</tbody>
          </table>
          <p className="spec-note">{d.products.unitsNote}</p>
        </div>
      </div>
      <footer className="ds-foot">
        <span>{zh ? site.legalNameZh : site.legalName}</span>
        <span>{site.url.replace(/^https?:\/\//, '')}</span>
        <span>{zh ? '生成日期' : 'Generated'} {today}</span>
      </footer>
    </div>
  );
}

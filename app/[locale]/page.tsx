import Link from 'next/link';
import type { Metadata } from 'next';
import { site, type Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getCategories, getArticles } from '@/lib/content';
import { applications } from '@/lib/applications';
import { WindingHero } from '@/components/site/WindingHero';
import { ProductArt, familyDims } from '@/components/site/ProductArt';
import { ArticleList } from '@/components/site/ArticleList';
import { alternates, JsonLd, faqJsonLd } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: alternates(locale, '') };
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = t(locale);
  const base = `/${locale}`;
  const zh = locale === 'zh';
  const cats = getCategories();
  const latest = getArticles({ limit: 3 });
  const f = site.facts;

  const keyFacts: [string, string][] = zh
    ? [
        ['这家公司生产什么？', `${site.brandZh}（${site.brand}）生产 VCM 线圈、空心线圈、骨架线圈、无线充电线圈、线性马达与无线充电器，工厂位于中国东莞与越南北宁。`],
        ['VCM 线圈的市场份额是多少？', `全球约 ${f.vcmShare.replace('≈', '')} 的 VCM（音圈马达）线圈出自其产线，年产线圈超过 ${f.annualCoils} 颗。`],
        ['是否接受按图定制？', `是。大部分产品按客户图纸绕制，线径最细 ${f.minWire} mm，提供 OEM 与 ODM 服务，工程师两个工作日内完成图纸评审。`],
      ]
    : [
        ['What does this company make?', `${site.brand} manufactures VCM coils, air-core coils, bobbin coils, wireless charging coils, linear motors and wireless chargers in Dongguan, China and Bắc Ninh, Vietnam.`],
        ['What is its share of VCM coils?', `About ${f.vcmShare.replace('≈', '')} of voice-coil-motor (VCM) coils shipped worldwide are wound on its lines; total output exceeds ${f.annualCoils} coils a year.`],
        ['Does it make custom coils?', `Yes. Most parts are wound to customer drawings, with wire down to ${f.minWire} mm, under OEM or ODM terms. Engineers review drawings within two working days.`],
      ];

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1 className="display">{d.home.title.split('\n').map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)}</h1>
            <p className="hero-lead">{d.home.lead}</p>
            <div className="hero-actions">
              <Link href={`${base}/products`} className="btn btn-copper">{d.home.ctaProducts}</Link>
              <Link href={`${base}/contact?type=drawing`} className="btn btn-ghost-light">{d.home.ctaDrawing}</Link>
            </div>
          </div>
          <WindingHero labels={{ turns: d.home.turns, wire: d.home.wire, fill: d.home.fill, share: f.vcmShare, shareLabel: d.home.shareLabel, caption: d.home.heroCaption }} />
        </div>
        <div className="wrap">
          <dl className="hero-stats">
            <div><dt>{d.home.stats.annual}</dt><dd>{f.annualCoils}</dd></div>
            <div><dt>{d.home.stats.lines}</dt><dd>{f.windingLines}</dd></div>
            <div><dt>{d.home.stats.wire}</dt><dd>{f.minWire}</dd></div>
            <div><dt>{d.home.stats.ppm}</dt><dd>{f.ppm}</dd></div>
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <header className="section-head split">
            <h2 className="h2">{d.home.productsTitle}</h2>
            <p className="lead">{d.home.productsLead}</p>
          </header>
          <ul className="family-grid">
            {cats.map((c) => (
              <li key={c.slug}>
                <Link href={`${base}/products/${c.slug}`} className="family">
                  <div className="family-art"><ProductArt dims={familyDims[c.shape]} title={L(c, 'name', locale)} /></div>
                  <div className="family-text">
                    <h3>{L(c, 'name', locale)}</h3>
                    <p>{L(c, 'short', locale)}</p>
                  </div>
                  <span className="family-count">{c.count} {d.products.parts}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-tint">
        <div className="wrap">
          <h2 className="h2">{d.home.pathTitle}</h2>
          <ol className="path">
            {d.home.path.map(([h, p], i) => (
              <li key={h}>
                <span className="path-n" aria-hidden="true">{i + 1}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </li>
            ))}
          </ol>
          <div className="path-cta">
            <Link href={`${base}/contact?type=drawing`} className="btn btn-ink">{d.home.ctaDrawing}</Link>
            <Link href={`${base}/engineering`} className="text-link">{d.nav.engineering}</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap why">
          <h2 className="h2">{d.home.whyTitle}</h2>
          <div className="why-cols">
            {d.home.why.map(([h, p]) => (
              <div key={h}><h3>{h}</h3><p>{p}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-rule">
        <div className="wrap apps-index">
          <h2 className="h2">{d.nav.applications}</h2>
          <ul>
            {applications.map((a) => (
              <li key={a.slug}>
                <Link href={`${base}/applications/${a.slug}`}>
                  <span className="apps-name">{L(a, 'name', locale)}</span>
                  <span className="apps-lead">{L(a, 'lead', locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-tint">
        <div className="wrap">
          <header className="section-head split">
            <h2 className="h2">{d.home.resourcesTitle}</h2>
            <Link href={`${base}/resources`} className="text-link">{d.products.viewAll}</Link>
          </header>
          <ArticleList articles={latest} locale={locale} />
        </div>
      </section>

      <section className="section">
        <div className="wrap audit-band">
          <div>
            <h2 className="h2">{d.home.auditTitle}</h2>
            <p className="lead">{d.home.auditLead}</p>
            <Link href={`${base}/manufacturing`} className="btn btn-ink">{d.home.auditCta}</Link>
          </div>
          <ul className="cert-list">
            {site.certifications.map((c) => (
              <li key={c.code}><strong>{c.code}</strong><span>{zh ? c.zh : c.en}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-rule">
        <div className="wrap faq-wrap">
          <h2 className="h3">{zh ? '要点' : 'Key facts'}</h2>
          <dl className="faq">
            {keyFacts.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}
          </dl>
        </div>
      </section>
      <JsonLd data={faqJsonLd(keyFacts)} />
    </>
  );
}

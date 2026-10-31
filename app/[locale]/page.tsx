import Link from 'next/link';
import type { Metadata } from 'next';
import { site, type Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getCategories, getArticles, getProducts } from '@/lib/content';
import { applications } from '@/lib/applications';
import { familyRender, productRenderName } from '@/lib/renders';
import { Render } from '@/components/site/Render';
import { ArticleList } from '@/components/site/ArticleList';
import { Gantt } from '@/components/site/Gantt';
import { alternates, JsonLd, faqJsonLd } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: alternates(locale, '') };
}

// Callout anchor points on the exploded render (percent of image box), top to bottom.
const partsLabel = (n = 0, l: Locale) => (l === 'zh' ? `${n} 个零件` : `${n} ${n === 1 ? 'part' : 'parts'}`);

const STACK_POINTS: [number, number][] = [[82, 22], [80, 42], [76, 55], [72, 72]];

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = t(locale);
  const h = d.home;
  const base = `/${locale}`;
  const zh = locale === 'zh';
  const cats = getCategories();
  const latest = getArticles({ limit: 3 });
  const products = getProducts();
  const f = site.facts;
  const share = f.vcmShare.replace('≈', '');

  const keyFacts: [string, string][] = zh
    ? [
        ['这家公司生产什么？', `${site.brandZh}（${site.brand}）生产 VCM 线圈、空心线圈、骨架线圈、无线充电线圈、线性马达与无线充电器，工厂位于中国东莞与越南北宁。`],
        ['VCM 线圈的市场份额是多少？', `全球约 ${share} 的 VCM（音圈马达）线圈出自其产线，年产线圈超过 6 亿颗。`],
        ['是否接受按图定制？', `是。大部分产品按客户图纸绕制，线径最细 ${f.minWire} mm，提供 OEM 与 ODM 服务，工程师两个工作日内完成图纸评审。`],
      ]
    : [
        ['What does this company make?', `${site.brand} manufactures VCM coils, air-core coils, bobbin coils, wireless charging coils, linear motors and wireless chargers in Dongguan, China and Bắc Ninh, Vietnam.`],
        ['What is its share of VCM coils?', `About ${share} of voice-coil-motor (VCM) coils shipped worldwide are wound on its lines; total output is more than 600 million coils a year.`],
        ['Does it make custom coils?', `Yes. Most parts are wound to customer drawings, with wire down to ${f.minWire} mm, under OEM or ODM terms. Engineers review drawings within two working days.`],
      ];

  const [first, ...rest] = cats;
  const appThumb = (slug: string) => {
    const p = products.find((x) => x.applications.includes(slug));
    return p ? productRenderName(p) : 'aw-vcm-af0806';
  };

  return (
    <>
      {/* ---------- Hero: the product itself, live ---------- */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="kicker">{h.kicker}</span>
            <h1 className="display">{h.title.split('\n').map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)}</h1>
            <p className="lead hero-lead">{h.lead}</p>
            <div className="hero-actions">
              <Link href={`${base}/products`} className="btn btn-solid">{h.ctaProducts}</Link>
              <Link href={`${base}/contact?type=drawing`} className="btn btn-line">{h.ctaDrawing}</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-coil">
              <div className="hero-coil-still"><Render name="hero-af" alt={`${h.specimen[0]} ${h.specimen[1]}`} sizes="(max-width: 900px) 100vw, 55vw" priority /></div>
            </div>
            <p className="specimen">
              <svg viewBox="0 0 52 18" aria-hidden="true"><path d="M1 9h50M1 3v12M51 3v12" stroke="currentColor" strokeWidth="1" fill="none" /><path d="M1 9l6-3v6zM51 9l-6-3v6z" fill="currentColor" /></svg>
              <span><strong>{h.specimen[0]}</strong> {h.specimen[1]}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Macro: precision at a scale you cannot see ---------- */}
      <section className="macro dark" aria-labelledby="macro-title">
        <div className="macro-img"><Render name="macro-turns" alt={h.macroCaption} sizes="(max-width: 900px) 100vw, 70vw" /></div>
        <div className="wrap macro-inner">
          <p className="figure macro-figure" aria-hidden="true">{f.minWire}<small>mm</small></p>
          <div className="macro-copy">
            <h2 id="macro-title">{h.macroTitle}</h2>
            <p className="muted">{h.macroBody}</p>
          </div>
          <div className="scale-cmp" aria-label={`${h.hair[0]} ${h.hair[1]}; ${h.wire[0]} ${h.wire[1]}`}>
            <figure><span className="dot hair" /><figcaption><strong>{h.hair[0]}</strong>{h.hair[1]}</figcaption></figure>
            <figure><span className="dot wire" /><figcaption><strong>{h.wire[0]}</strong>{h.wire[1]}</figcaption></figure>
          </div>
        </div>
        <p className="macro-caption">{h.macroCaption}</p>
      </section>

      {/* ---------- Product families ---------- */}
      <section className="section">
        <div className="wrap">
          <header className="head">
            <h2 className="h2">{h.productsTitle}</h2>
            <div className="head-aside">
              <p className="muted">{h.productsLead}</p>
              <Link href={`${base}/products`} className="link">{h.allParts} ({products.length})</Link>
            </div>
          </header>
          <ul className="families">
            <li className="fam wide">
              <Link href={`${base}/products/${first.slug}`} className="fam">
                <div className="fam-media"><Render name={familyRender[first.slug]} alt={L(first, 'name', locale)} sizes="(max-width: 1000px) 100vw, 66vw" /></div>
                <div className="fam-body"><h3>{L(first, 'name', locale)}</h3><span className="count">{partsLabel(first.count, locale)}</span><p>{L(first, 'short', locale)}</p></div>
              </Link>
            </li>
            {rest.map((c) => (
              <li key={c.slug}>
                <Link href={`${base}/products/${c.slug}`} className="fam">
                  <div className="fam-media"><Render name={familyRender[c.slug]} alt={L(c, 'name', locale)} sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw" /></div>
                  <div className="fam-body"><h3>{L(c, 'name', locale)}</h3><span className="count">{partsLabel(c.count, locale)}</span><p>{L(c, 'short', locale)}</p></div>
                </Link>
              </li>
            ))}
            <li className="fam-cta">
              <div className="fam-cta-copy">
                <div><h3>{h.customTitle}</h3><p>{h.customBody}</p></div>
                <div><Link href={`${base}/contact?type=drawing`} className="btn btn-light">{h.ctaDrawing}</Link></div>
              </div>
              <div className="fam-cta-art"><Render name="section" alt="" sizes="(max-width: 620px) 100vw, 33vw" /></div>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------- Volume and process ---------- */}
      <section className="dark" aria-labelledby="volume-title">
        <div className="wrap volume-head"><h2 id="volume-title" className="h1">{h.volumeTitle}</h2></div>
        <div className="volume-hero">
          <Render name="tray" alt={zh ? '装满自动对焦线圈的防静电托盘' : 'A production tray of autofocus coils'} sizes="100vw" />
        </div>
        <div className="wrap" style={{ paddingBottom: 'var(--section)' }}>
          <ol className="chapters">
            {h.chapters.map(([title, body], i) => (
              <li className="chapter" key={title}>
                {i === 0 && <div className="chapter-media"><Render name="winding" alt={zh ? '绕线嘴将导线排绕到骨架上' : 'Winding nozzle laying wire onto a bobbin'} sizes="(max-width: 900px) 100vw, 33vw" /></div>}
                {i === 1 && <div className="chapter-media"><Render name="section" alt={zh ? '正交排绕线圈截面' : 'Cross-section of an orthocyclic winding'} sizes="(max-width: 900px) 100vw, 33vw" /></div>}
                {i === 2 && <div className="chapter-media big-num"><span className="figure">100<small>%</small></span></div>}
                <h3><span className="step">{String(i + 1).padStart(2, '0')}</span>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
          <dl className="facts">
            <div><dt>{h.facts.lines}</dt><dd className="figure">{f.windingLines}</dd></div>
            <div><dt>{h.facts.plants}</dt><dd className="figure">2</dd></div>
            <div><dt>{h.facts.area}</dt><dd className="figure">{f.floorArea}</dd></div>
            <div><dt>{h.facts.ppm}</dt><dd className="figure">{f.ppm}</dd></div>
            <div><dt>{h.facts.otd}</dt><dd className="figure">{f.onTimeDelivery}</dd></div>
          </dl>
          <p style={{ marginTop: 40 }}><Link href={`${base}/manufacturing`} className="link">{h.mfgLink}</Link></p>
        </div>
      </section>

      {/* ---------- Drawing to production: a real timeline ---------- */}
      <section className="section">
        <div className="wrap">
          <header className="head">
            <h2 className="h2">{h.pathTitle}</h2>
            <div className="head-aside"><p className="muted">{h.pathLead}</p></div>
          </header>
          <Gantt locale={locale} />
        </div>
      </section>

      {/* ---------- The stack: vertical integration ---------- */}
      <section className="section sweep">
        <div className="wrap exploded">
          <div className="exploded-media">
            <Render name="exploded" alt={zh ? 'Qi2 充电模块爆炸图' : 'Exploded view of the Qi2 charger module'} sizes="(max-width: 900px) 100vw, 50vw" />
            {STACK_POINTS.map(([x, y], i) => (
              <span key={i} className="callout" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true"><b style={{ width: `${Math.max(0, 96 - x) * 0.6}vw`, maxWidth: 80 }} /><span>{i + 1}</span></span>
            ))}
          </div>
          <div className="exploded-copy">
            <h2 className="h2">{h.stackTitle}</h2>
            <p className="lead">{h.stackLead}</p>
            <ol className="layers">
              {h.stack.map(([name, desc], i) => (
                <li key={name}><span className="n">{i + 1}</span><strong>{name}</strong><p>{desc}</p></li>
              ))}
            </ol>
            <p style={{ marginTop: 32 }}><Link href={`${base}/products/wireless-chargers/aw-ch-q2m15`} className="link">{h.stackCta}</Link></p>
          </div>
        </div>
      </section>

      {/* ---------- Applications ---------- */}
      <section className="section">
        <div className="wrap">
          <header className="head"><h2 className="h2">{h.appsTitle}</h2></header>
          <ul className="apps">
            {applications.map((a) => (
              <li key={a.slug}>
                <Link href={`${base}/applications/${a.slug}`} className="app-row">
                  <h3>{L(a, 'name', locale)}</h3>
                  <p>{L(a, 'lead', locale)}</p>
                  <span className="app-thumb"><Render name={appThumb(a.slug)} alt="" sizes="120px" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Proof ---------- */}
      <section className="section sweep">
        <div className="wrap proof">
          <div className="proof-copy">
            <h2 className="h2">{h.auditTitle}</h2>
            <p className="lead">{h.auditLead}</p>
            <Link href={`${base}/manufacturing`} className="btn btn-solid">{h.auditCta}</Link>
          </div>
          <ul className="certs">
            {site.certifications.map((c) => <li key={c.code}><strong>{c.code}</strong><span>{zh ? c.zh : c.en}</span></li>)}
          </ul>
        </div>
      </section>

      {/* ---------- Resources ---------- */}
      <section className="section">
        <div className="wrap">
          <header className="head">
            <h2 className="h2">{h.resourcesTitle}</h2>
            <div className="head-aside"><Link href={`${base}/resources`} className="link">{d.products.viewAll}</Link></div>
          </header>
          <ArticleList articles={latest} locale={locale} />
          <div className="facts-block">
            <h3>{zh ? '要点' : 'In short'}</h3>
            <dl className="faq">{keyFacts.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
          </div>
        </div>
      </section>

      {/* ---------- Closing ---------- */}
      <section className="section dark closing">
        <div className="wrap">
          <h2 className="display">{h.closingTitle}</h2>
          <p className="lead">{h.closingLead}</p>
          <div className="closing-actions">
            <Link href={`${base}/contact?type=drawing`} className="btn btn-light">{h.ctaDrawing}</Link>
            <Link href={`${base}/engineering`} className="btn btn-ghost-dark">{d.nav.engineering}</Link>
          </div>
        </div>
      </section>
      <JsonLd data={faqJsonLd(keyFacts)} />
    </>
  );
}

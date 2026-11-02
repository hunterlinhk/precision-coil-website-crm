import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/lib/site';
import { t } from '@/lib/i18n';
import { alternates, JsonLd, faqJsonLd } from '@/lib/seo';
import { Breadcrumbs } from '@/components/site/ArticleList';
import { Gantt } from '@/components/site/Gantt';
import { DimensionDrawing } from '@/components/site/DimensionDrawing';
import { SplitTitle, WireCoil, Arrow } from '@/components/site/Flair';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const d = t(locale);
  return { title: d.eng.title, description: d.eng.lead, alternates: alternates(locale, '/engineering') };
}

// Log-scale position of a value on the envelope bar.
const pos = (v: number, lo: number, hi: number) => ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * 100;

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = t(locale);
  const zh = locale === 'zh';
  const base = `/${locale}`;
  const ranged: [string, string, number, number, number, number][] = [
    [zh ? '线径' : 'Wire diameter', '0.012 – 1.0 mm', 0.012, 1.0, 0.005, 3],
    [zh ? '线圈外形' : 'Coil outline', '1.5 – 80 mm', 1.5, 80, 0.5, 200],
    [zh ? '圈数' : 'Turns', '2 – 12,000', 2, 12000, 1, 50000],
  ];
  const flat: [string, string][] = zh ? [
    ['内窗公差', '低至 ±0.02 mm'], ['电阻公差', '低至 ±3%'], ['电感公差', '低至 ±2%'],
    ['线材', '自粘线、利兹线、铜包铝、扁线、镀银线'], ['工作温度', '−40 至 +180 °C（线材等级最高 220）'], ['端接', '激光脱漆、电阻焊、插针、FPC、注塑包封'],
  ] : [
    ['Window tolerance', 'down to ±0.02 mm'], ['Resistance tolerance', 'down to ±3%'], ['Inductance tolerance', 'down to ±2%'],
    ['Wire types', 'Self-bonding, litz, CCA, rectangular, silver-plated'], ['Operating temperature', '−40 to +180 °C (wire class up to 220)'], ['Terminations', 'Laser strip, resistance weld, pins, FPC, over-moulding'],
  ];
  const faq: [string, string][] = zh ? [
    ['提交图纸前需要签署保密协议吗？', '可以先签。勾选表单中的保密选项，我们会在查看文件前发送保密协议。'],
    ['开发费用如何计算？', '使用现有线材与骨架时通常只收治具费，量产后可按约定返还。新骨架模具单独报价。'],
    ['可以只做小批量吗？', '可以。样品与小批量订单都可以按图纸生产，起订量取决于是否需要新治具。'],
  ] : [
    ['Can we sign an NDA before sending drawings?', 'Yes. Tick the confidentiality option on the form and we send our NDA before opening your files.'],
    ['How are development costs handled?', 'With existing wire and bobbin materials there is usually only a fixture charge, refundable against production orders. New bobbin tooling is quoted separately.'],
    ['Do you take lower-volume programmes?', 'Yes. Samples and small batches are wound to drawing; the minimum order depends on whether new fixtures are needed.'],
  ];
  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.nav.engineering]]} />
        <div className="cat-hero">
          <div className="cat-hero-copy">
            <SplitTitle text={d.eng.title} className="h1" />
            <p className="lead" data-reveal>{d.eng.lead}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
              <Link href={`${base}/contact?type=drawing`} className="btn btn-solid btn-arrow" data-magnetic>{d.eng.brief}<Arrow /></Link>
            </div>
          </div>
          <div className="cat-hero-art" style={{ background: '#fff', padding: '4%' }} data-draw><DimensionDrawing dims={{ shape: 'racetrack', L: 8, W: 6, iL: 6.4, iW: 4.4, H: 0.5 }} model="AW-VCM-AF0806" /></div>
        </div>
      </div>

      <section className="section tight">
        <div className="wrap split">
          <div className="split-l">
            <h2 className="h2" data-reveal>{d.eng.envelope}</h2>
            <p className="muted" style={{ marginTop: 20, maxWidth: '24em' }}>{d.eng.envelopeLead}</p>
          </div>
          <table className="envelope split-r">
            <tbody data-stagger>
              {ranged.map(([label, text, lo, hi, min, max]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{text}<div className="bar" aria-hidden="true"><i style={{ left: `${pos(lo, min, max)}%`, right: `${100 - pos(hi, min, max)}%` }} /></div></td>
                </tr>
              ))}
              {flat.map(([label, text]) => <tr key={label}><th scope="row">{label}</th><td>{text}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section sweep">
        <div className="wrap">
          <header className="head"><h2 className="h2" data-reveal>{d.eng.models}</h2></header>
          <div className="models models-cards" data-stagger>
            {[d.eng.oem, d.eng.odm, d.eng.platform].map(([h, p], i) => (
              <div key={h} className={`model-card${i === 1 ? ' model-dark' : ''}`} data-spot>
                <span className="model-n">{String(i + 1).padStart(2, '0')}</span>
                <ModelIcon i={i} />
                <h3>{h}</h3><p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section grid-paper">
        <div className="wrap">
          <header className="head">
            <h2 className="h2" data-reveal>{d.eng.process}</h2>
            <div className="head-aside"><p className="muted">{d.eng.processLead}</p></div>
          </header>
          <Gantt locale={locale} />
        </div>
      </section>

      <section className="section tight">
        <div className="wrap split">
          <h2 className="h3 split-l">{zh ? '常见问题' : 'Common questions'}</h2>
          <dl className="faq split-r" data-stagger>{faq.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
        </div>
      </section>

      <section className="section dark closing" data-scroll>
        <WireCoil className="closing-wire" turns={7} />
        <div className="wrap">
          <SplitTitle as="h2" text={d.eng.brief} className="display" />
          <p className="lead" data-reveal>{d.eng.briefLead}</p>
          <div className="closing-actions"><Link href={`${base}/contact?type=drawing`} className="btn btn-copper btn-arrow" data-magnetic>{d.home.ctaDrawing}<Arrow /></Link></div>
        </div>
      </section>
      <JsonLd data={faqJsonLd(faq)} />
    </>
  );
}

// Line icons for the three ways of working: a drawing, two hands on one part, a stack of variants.
function ModelIcon({ i }: { i: number }) {
  const paths = [
    'M8 6h30l10 10v42H8z M38 6v10h10 M16 28h24 M16 36h24 M16 44h14 M30 50l6-6 4 4',
    'M10 40c6-10 14-14 22-14s16 4 22 14 M22 26a10 10 0 1 1 20 0 M6 50h52 M32 16v-8 M26 10l6-4 6 4',
    'M10 20l22-10 22 10-22 10z M10 30l22 10 22-10 M10 40l22 10 22-10',
  ];
  return <svg className="model-icon" viewBox="0 0 64 64" aria-hidden="true" data-draw><path d={paths[i]} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}

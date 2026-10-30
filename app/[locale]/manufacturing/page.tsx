import Link from 'next/link';
import type { Metadata } from 'next';
import { site, type Locale } from '@/lib/site';
import { t } from '@/lib/i18n';
import { alternates } from '@/lib/seo';
import { Breadcrumbs } from '@/components/site/ArticleList';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const d = t(locale);
  return { title: d.mfg.title, description: d.mfg.lead, alternates: alternates(locale, '/manufacturing') };
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = t(locale);
  const zh = locale === 'zh';
  const base = `/${locale}`;
  const f = site.facts;
  const facts: [string, string][] = [
    [f.annualCoils, zh ? '年产线圈' : 'coils a year'],
    [f.vcmShare, zh ? '全球 VCM 线圈份额' : 'of global VCM coil shipments'],
    [`${f.floorArea} m²`, zh ? '生产面积（两厂合计）' : 'production floor, both plants'],
    [f.engineers, zh ? '名工程师' : 'engineers'],
    [String(site.founded), zh ? '成立年份' : 'founded'],
    [f.windingLines, zh ? '条自动绕线产线' : 'automatic winding lines'],
    [f.onTimeDelivery, zh ? '准时交付率' : 'on-time delivery'],
    [f.ppm, zh ? 'ppm 出货不良' : 'ppm outgoing defects'],
  ];
  const metrics: [string, string][] = zh
    ? [['准时交付率', f.onTimeDelivery], ['出货不良', `${f.ppm} ppm`], ['关键尺寸 Cpk', '≥ 1.67'], ['客户审核通过', '43 / 43'], ['8D 平均关闭', '9 天']]
    : [['On-time delivery', f.onTimeDelivery], ['Outgoing defects', `${f.ppm} ppm`], ['Cpk, critical dimensions', '≥ 1.67'], ['Customer audits passed', '43 of 43'], ['Average 8D closure', '9 days']];
  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.nav.manufacturing]]} />
        <h1 className="h1">{d.mfg.title}</h1>
        <p className="lead">{d.mfg.lead}</p>
      </div>

      <section className="section">
        <div className="wrap">
          <h2 className="h2" style={{ marginBottom: 28 }}>{d.mfg.facts}</h2>
          <dl className="facts-grid">{facts.map(([v, l]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>
        </div>
      </section>

      <section className="section section-tint">
        <div className="wrap">
          <h2 className="h2" style={{ marginBottom: 28 }}>{d.mfg.plants}</h2>
          <div className="plant-list">
            {site.plants.map((p) => {
              const [name, role] = p[locale].split(' — ');
              return <div className="plant" key={name}><h3>{name}</h3><p>{role}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap two-col">
          <h2 className="h2">{d.mfg.equipment}</h2>
          <div className="table-scroll">
            <table className="eq-table">
              <thead><tr><th>{zh ? '设备' : 'Equipment'}</th><th>{zh ? '数量' : 'Count'}</th><th>{zh ? '说明' : 'Notes'}</th></tr></thead>
              <tbody>{d.mfg.equipmentList.map(([a, b, c]) => <tr key={a}><td>{a}</td><td className="n">{b}</td><td>{c}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section section-rule">
        <div className="wrap two-col">
          <h2 className="h2">{d.mfg.quality}</h2>
          <div>
            <ul className="check-list">{d.mfg.qualityPoints.map((q) => <li key={q}>{q}</li>)}</ul>
            <h3 className="h3" style={{ fontSize: '1.15rem', margin: '40px 0 12px' }}>{d.mfg.metrics}</h3>
            <table className="spec-table"><tbody>{metrics.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="wrap audit-band">
          <div>
            <h2 className="h2">{d.mfg.certs}</h2>
            <p className="lead">{d.mfg.auditLead}</p>
            <Link href={`${base}/contact?type=general&topic=audit`} className="btn btn-ink">{d.mfg.audit}</Link>
          </div>
          <ul className="cert-list">{site.certifications.map((c) => <li key={c.code}><strong>{c.code}</strong><span>{zh ? c.zh : c.en}</span></li>)}</ul>
        </div>
      </section>
    </>
  );
}

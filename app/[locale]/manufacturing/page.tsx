import Link from 'next/link';
import type { Metadata } from 'next';
import { site, type Locale } from '@/lib/site';
import { t } from '@/lib/i18n';
import { alternates } from '@/lib/seo';
import { Breadcrumbs } from '@/components/site/ArticleList';
import { Render } from '@/components/site/Render';
import { SplitTitle, ScanOverlay, MachineFloor, CertMark, Arrow } from '@/components/site/Flair';

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
  const home = d.home;
  const facts: [string, string][] = [
    ['20M', zh ? '颗线圈 / 月，全品类产能' : 'coils a month, all types'],
    [f.vcmShare, zh ? '全球 VCM 线圈出货份额' : 'of global VCM coil shipments'],
    [f.windingMachines, zh ? '台绕线机，以日本日特为主' : 'winding machines, mostly Nittoku'],
    [f.supportMachines, zh ? '台配套设备' : 'supporting machines'],
    [`${f.floorArea} m²`, zh ? '生产车间' : 'workshop'],
    [f.employees, zh ? '名员工' : 'employees'],
    [String(site.founded), zh ? '成立年份' : 'founded'],
    ['ISO 9001', zh ? '质量管理体系' : 'quality management'],
  ];
  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.nav.manufacturing]]} />
        <SplitTitle text={d.mfg.title} className="h1" />
        <p className="lead" data-reveal>{d.mfg.lead}</p>
      </div>

      <section className="dark">
        <div className="volume-hero" data-reveal><Render name="tray" alt={zh ? '装满自动对焦线圈的防静电托盘' : 'A production tray of autofocus coils'} sizes="100vw" priority /><ScanOverlay zh={zh} /></div>
        <div className="wrap" style={{ paddingBottom: 'var(--section)' }}>
          <dl className="facts" data-stagger style={{ marginTop: 0, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>{facts.map(([v, l]) => <div key={l}><dt>{l}</dt><dd className="figure" data-count={/^[≈\d]/.test(v) || undefined} data-from={/^\d{4}$/.test(v) ? '2000' : undefined}>{v}</dd></div>)}</dl>
          <div className="process-pair" data-stagger style={{ marginTop: 'clamp(64px, 8vw, 120px)' }}>
            <figure>
              <div className="chapter-media"><Render name="winding" alt={zh ? '绕线嘴将导线排绕到骨架上' : 'Winding nozzle laying wire onto a bobbin'} sizes="(max-width: 900px) 100vw, 50vw" /></div>
              <figcaption><strong>{home.chapters[0][0]}</strong>{home.chapters[0][1]}</figcaption>
            </figure>
            <figure>
              <div className="chapter-media"><Render name="section" alt={zh ? '正交排绕线圈截面' : 'Cross-section of an orthocyclic winding'} sizes="(max-width: 900px) 100vw, 50vw" /></div>
              <figcaption><strong>{home.chapters[1][0]}</strong>{home.chapters[1][1]}</figcaption>
            </figure>
          </div>
          <div style={{ marginTop: 'clamp(64px, 8vw, 120px)' }}>
            <MachineFloor zh={zh} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap split">
          <h2 className="h2 split-l" data-reveal>{d.mfg.equipment}</h2>
          <div className="table-scroll split-r">
            <table className="eq-table">
              <thead><tr><th>{zh ? '设备' : 'Equipment'}</th><th>{zh ? '数量' : 'Count'}</th><th>{zh ? '说明' : 'Notes'}</th></tr></thead>
              <tbody data-stagger>{d.mfg.equipmentList.map(([a, b, c]) => <tr key={a}><td>{a}</td><td className="n" data-count>{b}</td><td>{c}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section sweep">
        <div className="wrap split">
          <h2 className="h2 split-l" data-reveal>{d.mfg.quality}</h2>
          <div className="split-r">
            <ul className="check-list" data-stagger>{d.mfg.qualityPoints.map((q) => <li key={q}>{q}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap proof">
          <div className="proof-copy">
            <h2 className="h2" data-reveal>{d.mfg.certs}</h2>
            <p className="lead">{d.mfg.auditLead}</p>
            <Link href={`${base}/contact?type=general&topic=audit`} className="btn btn-solid btn-arrow" data-magnetic>{d.mfg.audit}<Arrow /></Link>
          </div>
          <ul className="certs" data-stagger>{site.certifications.map((c) => <li key={c.code}><CertMark /><strong>{c.code}</strong><span>{zh ? c.zh : c.en}</span></li>)}</ul>
        </div>
      </section>
    </>
  );
}

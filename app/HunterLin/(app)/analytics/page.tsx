import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, compactMoney, hoursBetween, median, countryName, INQ_TYPE } from '@/lib/admin';
import { Topbar, Panel, BarChart, HBars } from '@/components/admin/ui';

export const metadata = { title: 'Analytics' };

export default async function Analytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const u = await requireUser(can.crm);
  const days = [30, 90, 365].includes(+((await searchParams).days || 0)) ? +(await searchParams).days! : 90;
  const inq = db().prepare(`SELECT i.*, us.name AS owner, o.stage AS opp_stage, o.value AS opp_value FROM inquiries i LEFT JOIN users us ON us.id = i.owner_id LEFT JOIN opportunities o ON o.id = i.opportunity_id
    WHERE ${scope(u, 'i.owner_id', true)} AND i.created_at > datetime('now', ?) AND i.status != 'spam'`).all(`-${days} days`) as any[];
  const opps = db().prepare(`SELECT * FROM opportunities WHERE ${scope(u)} AND updated_at > datetime('now', ?)`).all(`-${days} days`) as any[];

  const total = inq.length;
  const responded = inq.filter((r) => r.first_response_at).length;
  const converted = inq.filter((r) => r.status === 'converted' || r.opportunity_id).length;
  const wonOpps = opps.filter((o) => o.stage === 'won');
  const resp = inq.filter((r) => r.first_response_at).map((r) => hoursBetween(r.created_at, r.first_response_at));
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

  const weeks = Math.min(26, Math.ceil(days / 7));
  const perWeek = Array.from({ length: weeks }, (_, k) => {
    const w = weeks - 1 - k;
    const end = Date.now() - w * 7 * 86400000, start = end - 7 * 86400000;
    const label = new Date(start + 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return { label, value: inq.filter((r) => { const t = new Date(r.created_at.replace(' ', 'T') + 'Z').getTime(); return t > start && t <= end; }).length };
  });
  const group = (key: (r: any) => string) => Object.entries(inq.reduce((m: Record<string, any[]>, r) => { const k = key(r) || '—'; (m[k] ||= []).push(r); return m; }, {}))
    .map(([label, rows]) => ({ label, rows: rows as any[], value: (rows as any[]).length })).sort((a, b) => b.value - a.value);
  const bySource = group((r) => r.source);
  const byCountry = group((r) => countryName(r.country)).slice(0, 10);
  const byType = group((r) => INQ_TYPE[r.type]);
  const productCounts: Record<string, number> = {};
  inq.forEach((r) => j<any[]>(r.items, []).forEach((i) => { productCounts[i.model] = (productCounts[i.model] || 0) + 1; }));
  const byProduct = Object.entries(productCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const byRep = group((r) => r.owner || 'Unassigned');
  const funnel = [
    ['Inquiries', total], ['Replied', responded], ['Opportunity', converted], ['Won', inq.filter((r) => r.opp_stage === 'won').length],
  ] as [string, number][];

  return (
    <>
      <Topbar title="Analytics" sub={`Inquiry volume, lead sources and conversion, last ${days} days${can.seeAll(u) ? '' : ' (your records)'}.`}>
        <nav className="seg" aria-label="Period">{[30, 90, 365].map((d) => <Link key={d} href={`/HunterLin/analytics?days=${d}`} aria-current={days === d ? 'true' : undefined}>{d === 365 ? '12 months' : `${d} days`}</Link>)}</nav>
      </Topbar>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="panel kpi"><div className="label">Inquiries</div><div className="value">{total}</div><div className="delta">{(total / (days / 7)).toFixed(1)} a week</div></div>
        <div className="panel kpi"><div className="label">Inquiry to opportunity</div><div className="value">{pct(converted, total)}</div><div className="delta">{converted} converted</div></div>
        <div className="panel kpi"><div className="label">Median first response</div><div className="value">{resp.length ? `${median(resp).toFixed(1)} h` : '—'}</div><div className="delta">{pct(resp.filter((h) => h <= 24).length, resp.length)} within 24 h</div></div>
        <div className="panel kpi"><div className="label">Won in period</div><div className="value">{compactMoney(wonOpps.reduce((s, o) => s + o.value, 0))}</div><div className="delta">{wonOpps.length} deals</div></div>
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <Panel title="Inquiries per week"><BarChart data={perWeek} /></Panel>
        <Panel title="Conversion funnel">
          <div className="funnel">
            {funnel.map(([label, v], i) => (
              <div className="funnel-step" key={label}>
                <span>{label}</span>
                <div className="bar-wrap"><div className="bar-in" style={{ width: `${total ? (v / total) * 100 : 0}%` }} title={`${label}: ${v}`} /></div>
                <span className="pct"><b>{v}</b>{i > 0 ? `  ${pct(v, funnel[i - 1][1])}` : ''}</span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: '0.8rem', marginTop: 12 }}>Percentages compare each step with the one before it.</p>
        </Panel>
      </div>
      <Panel title="Lead sources and how well they convert" flush>
        <div className="table-wrap"><table className="t">
          <thead><tr><th>Channel</th><th style={{ width: '38%' }}>Inquiries</th><th className="r">Became opportunities</th><th className="r">Conversion</th><th className="r">Pipeline created</th></tr></thead>
          <tbody>
            {bySource.map((s) => {
              const conv = s.rows.filter((r) => r.opportunity_id || r.status === 'converted').length;
              const value = s.rows.reduce((a, r) => a + (r.opp_value || 0), 0);
              return (
                <tr key={s.label}>
                  <td><strong>{s.label}</strong></td>
                  <td><div className="hbar" style={{ gridTemplateColumns: 'minmax(0,1fr) 40px' }}><span className="track"><span className="fill" style={{ width: `${(s.value / bySource[0].value) * 100}%` }} /></span><span className="n">{s.value}</span></div></td>
                  <td className="r">{conv}</td><td className="r">{pct(conv, s.value)}</td><td className="r">{value ? compactMoney(value) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </Panel>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Panel title="Top countries"><HBars data={byCountry} ink /></Panel>
        <Panel title="Most requested parts"><HBars data={byProduct} /></Panel>
        <Panel title="Request types"><HBars data={byType} ink /></Panel>
      </div>
      <div style={{ marginTop: 16 }}>
        <Panel title="Response time by owner" flush>
          <table className="t">
            <thead><tr><th>Owner</th><th className="r">Inquiries</th><th className="r">Replied</th><th className="r">Median first response</th><th className="r">Converted</th></tr></thead>
            <tbody>{byRep.map((r) => {
              const h = r.rows.filter((x) => x.first_response_at).map((x) => hoursBetween(x.created_at, x.first_response_at));
              return <tr key={r.label}><td>{r.label}</td><td className="r">{r.value}</td><td className="r">{h.length}</td><td className="r">{h.length ? `${median(h).toFixed(1)} h` : '—'}</td><td className="r">{pct(r.rows.filter((x) => x.opportunity_id || x.status === 'converted').length, r.value)}</td></tr>;
            })}</tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}

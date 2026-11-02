import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, compactMoney, hoursBetween, median, countryName } from '@/lib/admin';
import { translator, label, channel, fmtDateTime } from '@/lib/admin-lang';
import { webStats, fillDays } from '@/lib/analytics';
import { gscConfig, gscReport } from '@/lib/gsc';
import { Topbar, Panel, BarChart, HBars, Kpi, Tabs } from '@/components/admin/ui';
import { refreshGsc } from '../../actions-more';

export const metadata = { title: 'Analytics' };

const DEVICE: Record<string, [string, string]> = { desktop: ['Desktop', '电脑'], mobile: ['Mobile', '手机'], tablet: ['Tablet', '平板'] };
const pctDelta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

export default async function Analytics({ searchParams }: { searchParams: Promise<{ tab?: string; days?: string; error?: string; refreshed?: string }> }) {
  const u = await requireUser((x) => can.crm(x) || can.cms(x));
  const { l, tr } = await translator();
  const sp = await searchParams;
  const tab = sp.tab === 'search' ? 'search' : sp.tab === 'sales' && can.crm(u) ? 'sales' : 'web';
  const days = [7, 30, 90, 365].includes(+(sp.days || 0)) ? +sp.days! : 30;
  const periods = (
    <nav className="seg" aria-label={tr('Period', '时间范围')}>{[7, 30, 90, 365].map((d) => <Link key={d} href={`/HunterLin/analytics?tab=${tab}&days=${d}`} aria-current={days === d ? 'true' : undefined}>{d === 365 ? tr('12 months', '12 个月') : tr(`${d} days`, `${d} 天`)}</Link>)}</nav>
  );
  const head = (
    <>
      <Topbar title={tr('Analytics', '数据分析')} sub={tr('Website traffic, Google search and sales results.', '网站流量、谷歌搜索和销售数据。')}>{tab !== 'search' && periods}</Topbar>
      <Tabs label={tr('Analytics', '数据分析')} items={[
        { href: `/HunterLin/analytics?days=${days}`, label: tr('Website visitors', '网站访客'), current: tab === 'web' },
        { href: '/HunterLin/analytics?tab=search', label: tr('Google search', '谷歌搜索'), current: tab === 'search' },
        ...(can.crm(u) ? [{ href: `/HunterLin/analytics?tab=sales&days=${days}`, label: tr('Sales', '销售'), current: tab === 'sales' }] : []),
      ]} />
    </>
  );

  if (tab === 'web') {
    const w = webStats(days);
    const chart = (days <= 90 ? fillDays(w.daily, days) : fillDays(w.daily, days).filter((_, i, a) => (a.length - 1 - i) % 7 === 0))
      .map((d) => ({ label: d.day.slice(5).replace('-', '/'), value: d.value, title: `${d.day}: ${d.value}` }));
    const inqN = (db().prepare(`SELECT COUNT(*) c FROM inquiries WHERE created_at > datetime('now', ?) AND status != 'spam'`).get(`-${days} days`) as any).c;
    const vd = pctDelta(w.visitors, w.prevVisitors);
    const named = (rows: { k: string; v: number }[], f: (k: string) => string) => rows.map((r) => ({ label: f(r.k), value: r.v }));
    return (
      <>
        {head}
        <div className="grid g4" style={{ marginBottom: 16 }}>
          <Kpi label={tr('Visitors', '访客')} value={w.visitors.toLocaleString()} tone={vd > 0 ? 'up' : vd < 0 ? 'down' : ''} delta={`${vd >= 0 ? '+' : ''}${vd}% ${tr('vs previous period', '对比上一周期')}`} />
          <Kpi label={tr('Page views', '浏览量')} value={w.views.toLocaleString()} delta={w.visitors ? `${(w.views / w.visitors).toFixed(1)} ${tr('pages per visit', '页/次')}` : undefined} />
          <Kpi label={tr('Inquiries', '询盘')} value={inqN} delta={tr(`${pct(inqN, w.visitors)} of visitors`, `占访客 ${pct(inqN, w.visitors)}`)} />
          <Kpi label={tr('Chinese site share', '中文站占比')} value={pct(w.locales.find((x) => x.k === 'zh')?.v || 0, w.locales.reduce((s, x) => s + x.v, 0))} />
        </div>
        {!!db().prepare(`SELECT 1 FROM pageviews WHERE visitor LIKE 'demo-%' LIMIT 1`).get() && <p className="notice warn">{tr('Includes sample traffic created for the demo. A clean install (DEMO_DATA=0) starts at zero.', '包含演示用的示例流量。正式安装（DEMO_DATA=0）从零开始统计。')}</p>}
        {w.views === 0 && <p className="notice warn">{tr('No visits recorded yet. Counting starts once the site runs on a real server (the GitHub preview is static and records nothing).', '暂无访问数据。网站部署到正式服务器后开始统计（GitHub 预览版是静态页面，不记录访问）。')}</p>}
        <Panel title={tr('Visitors per day', '每日访客')}><BarChart data={chart} ink /></Panel>
        <div className="grid g2" style={{ margin: '16px 0' }}>
          <Panel title={tr('Top pages', '热门页面')} flush>
            <table className="t compact"><tbody>{w.pages.map((p) => <tr key={p.k}><td><a href={p.k} target="_blank" rel="noreferrer">{p.k}</a></td><td className="r">{p.v}</td></tr>)}</tbody></table>
          </Panel>
          <Panel title={tr('How visitors arrive', '访客来源渠道')}><HBars data={named(w.channels, (k) => channel(k || 'Direct', l))} /></Panel>
        </div>
        <div className="grid g3">
          <Panel title={tr('Referring sites', '来源网站')}>{w.referrers.filter((r) => r.k).length ? <HBars data={named(w.referrers.filter((r) => r.k), (k) => k)} ink /> : <p className="muted">—</p>}</Panel>
          <Panel title={tr('Countries', '国家/地区')}>{w.countries.filter((r) => r.k).length ? <HBars data={named(w.countries.filter((r) => r.k), (k) => countryName(k))} ink /> : <p className="muted">{tr('Country needs a host that passes it on (e.g. Cloudflare or Vercel).', '国家信息需要服务器提供（例如 Cloudflare 或 Vercel）。')}</p>}</Panel>
          <Panel title={tr('Devices and browsers', '设备与浏览器')}>
            <HBars data={named(w.devices, (k) => (DEVICE[k] || [k || '—', k || '—'])[l === 'zh' ? 1 : 0])} />
            <div style={{ marginTop: 12 }}><HBars data={named(w.browsers, (k) => k || '—')} ink /></div>
          </Panel>
        </div>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 12 }}>{tr('Privacy-friendly counting in the style of Plausible and Umami: no cookies, no personal data, IP addresses are never stored, and a visitor is counted once per day. Bots and people with “Do Not Track” are skipped.', '统计方式参考开源项目 Plausible 和 Umami：不使用 Cookie、不收集个人信息、不保存 IP 地址，同一访客每天只计一次。爬虫和开启“请勿追踪”的访客不计入。')}</p>
      </>
    );
  }

  if (tab === 'search') {
    const cfg = gscConfig();
    const r = cfg ? await gscReport() : null;
    const rep = r?.report;
    return (
      <>
        {head}
        {sp.error && <p className="notice bad">{sp.error}</p>}
        {sp.refreshed && <p className="notice">{tr('Updated from Google.', '已从谷歌更新。')}</p>}
        {!cfg ? (
          <Panel title={tr('Connect Google Search Console', '连接 Google Search Console')}>
            <p>{tr('Search Console is Google’s free tool that shows the searches your site appears for, its average position, and clicks. Connect it once and the numbers appear here.', 'Search Console 是谷歌提供的免费工具，可以看到网站出现在哪些搜索词下、平均排名和点击量。连接一次后，数据会显示在这里。')}</p>
            {can.users(u) ? <Link className="btn btn-primary" href="/HunterLin/settings/integrations">{tr('Set it up', '去设置')}</Link> : <p className="muted">{tr('Ask an administrator to connect it under Settings.', '请管理员在“设置”中连接。')}</p>}
          </Panel>
        ) : !rep ? (
          <Panel title={tr('Google search', '谷歌搜索')}><p className="notice bad">{r?.error || tr('No data yet.', '暂无数据。')}</p><form action={refreshGsc}><button className="btn">{tr('Try again', '重试')}</button></form></Panel>
        ) : (
          <>
            <div className="inline-form" style={{ marginBottom: 12 }}>
              <span className="muted">{cfg.property} · {rep.range[0]} – {rep.range[1]} · {tr('updated', '更新于')} {fmtDateTime(rep.fetchedAt, l)}</span>
              <form action={refreshGsc}><button className="btn btn-sm">{tr('Refresh', '刷新')}</button></form>
            </div>
            {r?.error && <p className="notice warn">{tr('Showing the last saved data. ', '显示上次保存的数据。')}{r.error}</p>}
            <div className="grid g4" style={{ marginBottom: 16 }}>
              <Kpi label={tr('Clicks', '点击')} value={rep.totals.clicks.toLocaleString()} />
              <Kpi label={tr('Impressions', '展示')} value={rep.totals.impressions.toLocaleString()} />
              <Kpi label={tr('Click-through rate', '点击率')} value={`${(rep.totals.ctr * 100).toFixed(1)}%`} />
              <Kpi label={tr('Average position', '平均排名')} value={rep.totals.position ? rep.totals.position.toFixed(1) : '—'} delta={tr('1 = top of page one', '1 表示第一页第一位')} />
            </div>
            <Panel title={tr('Clicks per day', '每日点击')}><BarChart data={rep.daily.map((d) => ({ label: d.day.slice(5).replace('-', '/'), value: d.clicks, title: `${d.day}: ${d.clicks} clicks, ${d.impressions} impressions, position ${d.position.toFixed(1)}` }))} /></Panel>
            <div className="grid g2" style={{ marginTop: 16 }}>
              <Panel title={tr('Search terms', '搜索词')} flush>
                <div className="table-wrap"><table className="t compact">
                  <thead><tr><th>{tr('Query', '关键词')}</th><th className="r">{tr('Position', '排名')}</th><th className="r">{tr('Clicks', '点击')}</th><th className="r">{tr('Impr.', '展示')}</th></tr></thead>
                  <tbody>{rep.queries.map((q) => <tr key={q.keys[0]}><td>{q.keys[0]}</td><td className="r">{q.position.toFixed(1)}</td><td className="r">{q.clicks}</td><td className="r muted">{q.impressions}</td></tr>)}</tbody>
                </table></div>
              </Panel>
              <div className="stack">
                <Panel title={tr('Pages in search', '出现在搜索中的页面')} flush>
                  <div className="table-wrap"><table className="t compact">
                    <thead><tr><th>{tr('Page', '页面')}</th><th className="r">{tr('Clicks', '点击')}</th><th className="r">{tr('Position', '排名')}</th></tr></thead>
                    <tbody>{rep.pages.map((p) => { let path = p.keys[0]; try { path = new URL(p.keys[0]).pathname; } catch { /* keep */ } return <tr key={p.keys[0]}><td><a href={p.keys[0]} target="_blank" rel="noreferrer">{path}</a></td><td className="r">{p.clicks}</td><td className="r muted">{p.position.toFixed(1)}</td></tr>; })}</tbody>
                  </table></div>
                </Panel>
                <Panel title={tr('Countries', '国家/地区')}><HBars data={rep.countries.map((c) => ({ label: countryName(c.keys[0].toUpperCase().slice(0, 2)) || c.keys[0], value: c.clicks }))} ink /></Panel>
              </div>
            </div>
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: 12 }}>{tr('Google reports search data with a delay of about two days. Data refreshes every 6 hours, or when you press Refresh.', '谷歌搜索数据约有两天延迟。系统每 6 小时自动更新，也可以点“刷新”。')}</p>
          </>
        )}
      </>
    );
  }

  // Sales
  const inq = db().prepare(`SELECT i.*, us.name AS owner, o.stage AS opp_stage, o.value AS opp_value FROM inquiries i LEFT JOIN users us ON us.id = i.owner_id LEFT JOIN opportunities o ON o.id = i.opportunity_id
    WHERE ${scope(u, 'i.owner_id', true)} AND i.created_at > datetime('now', ?) AND i.status != 'spam'`).all(`-${days} days`) as any[];
  const opps = db().prepare(`SELECT * FROM opportunities WHERE ${scope(u)} AND updated_at > datetime('now', ?)`).all(`-${days} days`) as any[];
  const total = inq.length;
  const responded = inq.filter((r) => r.first_response_at).length;
  const converted = inq.filter((r) => r.status === 'converted' || r.opportunity_id).length;
  const wonOpps = opps.filter((o) => o.stage === 'won');
  const resp = inq.filter((r) => r.first_response_at).map((r) => hoursBetween(r.created_at, r.first_response_at));
  const weeks = Math.max(2, Math.min(26, Math.ceil(days / 7)));
  const perWeek = Array.from({ length: weeks }, (_, k) => {
    const w = weeks - 1 - k;
    const end = Date.now() - w * 7 * 86400000, start = end - 7 * 86400000;
    const lab = new Date(start + 86400000).toISOString().slice(5, 10).replace('-', '/');
    return { label: lab, value: inq.filter((r) => { const t = new Date(r.created_at.replace(' ', 'T') + 'Z').getTime(); return t > start && t <= end; }).length };
  });
  const group = (key: (r: any) => string) => Object.entries(inq.reduce((m: Record<string, any[]>, r) => { const k = key(r) || '—'; (m[k] ||= []).push(r); return m; }, {}))
    .map(([lab, rows]) => ({ label: lab, rows: rows as any[], value: (rows as any[]).length })).sort((a, b) => b.value - a.value);
  const bySource = group((r) => channel(r.source || 'Direct', l));
  const byCountry = group((r) => countryName(r.country)).slice(0, 10);
  const byType = group((r) => label(r.type, l));
  const productCounts: Record<string, number> = {};
  inq.forEach((r) => j<any[]>(r.items, []).forEach((i) => { productCounts[i.model] = (productCounts[i.model] || 0) + 1; }));
  const byProduct = Object.entries(productCounts).map(([lab, value]) => ({ label: lab, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const byRep = group((r) => r.owner || tr('Unassigned', '未分配'));
  const funnel: [string, number][] = [[tr('Inquiries', '询盘'), total], [tr('Replied', '已回复'), responded], [tr('Deal created', '转为商机'), converted], [tr('Won', '赢单'), inq.filter((r) => r.opp_stage === 'won').length]];

  return (
    <>
      {head}
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Kpi label={tr('Inquiries', '询盘')} value={total} delta={`${(total / (days / 7)).toFixed(1)} ${tr('a week', '/周')}`} />
        <Kpi label={tr('Inquiry to deal', '询盘转商机')} value={pct(converted, total)} delta={`${converted} ${tr('converted', '个已转化')}`} />
        <Kpi label={tr('Median first reply', '首次回复中位数')} value={resp.length ? `${median(resp).toFixed(1)} h` : '—'} delta={`${pct(resp.filter((h) => h <= 24).length, resp.length)} ${tr('within 24 h', '在 24 小时内')}`} />
        <Kpi label={tr('Won in period', '期间赢单')} value={compactMoney(wonOpps.reduce((s, o) => s + o.value, 0))} delta={`${wonOpps.length} ${tr('deals', '个商机')}`} />
      </div>
      <div className="grid g2" style={{ marginBottom: 16 }}>
        <Panel title={tr('Inquiries per week', '每周询盘')}><BarChart data={perWeek} /></Panel>
        <Panel title={tr('From inquiry to order', '从询盘到订单')}>
          <div className="funnel">
            {funnel.map(([lab, v], i) => (
              <div className="funnel-step" key={lab}>
                <span>{lab}</span>
                <div className="bar-wrap"><div className="bar-in" style={{ width: `${total ? (v / total) * 100 : 0}%` }} title={`${lab}: ${v}`} /></div>
                <span className="pct"><b>{v}</b>{i > 0 ? `  ${pct(v, funnel[i - 1][1])}` : ''}</span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: '0.8rem', marginTop: 12 }}>{tr('Percentages compare each step with the one before it.', '百分比是与上一步相比的转化率。')}</p>
        </Panel>
      </div>
      <Panel title={tr('Lead sources and how well they convert', '各来源的询盘与转化')} flush>
        <div className="table-wrap"><table className="t">
          <thead><tr><th>{tr('Channel', '渠道')}</th><th style={{ width: '38%' }}>{tr('Inquiries', '询盘')}</th><th className="r">{tr('Became deals', '转为商机')}</th><th className="r">{tr('Conversion', '转化率')}</th><th className="r">{tr('Deal value', '商机金额')}</th></tr></thead>
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
        <Panel title={tr('Top countries', '主要国家/地区')}><HBars data={byCountry} ink /></Panel>
        <Panel title={tr('Most requested parts', '询价最多的型号')}><HBars data={byProduct} /></Panel>
        <Panel title={tr('Request types', '需求类型')}><HBars data={byType} ink /></Panel>
      </div>
      <div style={{ marginTop: 16 }}>
        <Panel title={tr('Response time by owner', '各负责人回复速度')} flush>
          <table className="t">
            <thead><tr><th>{tr('Owner', '负责人')}</th><th className="r">{tr('Inquiries', '询盘')}</th><th className="r">{tr('Replied', '已回复')}</th><th className="r">{tr('Median first reply', '首次回复中位数')}</th><th className="r">{tr('Converted', '转化率')}</th></tr></thead>
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

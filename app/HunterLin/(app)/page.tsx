import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, compactMoney, hoursBetween, median, STAGE_PROB } from '@/lib/admin';
import { translator, label, channel, fmtAgo, fmtDateTime } from '@/lib/admin-lang';
import { webStats, fillDays } from '@/lib/analytics';
import { gscConfig, gscReport } from '@/lib/gsc';
import { mailAccounts } from '@/lib/mail';
import { Topbar, Panel, Pill, BarChart, HBars, Kpi } from '@/components/admin/ui';
import { toggleTask, createTask } from '../actions';

export const metadata = { title: 'Dashboard' };

const tms = (s: string) => new Date(s.replace(' ', 'T') + 'Z').getTime();
const pctDelta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string; done?: string }> }) {
  const u = await requireUser();
  const { l, tr } = await translator();
  const sp = await searchParams;
  const first = u.name.split(' ')[0];
  const today = new Date().toISOString().slice(0, 10);
  const tasks = db().prepare(`SELECT t.*, a.name AS account FROM tasks t LEFT JOIN accounts a ON a.id = t.account_id WHERE t.user_id = ? AND t.done = ${sp.done ? 1 : 0} ORDER BY ${sp.done ? 't.id DESC' : 't.due_at IS NULL, t.due_at'} LIMIT 30`).all(u.id) as any[];
  const accountsForTask = can.crm(u) ? (db().prepare(`SELECT id, name FROM accounts WHERE ${scope(u)} ORDER BY name`).all() as any[]) : [];

  const web = webStats(30);
  const web7 = webStats(7);
  const visitorsChart = fillDays(web.daily, 30).map((d) => ({ label: d.day.slice(5).replace('-', '/'), value: d.value, title: `${d.day}: ${d.value}` }));
  const gsc = gscConfig() ? await gscReport() : null;

  const followUps = (
    <Panel title={tr('My follow-ups', '我的待办')} aside={<Link href={sp.done ? '/HunterLin' : '/HunterLin?done=1'} className="muted">{sp.done ? tr('Show open', '查看未完成') : tr('Show done', '查看已完成')}</Link>} flush>
      {tasks.length === 0 ? <p className="empty">{sp.done ? tr('Nothing completed yet.', '还没有已完成的待办。') : tr('Nothing to follow up. Add one below.', '没有待办事项，可在下方添加。')}</p> : (
        <ul className="tasks">
          {tasks.map((t) => {
            const overdue = !t.done && t.due_at && t.due_at.slice(0, 10) < today;
            return (
              <li key={t.id} className={t.done ? 'done' : ''}>
                <form action={toggleTask}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="back" value={sp.done ? '/HunterLin?done=1' : '/HunterLin'} /><button className="btn btn-sm" title={t.done ? tr('Reopen', '恢复') : tr('Mark done', '标记完成')} aria-label={`${t.done ? tr('Reopen', '恢复') : tr('Mark done', '标记完成')}: ${t.title}`}>{t.done ? '↺' : '✓'}</button></form>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 560 }}>{t.title}</div>
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    {overdue ? <span style={{ color: 'var(--bad)', fontWeight: 600 }}>{tr('Overdue', '已逾期')} · {fmtDateTime(t.due_at, l)}</span> : t.due_at ? `${tr('Due', '截止')} ${fmtDateTime(t.due_at, l)}` : tr('No due date', '无截止日期')}
                    {t.account_id ? <> · <Link href={`/HunterLin/accounts/${t.account_id}`}>{t.account}</Link></> : null}
                    {t.inquiry_id ? <> · <Link href={`/HunterLin/inquiries/${t.inquiry_id}`}>{tr('inquiry', '询盘')}</Link></> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form action={createTask} className="form task-add">
        <input type="hidden" name="back" value="/HunterLin" />
        <input name="title" required placeholder={tr('Add a follow-up, e.g. “Send samples to Lumora”', '添加待办，例如“给客户寄样”')} aria-label={tr('Follow-up', '待办')} />
        <div className="inline-form">
          <input type="date" name="due" aria-label={tr('Due date', '截止日期')} />
          {accountsForTask.length > 0 && <select name="account_id" aria-label={tr('Customer', '客户')} defaultValue=""><option value="">{tr('No customer', '不关联客户')}</option>{accountsForTask.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>}
          <button className="btn btn-sm">{tr('Add', '添加')}</button>
        </div>
      </form>
    </Panel>
  );

  const visitorsPanel = (
    <Panel title={tr('Website visitors, last 30 days', '近 30 天网站访客')} aside={<Link href="/HunterLin/analytics" className="muted">{tr('Analytics', '数据分析')}</Link>}>
      {web.views === 0 ? <p className="muted">{tr('No visits recorded yet. Visits are counted from the moment the site runs on a real server; the GitHub preview does not record them.', '暂无访问记录。网站部署到正式服务器后开始统计；GitHub 预览版不会记录访问。')}</p> : <BarChart data={visitorsChart} ink />}
    </Panel>
  );

  const searchPanel = gsc?.report ? (
    <Panel title={tr('Google search, last 28 days', '谷歌搜索，近 28 天')} aside={<Link href="/HunterLin/analytics?tab=search" className="muted">{tr('Details', '详情')}</Link>}>
      <div className="mini-kpis">
        <div><b>{gsc.report.totals.clicks.toLocaleString()}</b><span>{tr('clicks', '点击')}</span></div>
        <div><b>{gsc.report.totals.impressions.toLocaleString()}</b><span>{tr('impressions', '展示')}</span></div>
        <div><b>{gsc.report.totals.position ? gsc.report.totals.position.toFixed(1) : '—'}</b><span>{tr('avg. position', '平均排名')}</span></div>
      </div>
      <table className="t compact"><tbody>{gsc.report.queries.slice(0, 5).map((q) => <tr key={q.keys[0]}><td>{q.keys[0]}</td><td className="r muted">#{q.position.toFixed(1)}</td><td className="r">{q.clicks}</td></tr>)}</tbody></table>
    </Panel>
  ) : (
    <Panel title={tr('Google search rankings', '谷歌搜索排名')}>
      <p className="muted">{gsc?.error ? gsc.error : tr('Connect Google Search Console to see which searches bring people to the site and where you rank.', '连接 Google Search Console 后，可以看到客户用哪些关键词找到网站，以及网站的排名。')}</p>
      {can.users(u) && <Link className="btn btn-sm" href="/HunterLin/settings/integrations">{tr('Connect Search Console', '连接 Search Console')}</Link>}
    </Panel>
  );

  const deniedNote = sp.denied && <p className="notice warn">{tr('Your role doesn’t include that area. Ask an administrator if you need access.', '你的角色没有该模块的权限，如需访问请联系管理员。')}</p>;

  if (!can.crm(u)) {
    const c = db().prepare(`SELECT (SELECT COUNT(*) FROM products WHERE status='published') pp, (SELECT COUNT(*) FROM products WHERE status='draft') pd, (SELECT COUNT(*) FROM articles WHERE status='published') ap, (SELECT COUNT(*) FROM articles WHERE status='draft') ad`).get() as any;
    const recent = db().prepare(`SELECT 'product' kind, id, model AS title, status, updated_at FROM products UNION ALL SELECT 'article', id, coalesce(nullif(title_en,''), title_zh), status, updated_at FROM articles ORDER BY updated_at DESC LIMIT 8`).all() as any[];
    const missingZh = db().prepare(`SELECT COUNT(*) c FROM products WHERE coalesce(name_zh,'') = '' OR coalesce(summary_zh,'') = ''`).get() as any;
    return (
      <>
        <Topbar title={tr(`Good to see you, ${first}`, `${first}，你好`)} sub={tr('Website content and traffic at a glance.', '网站内容与访问概况。')} />
        {deniedNote}
        <div className="grid g4" style={{ marginBottom: 16 }}>
          <Kpi label={tr('Visitors, last 7 days', '近 7 天访客')} value={web7.visitors} delta={`${pctDelta(web7.visitors, web7.prevVisitors) >= 0 ? '+' : ''}${pctDelta(web7.visitors, web7.prevVisitors)}% ${tr('vs previous 7 days', '对比前 7 天')}`} />
          <Kpi label={tr('Published products', '已发布产品')} value={c.pp} delta={`${c.pd} ${tr('drafts', '篇草稿')}`} />
          <Kpi label={tr('Published articles', '已发布文章')} value={c.ap} delta={`${c.ad} ${tr('drafts', '篇草稿')}`} />
          <Kpi label={tr('Products missing Chinese copy', '缺少中文内容的产品')} value={missingZh.c} />
        </div>
        <div className="grid g-main">
          <div className="stack">
            {visitorsPanel}
            <Panel title={tr('Recently edited', '最近编辑')} flush>
              <table className="t"><tbody>{recent.map((r) => <tr key={r.kind + r.id}><td><Link className="row-link" href={`/HunterLin/${r.kind}s/${r.id}`}>{r.title}</Link><span className="sub">{r.kind === 'product' ? tr('Product', '产品') : tr('Article', '文章')}</span></td><td><Pill v={r.status} label={label(r.status, l)} /></td><td className="r muted">{fmtAgo(r.updated_at, l)}</td></tr>)}</tbody></table>
            </Panel>
          </div>
          <div className="stack">{searchPanel}{followUps}</div>
        </div>
      </>
    );
  }

  const sc = scope(u, 'owner_id', true);
  const inq = db().prepare(`SELECT * FROM inquiries WHERE ${sc} AND created_at > datetime('now','-90 days') AND status != 'spam'`).all() as any[];
  const days = (n: number) => Date.now() - n * 86400000;
  const last7 = inq.filter((r) => tms(r.created_at) > days(7)).length;
  const prev7 = inq.filter((r) => tms(r.created_at) > days(14) && tms(r.created_at) <= days(7)).length;
  const resp = inq.filter((r) => r.first_response_at && tms(r.created_at) > days(30)).map((r) => hoursBetween(r.created_at, r.first_response_at));
  const opps = db().prepare(`SELECT * FROM opportunities WHERE ${scope(u)}`).all() as any[];
  const open = opps.filter((o) => !['won', 'lost'].includes(o.stage));
  const openW = open.reduce((a, o) => a + o.value * STAGE_PROB[o.stage], 0);
  const waiting = db().prepare(`SELECT i.*, us.name AS owner FROM inquiries i LEFT JOIN users us ON us.id = i.owner_id WHERE ${sc.replace(/owner_id/g, 'i.owner_id')} AND i.status = 'new' ORDER BY i.created_at LIMIT 8`).all() as any[];
  const unread = db().prepare(`SELECT e.*, a.name AS account FROM emails e LEFT JOIN accounts a ON a.id = e.account_id WHERE e.direction = 'in' AND e.read = 0 AND e.mail_account_id IN (${[0, ...mailAccounts(u).map((m) => m.id)].join(',')}) ORDER BY e.created_at DESC LIMIT 6`).all() as any[];
  const sources = Object.entries(inq.reduce((m: Record<string, number>, r) => { const k = r.source || 'Direct'; m[k] = (m[k] || 0) + 1; return m; }, {}))
    .map(([k, v]) => ({ label: channel(k, l), value: v as number })).sort((a, b) => b.value - a.value);
  const delta = last7 - prev7;
  const vd = pctDelta(web7.visitors, web7.prevVisitors);

  return (
    <>
      <Topbar title={tr(`Good to see you, ${first}`, `${first}，你好`)} sub={can.seeAll(u) ? tr('Whole team.', '全部团队数据。') : tr('Your customers and unassigned inquiries.', '你负责的客户和未分配的询盘。')}>
        <Link href="/HunterLin/inbox" className="btn btn-primary">{tr('Open inbox', '打开收件箱')}</Link>
      </Topbar>
      {deniedNote}
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Kpi label={tr('Inquiries, last 7 days', '近 7 天询盘')} value={last7} tone={delta > 0 ? 'up' : delta < 0 ? 'down' : ''} delta={`${delta >= 0 ? '+' : ''}${delta} ${tr('vs previous 7 days', '对比前 7 天')}`} />
        <Kpi label={tr('Median first reply, 30 days', '近 30 天首次回复中位数')} value={resp.length ? `${median(resp).toFixed(1)} h` : '—'} delta={tr('Target: same working day', '目标：当个工作日内')} />
        <Kpi label={tr('Website visitors, 7 days', '近 7 天网站访客')} value={web7.visitors} tone={vd > 0 ? 'up' : vd < 0 ? 'down' : ''} delta={`${vd >= 0 ? '+' : ''}${vd}% ${tr('vs previous 7 days', '对比前 7 天')}`} />
        <Kpi label={tr('Open deals, weighted', '进行中商机（加权）')} value={compactMoney(openW)} delta={`${open.length} ${tr('open deals', '个进行中')}`} />
      </div>

      <div className="grid g-main">
        <div className="stack">
          <Panel title={tr('Waiting for a first reply', '等待首次回复')} aside={<Link href="/HunterLin/inbox?status=new" className="muted">{tr('All new', '全部新询盘')}</Link>} flush>
            {waiting.length === 0 ? <p className="empty">{tr('Every inquiry has had a reply.', '所有询盘都已回复。')}</p> : (
              <div className="table-wrap"><table className="t">
                <thead><tr><th>{tr('From', '来自')}</th><th>{tr('Request', '需求')}</th><th>{tr('Owner', '负责人')}</th><th className="r">{tr('Waiting', '已等待')}</th></tr></thead>
                <tbody>
                  {waiting.map((r) => {
                    const h = hoursBetween(r.created_at, new Date().toISOString());
                    return (
                      <tr key={r.id} className="unread">
                        <td><Link className="row-link" href={`/HunterLin/inquiries/${r.id}`}>{r.company}</Link><span className="sub">{r.name}, {r.country}</span></td>
                        <td>{label(r.type, l)}<span className="sub">{j<any[]>(r.items, []).map((i) => i.model).join(', ') || channel(r.source, l)}</span></td>
                        <td>{r.owner || <Pill v="new" label={tr('Unassigned', '未分配')} />}</td>
                        <td className="r">{h > 24 ? <Pill v="overdue" label={fmtAgo(r.created_at, l)} /> : <span className="muted">{fmtAgo(r.created_at, l)}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </Panel>
          {unread.length > 0 && (
            <Panel title={tr('Unread email', '未读邮件')} aside={<Link href="/HunterLin/inbox?tab=email" className="muted">{tr('All email', '全部邮件')}</Link>} flush>
              <table className="t"><tbody>{unread.map((e) => (
                <tr key={e.id} className="unread"><td><Link className="row-link" href={`/HunterLin/inbox/email/${e.id}`}>{e.from_name || e.from_addr}</Link><span className="sub">{e.subject}</span></td><td>{e.account || <span className="muted">—</span>}</td><td className="r muted">{fmtAgo(e.created_at, l)}</td></tr>
              ))}</tbody></table>
            </Panel>
          )}
          {visitorsPanel}
        </div>
        <div className="stack">
          {followUps}
          {searchPanel}
          <Panel title={tr('Where inquiries come from', '询盘来源')} aside={<span className="muted">{tr('90 days', '90 天')}</span>}>
            {sources.length ? <HBars data={sources} /> : <p className="muted">{tr('No inquiries yet.', '暂无询盘。')}</p>}
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: 10 }}>{tr('“AI search” counts visitors referred by ChatGPT, Perplexity, Gemini and similar assistants.', '“AI 搜索”指从 ChatGPT、Perplexity、Gemini 等 AI 助手点击过来的访客。')}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}

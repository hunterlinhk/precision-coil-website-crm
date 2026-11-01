import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, compactMoney, ago, dateTime, hoursBetween, median, STAGE_PROB, INQ_TYPE } from '@/lib/admin';
import { Topbar, Panel, Pill, BarChart, HBars } from '@/components/admin/ui';
import { toggleTask } from '../actions';

export const metadata = { title: 'Dashboard' };

function weekBuckets(rows: { created_at: string }[], weeks = 12) {
  const out: { label: string; value: number }[] = [];
  const nowMs = Date.now();
  for (let w = weeks - 1; w >= 0; w--) {
    const end = nowMs - w * 7 * 86400000, start = end - 7 * 86400000;
    const d = new Date(start + 86400000);
    out.push({ label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: rows.filter((r) => { const t = new Date(r.created_at.replace(' ', 'T') + 'Z').getTime(); return t > start && t <= end; }).length });
  }
  return out;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const u = await requireUser();
  const { denied } = await searchParams;
  const first = u.name.split(' ')[0];
  const tasks = db().prepare(`SELECT t.*, a.name AS account FROM tasks t LEFT JOIN accounts a ON a.id = t.account_id WHERE t.user_id = ? AND t.done = 0 AND (t.due_at IS NULL OR t.due_at < datetime('now', '+2 days')) ORDER BY t.due_at`).all(u.id) as any[];

  if (!can.crm(u)) {
    const c = db().prepare(`SELECT (SELECT COUNT(*) FROM products WHERE status='published') pp, (SELECT COUNT(*) FROM products WHERE status='draft') pd, (SELECT COUNT(*) FROM articles WHERE status='published') ap, (SELECT COUNT(*) FROM articles WHERE status='draft') ad`).get() as any;
    const recent = db().prepare(`SELECT 'product' kind, id, model AS title, status, updated_at FROM products UNION ALL SELECT 'article', id, title_en, status, updated_at FROM articles ORDER BY updated_at DESC LIMIT 8`).all() as any[];
    const missingZh = db().prepare(`SELECT COUNT(*) c FROM products WHERE coalesce(name_zh,'') = '' OR coalesce(summary_zh,'') = ''`).get() as any;
    return (
      <>
        <Topbar title={`Good to see you, ${first}`} sub="Website content at a glance." />
        {denied && <p className="notice warn">Your role doesn&apos;t include that area. Ask an administrator if you need access.</p>}
        <div className="grid g4" style={{ marginBottom: 16 }}>
          <div className="panel kpi"><div className="label">Published products</div><div className="value">{c.pp}</div><div className="delta">{c.pd} drafts</div></div>
          <div className="panel kpi"><div className="label">Published articles</div><div className="value">{c.ap}</div><div className="delta">{c.ad} drafts</div></div>
          <div className="panel kpi"><div className="label">Products missing Chinese copy</div><div className="value">{missingZh.c}</div></div>
          <div className="panel kpi"><div className="label">Languages</div><div className="value">2</div><div className="delta">English, 简体中文</div></div>
        </div>
        <Panel title="Recently edited" flush>
          <table className="t"><tbody>{recent.map((r) => <tr key={r.kind + r.id}><td><Link className="row-link" href={`/HunterLin/${r.kind}s/${r.id}`}>{r.title}</Link><span className="sub">{r.kind}</span></td><td><Pill v={r.status} /></td><td className="r muted">{ago(r.updated_at)}</td></tr>)}</tbody></table>
        </Panel>
      </>
    );
  }

  const sc = scope(u, 'owner_id', true);
  const inq = db().prepare(`SELECT * FROM inquiries WHERE ${sc} AND created_at > datetime('now','-84 days') AND status != 'spam'`).all() as any[];
  const days = (n: number) => Date.now() - n * 86400000;
  const tms = (s: string) => new Date(s.replace(' ', 'T') + 'Z').getTime();
  const last7 = inq.filter((r) => tms(r.created_at) > days(7)).length;
  const prev7 = inq.filter((r) => tms(r.created_at) > days(14) && tms(r.created_at) <= days(7)).length;
  const resp = inq.filter((r) => r.first_response_at && tms(r.created_at) > days(30)).map((r) => hoursBetween(r.created_at, r.first_response_at));
  const opps = db().prepare(`SELECT * FROM opportunities WHERE ${scope(u)}`).all() as any[];
  const openW = opps.filter((o) => !['won', 'lost'].includes(o.stage)).reduce((a, o) => a + o.value * STAGE_PROB[o.stage], 0);
  const openN = opps.filter((o) => !['won', 'lost'].includes(o.stage)).length;
  const won = opps.filter((o) => o.stage === 'won' && tms(o.updated_at) > days(90)).reduce((a, o) => a + o.value, 0);
  const waiting = db().prepare(`SELECT i.*, us.name AS owner FROM inquiries i LEFT JOIN users us ON us.id = i.owner_id WHERE ${sc.replace(/owner_id/g, 'i.owner_id')} AND i.status = 'new' ORDER BY i.created_at LIMIT 8`).all() as any[];
  const sources = Object.entries(inq.filter((r) => tms(r.created_at) > days(90)).reduce((m: any, r) => { m[r.source || 'Direct'] = (m[r.source || 'Direct'] || 0) + 1; return m; }, {}))
    .map(([label, value]) => ({ label, value: value as number })).sort((a, b) => b.value - a.value);
  const activity = db().prepare(`SELECT ac.*, us.name AS who, a.name AS account FROM activities ac LEFT JOIN users us ON us.id = ac.user_id LEFT JOIN accounts a ON a.id = ac.account_id
    WHERE ${can.seeAll(u) ? '1=1' : `(ac.user_id = ${u.id} OR a.owner_id = ${u.id})`} ORDER BY ac.created_at DESC LIMIT 8`).all() as any[];
  const delta = last7 - prev7;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Topbar title={`Good to see you, ${first}`} sub={can.seeAll(u) ? 'Whole team, last 12 weeks.' : 'Your accounts and unassigned inquiries.'}>
        <Link href="/HunterLin/inquiries?status=new" className="btn btn-primary">Open inbox</Link>
      </Topbar>
      {denied && <p className="notice warn">Your role doesn&apos;t include that area. Ask an administrator if you need access.</p>}
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="panel kpi"><div className="label">Inquiries, last 7 days</div><div className="value">{last7}</div><div className={`delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`}>{delta >= 0 ? '+' : ''}{delta} vs previous 7 days</div></div>
        <div className="panel kpi"><div className="label">Median first response, 30 days</div><div className="value">{resp.length ? `${median(resp).toFixed(1)} h` : '—'}</div><div className="delta">Target: under 6 working hours</div></div>
        <div className="panel kpi"><div className="label">Open pipeline, weighted</div><div className="value">{compactMoney(openW)}</div><div className="delta">{openN} open opportunities</div></div>
        <div className="panel kpi"><div className="label">Won, last 90 days</div><div className="value">{compactMoney(won)}</div><div className="delta">Annualised order value</div></div>
      </div>

      <div className="grid g-main">
        <div className="stack">
          <Panel title="Waiting for a first reply" aside={<Link href="/HunterLin/inquiries?status=new" className="muted">All new</Link>} flush>
            {waiting.length === 0 ? <p className="empty">Inbox zero. Every inquiry has had a reply.</p> : (
              <div className="table-wrap"><table className="t">
                <thead><tr><th>From</th><th>Request</th><th>Owner</th><th className="r">Waiting</th></tr></thead>
                <tbody>
                  {waiting.map((r) => {
                    const h = hoursBetween(r.created_at, new Date().toISOString());
                    return (
                      <tr key={r.id} className="unread">
                        <td><Link className="row-link" href={`/HunterLin/inquiries/${r.id}`}>{r.company}</Link><span className="sub">{r.name}, {r.country}</span></td>
                        <td>{INQ_TYPE[r.type]}<span className="sub">{j<any[]>(r.items, []).map((i) => i.model).join(', ') || r.source}</span></td>
                        <td>{r.owner || <Pill v="new" label="Unassigned" />}</td>
                        <td className="r">{h > 24 ? <Pill v="overdue" label={ago(r.created_at).replace(' ago', '')} /> : <span className="muted">{ago(r.created_at)}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </Panel>
          <Panel title="Inquiries per week" aside={<span className="muted">{inq.length} in 12 weeks</span>}>
            <BarChart data={weekBuckets(inq)} />
          </Panel>
        </div>
        <div className="stack">
          <Panel title="My follow-ups" aside={<Link href="/HunterLin/tasks" className="muted">All tasks</Link>} flush>
            {tasks.length === 0 ? <p className="empty">Nothing due in the next two days.</p> : (
              <ul>
                {tasks.map((t) => {
                  const overdue = t.due_at && t.due_at.slice(0, 10) < today;
                  return (
                    <li key={t.id} style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--rule)', alignItems: 'flex-start' }}>
                      <form action={toggleTask}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="back" value="/HunterLin" /><button className="btn btn-sm" title="Mark done" aria-label={`Mark "${t.title}" done`}>✓</button></form>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 560 }}>{t.title}</div>
                        <div className="muted" style={{ fontSize: '0.82rem' }}>{overdue ? <span style={{ color: 'var(--bad)', fontWeight: 600 }}>Overdue, {dateTime(t.due_at)}</span> : t.due_at ? `Due ${dateTime(t.due_at)}` : 'No due date'}{t.account ? `, ${t.account}` : ''}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <Panel title="Where inquiries come from" aside={<span className="muted">90 days</span>}>
            <HBars data={sources} />
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: 10 }}>&ldquo;AI search&rdquo; counts visitors referred by ChatGPT, Perplexity, Gemini and similar assistants.</p>
          </Panel>
          <Panel title="Recent activity" flush>
            <ul className="timeline" style={{ padding: '0 16px' }}>
              {activity.map((a) => (
                <li key={a.id}>
                  <span className={`tl-icon ${a.kind}`}>{a.kind.slice(0, 2).toUpperCase()}</span>
                  <div><div className="tl-meta">{a.who || 'Website'}{a.account ? ` on ${a.account}` : ''}, {ago(a.created_at)}</div><div className="tl-body">{a.body}</div></div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

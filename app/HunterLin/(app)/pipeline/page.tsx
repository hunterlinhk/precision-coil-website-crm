import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, compactMoney, money, STAGES, STAGE_PROB, salesUsers } from '@/lib/admin';
import { translator, label, fmtDate } from '@/lib/admin-lang';
import { Topbar } from '@/components/admin/ui';
import { AutoSelect } from '@/components/admin/client';
import { saveOpportunity } from '@/app/HunterLin/actions';

export const metadata = { title: 'Deals' };

export default async function Pipeline({ searchParams }: { searchParams: Promise<{ owner?: string; closed?: string }> }) {
  const u = await requireUser(can.crm);
  const { l, tr } = await translator();
  const sp = await searchParams;
  const where = [scope(u, 'o.owner_id')];
  if (sp.owner && can.seeAll(u)) where.push(`o.owner_id = ${+sp.owner}`);
  // Won and lost lanes show the last 90 days unless asked for everything.
  if (!sp.closed) where.push(`(o.stage NOT IN ('won','lost') OR o.updated_at > datetime('now','-90 days'))`);
  const opps = db().prepare(`SELECT o.*, a.name AS account, us.name AS owner FROM opportunities o JOIN accounts a ON a.id = o.account_id LEFT JOIN users us ON us.id = o.owner_id WHERE ${where.join(' AND ')} ORDER BY o.value DESC`).all() as any[];
  const accounts = db().prepare(`SELECT id, name FROM accounts WHERE ${scope(u)} ORDER BY name`).all() as any[];
  const open = opps.filter((o) => !['won', 'lost'].includes(o.stage));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <Topbar title={tr('Deals', '商机')} sub={tr(`${open.length} open · ${money(open.reduce((s, o) => s + o.value, 0))} total · ${money(open.reduce((s, o) => s + o.value * STAGE_PROB[o.stage], 0))} weighted`, `进行中 ${open.length} 个 · 合计 ${money(open.reduce((s, o) => s + o.value, 0))} · 加权 ${money(open.reduce((s, o) => s + o.value * STAGE_PROB[o.stage], 0))}`)}>
        <form className="inline-form">
          {can.seeAll(u) && <select name="owner" defaultValue={sp.owner || ''} aria-label={tr('Owner', '负责人')}><option value="">{tr('Whole team', '全部团队')}</option>{salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}
          <label className="check"><input type="checkbox" name="closed" value="1" defaultChecked={!!sp.closed} /> {tr('Include older won/lost', '包含更早的赢单/丢单')}</label>
          <button className="btn btn-sm">{tr('Show', '显示')}</button>
        </form>
      </Topbar>
      <details className="panel quick-add">
        <summary>{tr('+ New deal', '+ 新建商机')}</summary>
        <form action={saveOpportunity} className="inline-form" style={{ padding: '0 16px 16px' }}>
          <input type="hidden" name="back" value="/HunterLin/pipeline" />
          <select name="account_id" required aria-label={tr('Customer', '客户')} defaultValue=""><option value="" disabled>{tr('Customer…', '选择客户……')}</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <input name="title" required placeholder={tr('Deal name', '商机名称')} aria-label={tr('Deal name', '商机名称')} style={{ flex: 1, minWidth: 180 }} />
          <input name="value" placeholder={tr('Value (USD)', '金额（美元）')} inputMode="decimal" aria-label={tr('Value', '金额')} style={{ width: 130 }} />
          <button className="btn btn-sm btn-primary">{tr('Add', '添加')}</button>
        </form>
      </details>
      <div className="kanban">
        {STAGES.map((st) => {
          const list = opps.filter((o) => o.stage === st);
          return (
            <section className="lane" key={st} aria-label={label(st, l)}>
              <div className="lane-head"><h2>{label(st, l)} <span className="badge">{list.length}</span></h2><span>{compactMoney(list.reduce((s, o) => s + o.value, 0))}</span></div>
              {list.map((o) => (
                <article className="card" key={o.id}>
                  <Link className="title" href={`/HunterLin/accounts/${o.account_id}#deal-${o.id}`}>{o.title}</Link>
                  <span className="acct">{o.account}</span>
                  <div className="row"><span className="val">{money(o.value)}</span><span style={o.expected_close && o.expected_close < today && !['won', 'lost'].includes(o.stage) ? { color: 'var(--bad)', fontWeight: 600 } : undefined}>{fmtDate(o.expected_close, l)}</span></div>
                  <div className="row"><span>{o.owner}{j<string[]>(o.products, []).length ? ` · ${j<string[]>(o.products, [])[0]}` : ''}</span></div>
                  <form action={saveOpportunity}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="back" value={`/HunterLin/pipeline${sp.owner ? `?owner=${sp.owner}` : ''}`} />
                    <AutoSelect name="stage" defaultValue={o.stage} aria-label={tr(`Move ${o.title} to stage`, `移动 ${o.title} 到阶段`)}>{STAGES.map((s) => <option key={s} value={s}>{tr('Move to', '移到')}: {label(s, l)}</option>)}</AutoSelect>
                  </form>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}

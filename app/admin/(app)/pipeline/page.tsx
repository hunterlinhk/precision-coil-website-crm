import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, compactMoney, money, date, STAGES, STAGE_LABEL, STAGE_PROB, salesUsers } from '@/lib/admin';
import { Topbar } from '@/components/admin/ui';
import { AutoSelect } from '@/components/admin/client';
import { saveOpportunity } from '@/app/admin/actions';

export const metadata = { title: 'Pipeline' };

export default async function Pipeline({ searchParams }: { searchParams: Promise<{ owner?: string }> }) {
  const u = await requireUser(can.crm);
  const { owner } = await searchParams;
  const where = [scope(u, 'o.owner_id')];
  if (owner && can.seeAll(u)) where.push(`o.owner_id = ${+owner}`);
  const opps = db().prepare(`SELECT o.*, a.name AS account, us.name AS owner FROM opportunities o JOIN accounts a ON a.id = o.account_id LEFT JOIN users us ON us.id = o.owner_id WHERE ${where.join(' AND ')} ORDER BY o.value DESC`).all() as any[];
  const open = opps.filter((o) => !['won', 'lost'].includes(o.stage));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <Topbar title="Pipeline" sub={`${open.length} open, ${money(open.reduce((s, o) => s + o.value, 0))} total, ${money(open.reduce((s, o) => s + o.value * STAGE_PROB[o.stage], 0))} weighted`}>
        {can.seeAll(u) && (
          <form className="inline-form"><select name="owner" defaultValue={owner || ''} aria-label="Owner"><option value="">Whole team</option>{salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><button className="btn btn-sm">Show</button></form>
        )}
      </Topbar>
      <div className="kanban">
        {STAGES.map((st) => {
          const list = opps.filter((o) => o.stage === st);
          return (
            <section className="lane" key={st} aria-label={STAGE_LABEL[st]}>
              <div className="lane-head"><h2>{STAGE_LABEL[st]} <span className="badge">{list.length}</span></h2><span>{compactMoney(list.reduce((s, o) => s + o.value, 0))}</span></div>
              {list.map((o) => (
                <article className="card" key={o.id}>
                  <Link className="title" href={`/admin/opportunities/${o.id}`}>{o.title}</Link>
                  <span className="acct">{o.account}</span>
                  <div className="row"><span className="val">{money(o.value)}</span><span style={o.expected_close && o.expected_close < today && !['won', 'lost'].includes(o.stage) ? { color: 'var(--bad)', fontWeight: 600 } : undefined}>{date(o.expected_close)}</span></div>
                  <div className="row"><span>{o.owner}{j<string[]>(o.products, []).length ? `, ${j<string[]>(o.products, [])[0]}` : ''}</span></div>
                  <form action={saveOpportunity}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="back" value="/admin/pipeline" />
                    <AutoSelect name="stage" defaultValue={o.stage} aria-label={`Move ${o.title} to stage`}>{STAGES.map((s) => <option key={s} value={s}>Move to: {STAGE_LABEL[s]}</option>)}</AutoSelect>
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

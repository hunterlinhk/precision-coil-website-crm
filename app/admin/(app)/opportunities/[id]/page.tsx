import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { money, date, STAGES, STAGE_LABEL, STAGE_PROB, salesUsers, SAMPLE_STATUS } from '@/lib/admin';
import { Topbar, Panel, Pill } from '@/components/admin/ui';
import { Timeline } from '@/components/admin/Timeline';
import { saveOpportunity, createQuote, createSample, updateSample, addActivity } from '@/app/admin/actions';
import { AutoSelect } from '@/components/admin/client';

export default async function Opportunity({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; converted?: string }> }) {
  const u = await requireUser(can.crm);
  const { id } = await params;
  const sp = await searchParams;
  const o = db().prepare('SELECT o.*, a.name AS account, a.country FROM opportunities o JOIN accounts a ON a.id = o.account_id WHERE o.id = ?').get(+id) as any;
  if (!o) notFound();
  if (!can.seeAll(u) && o.owner_id !== u.id) redirect('/admin?denied=1');
  const quotes = db().prepare('SELECT * FROM quotes WHERE opportunity_id = ? ORDER BY created_at DESC').all(o.id) as any[];
  const samples = db().prepare('SELECT * FROM samples WHERE opportunity_id = ? ORDER BY requested_at DESC').all(o.id) as any[];
  const acts = db().prepare('SELECT ac.*, us.name AS who FROM activities ac LEFT JOIN users us ON us.id = ac.user_id WHERE ac.opportunity_id = ? ORDER BY ac.created_at DESC').all(o.id) as any[];
  const models = (db().prepare(`SELECT model FROM products ORDER BY model`).all() as any[]).map((r) => r.model);
  const back = `/admin/opportunities/${o.id}`;
  return (
    <>
      <Topbar crumbs={[['Pipeline', '/admin/pipeline'], [o.account, `/admin/accounts/${o.account_id}`], [o.title]]} title={<>{o.title} <Pill v={o.stage} label={STAGE_LABEL[o.stage]} /></>} sub={<><Link href={`/admin/accounts/${o.account_id}`}>{o.account}</Link>, {money(o.value)} a year, weighted {money(o.value * STAGE_PROB[o.stage])}</>}>
        <form action={createQuote}><input type="hidden" name="opportunity_id" value={o.id} /><button className="btn btn-primary">New quote</button></form>
      </Topbar>
      {sp.converted && <p className="notice">Inquiry converted. Customer, contact and opportunity are set up; add a value and a quote when you have them.</p>}
      {sp.saved && <p className="notice">Saved.</p>}
      <div className="grid g-main">
        <div className="stack">
          <Panel title="Details">
            <form action={saveOpportunity} className="form">
              <input type="hidden" name="id" value={o.id} />
              <div className="fgrid">
                <div className="f full"><label htmlFor="title">Name</label><input id="title" name="title" defaultValue={o.title} /></div>
                <div className="f"><label htmlFor="stage">Stage</label><select id="stage" name="stage" defaultValue={o.stage}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select></div>
                <div className="f"><label htmlFor="value">Annual value (USD)</label><input id="value" name="value" defaultValue={o.value} inputMode="decimal" /></div>
                <div className="f"><label htmlFor="expected_close">Expected decision</label><input id="expected_close" name="expected_close" type="date" defaultValue={o.expected_close || ''} /></div>
                {can.assign(u) && <div className="f"><label htmlFor="owner_id">Owner</label><select id="owner_id" name="owner_id" defaultValue={o.owner_id || ''}>{salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>}
                <div className="f full"><label htmlFor="lost_reason">Lost reason (if lost)</label><input id="lost_reason" name="lost_reason" defaultValue={o.lost_reason || ''} placeholder="Price, lead time, spec, went with incumbent…" /></div>
              </div>
              <p className="muted" style={{ fontSize: '0.85rem' }}>Parts: {j<string[]>(o.products, []).join(', ') || 'not specified'}</p>
              <div><button className="btn btn-primary">Save</button></div>
            </form>
          </Panel>
          <Panel title="Activity">
            <form action={addActivity} className="form" style={{ marginBottom: 8 }}>
              <input type="hidden" name="account_id" value={o.account_id} /><input type="hidden" name="opportunity_id" value={o.id} /><input type="hidden" name="back" value={back} />
              <div className="fgrid">
                <div className="f full"><label htmlFor="body">Note</label><textarea id="body" name="body" /></div>
                <div className="f"><label htmlFor="kind">Type</label><select id="kind" name="kind"><option value="note">Note</option><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option></select></div>
                <div className="f"><label htmlFor="follow_up">Follow up on</label><input id="follow_up" name="follow_up" type="date" /></div>
              </div>
              <div><button className="btn">Save</button></div>
            </form>
            <Timeline items={acts} />
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Quotes" flush>
            {quotes.length === 0 ? <p className="empty">No quotes yet. Use “New quote” to draft one from this opportunity&apos;s parts.</p> : (
              <table className="t"><tbody>{quotes.map((q) => <tr key={q.id}><td><Link className="row-link" href={`/admin/quotes/${q.id}`}>{q.number}</Link><span className="sub">valid until {date(q.valid_until)}</span></td><td><Pill v={q.status} /></td><td className="r">{money(q.total)}</td></tr>)}</tbody></table>
            )}
          </Panel>
          <Panel title="Samples" flush>
            <table className="t"><tbody>
              {samples.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.model}</strong><span className="sub">{s.qty} pcs, requested {date(s.requested_at)}{s.tracking ? `, ${s.courier} ${s.tracking}` : ''}</span></td>
                  <td className="r">
                    <form action={updateSample}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="back" value={back} />
                      <AutoSelect name="status" defaultValue={s.status} aria-label={`Status of ${s.model} sample`} className="btn btn-sm">{SAMPLE_STATUS.map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}</AutoSelect>
                    </form>
                  </td>
                </tr>
              ))}
              <tr><td colSpan={2}>
                <form action={createSample} className="inline-form">
                  <input type="hidden" name="opportunity_id" value={o.id} />
                  <select name="model" aria-label="Model" defaultValue={j<string[]>(o.products, [])[0] || ''}>{models.map((m) => <option key={m}>{m}</option>)}</select>
                  <input name="qty" defaultValue="20" aria-label="Quantity" style={{ width: 70 }} />
                  <button className="btn btn-sm">Log sample request</button>
                </form>
              </td></tr>
            </tbody></table>
          </Panel>
        </div>
      </div>
    </>
  );
}

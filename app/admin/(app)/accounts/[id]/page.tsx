import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { money, date, ago, countryName, STAGE_LABEL, INQ_TYPE } from '@/lib/admin';
import { inquiryRef } from '@/lib/crm';
import { Topbar, Panel, Pill } from '@/components/admin/ui';
import { Timeline } from '@/components/admin/Timeline';
import { AccountForm } from '@/components/admin/AccountForm';
import { ConfirmButton } from '@/components/admin/client';
import { addActivity, addContact, deleteContact, saveOpportunity, toggleTask } from '@/app/admin/actions';

export default async function Account({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; edit?: string }> }) {
  const u = await requireUser(can.crm);
  const { id } = await params;
  const sp = await searchParams;
  const a = db().prepare('SELECT a.*, us.name AS owner FROM accounts a LEFT JOIN users us ON us.id = a.owner_id WHERE a.id = ?').get(+id) as any;
  if (!a) notFound();
  if (!can.seeAll(u) && a.owner_id !== u.id) redirect('/admin?denied=1');
  const contacts = db().prepare('SELECT * FROM contacts WHERE account_id = ? ORDER BY id').all(a.id) as any[];
  const opps = db().prepare('SELECT * FROM opportunities WHERE account_id = ? ORDER BY updated_at DESC').all(a.id) as any[];
  const quotes = db().prepare('SELECT * FROM quotes WHERE account_id = ? ORDER BY created_at DESC').all(a.id) as any[];
  const samples = db().prepare('SELECT * FROM samples WHERE account_id = ? ORDER BY requested_at DESC').all(a.id) as any[];
  const inqs = db().prepare('SELECT * FROM inquiries WHERE account_id = ? ORDER BY created_at DESC').all(a.id) as any[];
  const acts = db().prepare('SELECT ac.*, us.name AS who FROM activities ac LEFT JOIN users us ON us.id = ac.user_id WHERE ac.account_id = ? ORDER BY ac.created_at DESC LIMIT 60').all(a.id) as any[];
  const tasks = db().prepare('SELECT * FROM tasks WHERE account_id = ? AND done = 0 ORDER BY due_at').all(a.id) as any[];
  const back = `/admin/accounts/${a.id}`;
  const won = opps.filter((o) => o.stage === 'won').reduce((s, o) => s + o.value, 0);

  return (
    <>
      <Topbar crumbs={[['Customers', '/admin/accounts'], [a.name]]} title={<>{a.name} <Pill v={a.stage} /></>} sub={[a.industry, countryName(a.country), a.owner ? `Owner: ${a.owner}` : 'No owner'].filter(Boolean).join(', ')}>
        <Link href={sp.edit ? back : `${back}?edit=1`} className="btn">{sp.edit ? 'Close editor' : 'Edit details'}</Link>
      </Topbar>
      {sp.saved && <p className="notice">Saved.</p>}
      {sp.edit && <div style={{ marginBottom: 16 }}><Panel title="Customer details"><AccountForm a={a} canAssign={can.assign(u)} /></Panel></div>}
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="panel kpi"><div className="label">Won business</div><div className="value">{money(won)}</div></div>
        <div className="panel kpi"><div className="label">Open opportunities</div><div className="value">{opps.filter((o) => !['won', 'lost'].includes(o.stage)).length}</div></div>
        <div className="panel kpi"><div className="label">Website inquiries</div><div className="value">{inqs.length}</div></div>
        <div className="panel kpi"><div className="label">Annual volume</div><div className="value" style={{ fontSize: '1.3rem' }}>{a.annual_volume || '—'}</div></div>
      </div>
      <div className="grid g-main">
        <div className="stack">
          <Panel title="Opportunities" flush aside={<span className="muted">{opps.length}</span>}>
            <table className="t">
              <thead><tr><th>Opportunity</th><th>Stage</th><th className="r">Value</th><th className="r">Decision</th></tr></thead>
              <tbody>
                {opps.map((o) => <tr key={o.id}><td><Link className="row-link" href={`/admin/opportunities/${o.id}`}>{o.title}</Link><span className="sub">{j<string[]>(o.products, []).join(', ')}</span></td><td><Pill v={o.stage} label={STAGE_LABEL[o.stage]} /></td><td className="r">{money(o.value)}</td><td className="r muted">{date(o.expected_close)}</td></tr>)}
                <tr><td colSpan={4}>
                  <form action={saveOpportunity} className="inline-form">
                    <input type="hidden" name="account_id" value={a.id} />
                    <input name="title" placeholder="New opportunity name" aria-label="New opportunity name" style={{ flex: 1, minWidth: 200 }} />
                    <input name="value" placeholder="Value (USD)" aria-label="Value" inputMode="decimal" style={{ width: 130 }} />
                    <button className="btn btn-sm">Add opportunity</button>
                  </form>
                </td></tr>
              </tbody>
            </table>
          </Panel>
          <Panel title="Communication history">
            <form action={addActivity} className="form" style={{ marginBottom: 8 }}>
              <input type="hidden" name="account_id" value={a.id} /><input type="hidden" name="back" value={back} />
              <div className="fgrid">
                <div className="f full"><label htmlFor="body">Log a call, email, meeting or note</label><textarea id="body" name="body" /></div>
                <div className="f"><label htmlFor="kind">Type</label><select id="kind" name="kind"><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option><option value="note">Note</option></select></div>
                <div className="f"><label htmlFor="follow_up">Set a follow-up for</label><input id="follow_up" name="follow_up" type="date" /></div>
              </div>
              <div><button className="btn">Save</button></div>
            </form>
            <Timeline items={acts} />
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Follow-ups" flush>
            {tasks.length === 0 ? <p className="empty">No open follow-ups.</p> : <ul>{tasks.map((t) => (
              <li key={t.id} style={{ display: 'flex', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--rule)' }}>
                <form action={toggleTask}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="back" value={back} /><button className="btn btn-sm" aria-label="Mark done">✓</button></form>
                <div><div style={{ fontWeight: 560 }}>{t.title}</div><div className="muted" style={{ fontSize: '0.82rem' }}>{date(t.due_at)}</div></div>
              </li>))}</ul>}
          </Panel>
          <Panel title="Contacts" flush>
            <ul>
              {contacts.map((c) => (
                <li key={c.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div><strong>{c.name}</strong><div className="muted" style={{ fontSize: '0.85rem' }}>{c.title}</div><div style={{ fontSize: '0.88rem' }}>{c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}{c.phone && <span> {c.phone}</span>}{c.messenger && <span className="muted"> {c.messenger}</span>}</div></div>
                  <form action={deleteContact}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="account_id" value={a.id} /><ConfirmButton className="btn btn-ghost btn-sm" message={`Remove ${c.name}?`}>Remove</ConfirmButton></form>
                </li>
              ))}
            </ul>
            <form action={addContact} className="form" style={{ padding: 16 }}>
              <input type="hidden" name="account_id" value={a.id} />
              <div className="fgrid">
                <div className="f"><label htmlFor="c-name">Name</label><input id="c-name" name="name" /></div>
                <div className="f"><label htmlFor="c-title">Title</label><input id="c-title" name="title" /></div>
                <div className="f"><label htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" /></div>
                <div className="f"><label htmlFor="c-phone">Phone</label><input id="c-phone" name="phone" /></div>
                <div className="f full"><label htmlFor="c-m">WeChat / WhatsApp</label><input id="c-m" name="messenger" /></div>
              </div>
              <div><button className="btn btn-sm">Add contact</button></div>
            </form>
          </Panel>
          <Panel title="Quotes" flush>
            {quotes.length === 0 ? <p className="empty">No quotes yet.</p> : <table className="t"><tbody>{quotes.map((q) => <tr key={q.id}><td><Link className="row-link" href={`/admin/quotes/${q.id}`}>{q.number}</Link><span className="sub">{date(q.created_at)}</span></td><td><Pill v={q.status} /></td><td className="r">{money(q.total)}</td></tr>)}</tbody></table>}
          </Panel>
          <Panel title="Samples" flush>
            {samples.length === 0 ? <p className="empty">No samples yet.</p> : <table className="t"><tbody>{samples.map((s) => <tr key={s.id}><td><strong>{s.model}</strong><span className="sub">{s.qty} pcs, {date(s.requested_at)}</span></td><td><Pill v={s.status} /></td></tr>)}</tbody></table>}
          </Panel>
          <Panel title="Website inquiries" flush>
            {inqs.length === 0 ? <p className="empty">None linked.</p> : <table className="t"><tbody>{inqs.map((i) => <tr key={i.id}><td><Link className="row-link" href={`/admin/inquiries/${i.id}`}>{inquiryRef(i.id)}</Link><span className="sub">{INQ_TYPE[i.type]}, {i.source}</span></td><td><Pill v={i.status} /></td><td className="r muted">{ago(i.created_at)}</td></tr>)}</tbody></table>}
          </Panel>
        </div>
      </div>
    </>
  );
}

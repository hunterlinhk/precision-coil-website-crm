import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { dateTime, ago, hoursBetween, INQ_STATUS, INQ_TYPE, salesUsers, countryName } from '@/lib/admin';
import { inquiryRef } from '@/lib/crm';
import { Topbar, Panel, Pill } from '@/components/admin/ui';
import { AutoSelect } from '@/components/admin/client';
import { updateInquiry, markResponded, convertInquiry, addActivity } from '../../../actions';
import { Timeline } from '@/components/admin/Timeline';

export default async function Inquiry({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(can.crm);
  const { id } = await params;
  const q = db().prepare('SELECT i.*, us.name AS owner FROM inquiries i LEFT JOIN users us ON us.id = i.owner_id WHERE i.id = ?').get(+id) as any;
  if (!q) notFound();
  if (!can.seeAll(u) && q.owner_id && q.owner_id !== u.id) redirect('/admin?denied=1');
  const items = j<any[]>(q.items, []);
  const files = j<any[]>(q.files, []);
  const account = q.account_id ? (db().prepare('SELECT * FROM accounts WHERE id = ?').get(q.account_id) as any) : null;
  const history = db().prepare(`SELECT COUNT(*) c FROM inquiries WHERE lower(email) = lower(?) AND id != ?`).get(q.email, q.id) as any;
  const acts = db().prepare('SELECT ac.*, us.name AS who FROM activities ac LEFT JOIN users us ON us.id = ac.user_id WHERE ac.inquiry_id = ? ORDER BY ac.created_at DESC').all(q.id) as any[];
  const respH = q.first_response_at ? hoursBetween(q.created_at, q.first_response_at) : null;
  const back = `/admin/inquiries/${q.id}`;

  return (
    <>
      <Topbar crumbs={[['Inquiries', '/admin/inquiries'], [inquiryRef(q.id)]]} title={<>{q.company} <Pill v={q.status} /></>} sub={`${INQ_TYPE[q.type]} from ${q.name}, received ${dateTime(q.created_at)} (${ago(q.created_at)})`}>
        <a className="btn" href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: your ${INQ_TYPE[q.type].toLowerCase()} request ${inquiryRef(q.id)}`)}`}>Reply by email</a>
        {q.opportunity_id ? <Link className="btn btn-primary" href={`/admin/opportunities/${q.opportunity_id}`}>Open opportunity</Link> : null}
      </Topbar>
      <div className="grid g-main">
        <div className="stack">
          <Panel title="Request">
            <div className="message">{q.message}</div>
            {items.length > 0 && (
              <table className="t" style={{ marginTop: 14 }}>
                <thead><tr><th>Part from quote list</th><th className="r">Quantity</th></tr></thead>
                <tbody>{items.map((i, k) => <tr key={k}><td><strong>{i.model}</strong></td><td className="r">{i.qty ? (Number.isFinite(+i.qty) ? (+i.qty).toLocaleString('en') : i.qty) : '—'}</td></tr>)}</tbody>
              </table>
            )}
            <dl className="dl" style={{ marginTop: 14 }}>
              <dt>Annual volume</dt><dd>{q.annual_volume || '—'}</dd>
              <dt>Target date</dt><dd>{q.target_date || '—'}</dd>
              <dt>Files</dt><dd>{files.length ? files.map((f) => f.id ? <a key={f.id} href={`/api/files/${f.id}?name=${encodeURIComponent(f.name)}`} style={{ display: 'block' }}>{f.name}</a> : <span key={f.name} style={{ display: 'block' }}>{f.name}</span>) : '—'}</dd>
              <dt>Confidential</dt><dd>{q.nda ? 'Yes, send NDA before opening files' : 'No'}</dd>
            </dl>
          </Panel>
          {!['converted', 'spam'].includes(q.status) && (
            <Panel title="Convert to an opportunity">
              <form action={convertInquiry} className="form">
                <input type="hidden" name="id" value={q.id} />
                <div className="fgrid">
                  <div className="f full"><label htmlFor="title">Opportunity name</label><input id="title" name="title" defaultValue={`${items.map((i) => i.model).join(', ') || 'Custom coil'} for ${q.company}`} /></div>
                  <div className="f"><label htmlFor="value">Estimated annual value (USD)</label><input id="value" name="value" inputMode="decimal" placeholder="e.g. 120000" /></div>
                  <div className="f"><label htmlFor="expected_close">Expected decision</label><input id="expected_close" name="expected_close" type="date" /></div>
                </div>
                <p className="muted" style={{ fontSize: '0.85rem' }}>{account ? `Will be added to the existing customer ${account.name}.` : `Creates a new customer "${q.company}" with ${q.name} as contact.`}{q.type === 'sample' ? ' A sample request is logged too.' : ''}</p>
                <div><button className="btn btn-primary">Convert</button></div>
              </form>
            </Panel>
          )}
          <Panel title="History">
            <form action={addActivity} className="form" style={{ marginBottom: 8 }}>
              <input type="hidden" name="inquiry_id" value={q.id} /><input type="hidden" name="account_id" value={q.account_id || ''} /><input type="hidden" name="back" value={back} />
              <div className="fgrid">
                <div className="f full"><label htmlFor="body">Add a note</label><textarea id="body" name="body" placeholder="Call notes, what the buyer needs, next step…" /></div>
                <div className="f"><label htmlFor="kind">Type</label><select id="kind" name="kind"><option value="note">Note</option><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option></select></div>
                <div className="f"><label htmlFor="follow_up">Remind me on</label><input id="follow_up" name="follow_up" type="date" /></div>
              </div>
              <div><button className="btn">Save note</button></div>
            </form>
            <Timeline items={acts} />
          </Panel>
        </div>
        <div className="stack">
          <Panel title="Handling">
            <div className="form">
              <form action={updateInquiry} className="f">
                <input type="hidden" name="id" value={q.id} />
                <label htmlFor="status">Status</label>
                <AutoSelect id="status" name="status" defaultValue={q.status}>{INQ_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</AutoSelect>
              </form>
              {can.assign(u) ? (
                <form action={updateInquiry} className="f">
                  <input type="hidden" name="id" value={q.id} />
                  <label htmlFor="owner_id">Owner</label>
                  <AutoSelect id="owner_id" name="owner_id" defaultValue={q.owner_id || ''}><option value="">Unassigned</option>{salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</AutoSelect>
                </form>
              ) : (
                <div className="f"><span className="lbl">Owner</span>{q.owner || 'Unassigned'}{!q.owner_id && <form action={updateInquiry} style={{ display: 'inline', marginLeft: 8 }}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="claim" value="1" /><button className="btn btn-sm">Take it</button></form>}</div>
              )}
              <div className="f">
                <span className="lbl">First response</span>
                {q.first_response_at ? <span>{dateTime(q.first_response_at)} <span className="muted">({respH! < 1 ? 'under 1 h' : `${respH!.toFixed(1)} h`})</span></span> : (
                  <form action={markResponded} className="inline-form"><input type="hidden" name="id" value={q.id} /><button className="btn btn-copper btn-sm">Mark as replied</button><span className="muted" style={{ fontSize: '0.82rem' }}>Waiting {ago(q.created_at).replace(' ago', '')}</span></form>
                )}
              </div>
            </div>
          </Panel>
          <Panel title="Contact">
            <dl className="dl">
              <dt>Name</dt><dd>{q.name}{q.role ? `, ${q.role}` : ''}</dd>
              <dt>Email</dt><dd><a href={`mailto:${q.email}`}>{q.email}</a></dd>
              <dt>Phone</dt><dd>{q.phone || '—'}</dd>
              <dt>Company</dt><dd>{account ? <Link href={`/admin/accounts/${account.id}`}>{account.name}</Link> : q.company}{account && <span className="muted"> (existing customer)</span>}</dd>
              <dt>Country</dt><dd>{countryName(q.country)}</dd>
              <dt>Language</dt><dd>{q.locale === 'zh' ? 'Chinese site' : 'English site'}</dd>
              <dt>Earlier inquiries</dt><dd>{history.c}</dd>
            </dl>
          </Panel>
          <Panel title="How they found us">
            <dl className="dl">
              <dt>Channel</dt><dd><strong>{q.source}</strong></dd>
              <dt>Referrer</dt><dd>{q.referrer || '—'}</dd>
              <dt>First page</dt><dd>{q.landing || '—'}</dd>
              <dt>Campaign</dt><dd>{q.utm || '—'}</dd>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

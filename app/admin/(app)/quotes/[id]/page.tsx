import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { date, QUOTE_STATUS } from '@/lib/admin';
import { site } from '@/lib/site';
import { Topbar, Pill } from '@/components/admin/ui';
import { QuoteLines, PrintBtn } from '@/components/admin/QuoteLines';
import { saveQuote } from '@/app/admin/actions';

export default async function Quote({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const u = await requireUser(can.crm);
  const { id } = await params;
  const { saved } = await searchParams;
  const q = db().prepare('SELECT q.*, a.name AS account, a.country, o.title AS opp FROM quotes q JOIN accounts a ON a.id = q.account_id LEFT JOIN opportunities o ON o.id = q.opportunity_id WHERE q.id = ?').get(+id) as any;
  if (!q) notFound();
  if (!can.seeAll(u) && q.owner_id !== u.id) redirect('/admin?denied=1');
  const contact = db().prepare('SELECT * FROM contacts WHERE account_id = ? ORDER BY id LIMIT 1').get(q.account_id) as any;
  const owner = db().prepare('SELECT name, email FROM users WHERE id = ?').get(q.owner_id) as any;
  const models = (db().prepare('SELECT model FROM products ORDER BY model').all() as any[]).map((r) => r.model);
  const locked = q.status === 'accepted' || q.status === 'rejected';
  return (
    <>
      <Topbar crumbs={[['Quotes', '/admin/quotes'], [q.number]]} title={<>{q.number} <Pill v={q.status} /></>} sub={<><Link href={`/admin/accounts/${q.account_id}`}>{q.account}</Link>{q.opp ? <>, <Link href={`/admin/opportunities/${q.opportunity_id}`}>{q.opp}</Link></> : null}</>}>
        <PrintBtn />
      </Topbar>
      {saved && <p className="notice no-print">Quote saved.</p>}
      <form action={saveQuote} className="quote-doc form">
        <input type="hidden" name="id" value={q.id} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontStretch: '120%' }}>{site.brand}</div>
            <div className="muted">{site.legalName}<br />{site.address.en}<br />{owner?.email || site.email}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 650 }}>Quotation {q.number}</div>
            <div className="muted">Issued {date(q.created_at)}</div>
            <div>For: <strong>{q.account}</strong>{contact ? <><br />Attn. {contact.name}</> : null}</div>
          </div>
        </div>
        <QuoteLines initial={j(q.items, [])} models={models} currency={q.currency} readOnly={locked} />
        <div className="fgrid no-print">
          <div className="f"><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={q.status}>{QUOTE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="f"><label htmlFor="valid_until">Valid until</label><input id="valid_until" name="valid_until" type="date" defaultValue={q.valid_until || ''} /></div>
          <div className="f"><label htmlFor="incoterm">Incoterm</label><input id="incoterm" name="incoterm" defaultValue={q.incoterm} /></div>
          <div className="f"><label htmlFor="currency">Currency</label><select id="currency" name="currency" defaultValue={q.currency}><option>USD</option><option>EUR</option><option>CNY</option><option>JPY</option></select></div>
        </div>
        <p className="muted" style={{ fontSize: '0.85rem' }}>Terms: {q.incoterm}, prices valid until {date(q.valid_until)}. Lead time 4–6 weeks after PO for standard parts. Prepared by {owner?.name}.</p>
        <div className="no-print"><button className="btn btn-primary">Save quote</button></div>
      </form>
    </>
  );
}

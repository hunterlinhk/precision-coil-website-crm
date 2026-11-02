import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { date, QUOTE_STATUS } from '@/lib/admin';
import { translator, label } from '@/lib/admin-lang';
import { site } from '@/lib/site';
import { Topbar, Pill } from '@/components/admin/ui';
import { QuoteLines, PrintBtn } from '@/components/admin/QuoteLines';
import { saveQuote } from '@/app/HunterLin/actions';

export default async function Quote({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const u = await requireUser(can.crm);
  const { id } = await params;
  const { saved } = await searchParams;
  const { l, tr } = await translator();
  const q = db().prepare('SELECT q.*, a.name AS account, a.country, o.title AS opp FROM quotes q JOIN accounts a ON a.id = q.account_id LEFT JOIN opportunities o ON o.id = q.opportunity_id WHERE q.id = ?').get(+id) as any;
  if (!q) notFound();
  if (!can.seeAll(u) && q.owner_id !== u.id) redirect('/HunterLin?denied=1');
  const contact = db().prepare('SELECT * FROM contacts WHERE account_id = ? ORDER BY id LIMIT 1').get(q.account_id) as any;
  const owner = db().prepare('SELECT name, email FROM users WHERE id = ?').get(q.owner_id) as any;
  const models = (db().prepare('SELECT model FROM products ORDER BY model').all() as any[]).map((r) => r.model);
  const locked = q.status === 'accepted' || q.status === 'rejected';
  return (
    <>
      <Topbar crumbs={[[tr('Customers', '客户'), '/HunterLin/accounts'], [q.account, `/HunterLin/accounts/${q.account_id}`], [q.number]]} title={<>{q.number} <Pill v={q.status} label={label(q.status, l)} /></>} sub={<><Link href={`/HunterLin/accounts/${q.account_id}`}>{q.account}</Link>{q.opp ? <> · <Link href={`/HunterLin/accounts/${q.account_id}#deal-${q.opportunity_id}`}>{q.opp}</Link></> : null}{l === 'zh' ? ' · 报价单正文为英文，可直接打印或另存为 PDF 发给客户。' : ''}</>}>
        <PrintBtn label={tr('Print or save PDF', '打印 / 保存 PDF')} />
      </Topbar>
      {saved && <p className="notice no-print">{tr('Quote saved.', '报价已保存。')}</p>}
      <form action={saveQuote} className="quote-doc form">
        <input type="hidden" name="id" value={q.id} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 500 }}>{site.brand}</div>
            <div className="muted">{site.legalName}<br />{site.address.en}<br />{owner?.email || site.email}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 650 }}>Quotation {q.number}</div>
            <div className="muted">Issued {date(q.created_at)}</div>
            <div>For: <strong>{q.account}</strong>{contact ? <><br />Attn. {contact.name}</> : null}</div>
          </div>
        </div>
        <QuoteLines initial={j(q.items, [])} models={models} currency={q.currency} readOnly={locked} addLabel={tr('Add line', '添加一行')} />
        <div className="fgrid no-print">
          <div className="f"><label htmlFor="status">{tr('Status', '状态')}</label><select id="status" name="status" defaultValue={q.status}>{QUOTE_STATUS.map((s) => <option key={s} value={s}>{label(s, l)}</option>)}</select></div>
          <div className="f"><label htmlFor="valid_until">{tr('Valid until', '有效期至')}</label><input id="valid_until" name="valid_until" type="date" defaultValue={q.valid_until || ''} /></div>
          <div className="f"><label htmlFor="incoterm">{tr('Incoterm', '贸易条款')}</label><input id="incoterm" name="incoterm" defaultValue={q.incoterm} /></div>
          <div className="f"><label htmlFor="currency">{tr('Currency', '币种')}</label><select id="currency" name="currency" defaultValue={q.currency}><option>USD</option><option>EUR</option><option>CNY</option><option>JPY</option></select></div>
        </div>
        <p className="muted" style={{ fontSize: '0.85rem' }}>Terms: {q.incoterm}, prices valid until {date(q.valid_until)}. Lead time confirmed with the order. Prepared by {owner?.name}.</p>
        <div className="no-print"><button className="btn btn-primary">{tr('Save quote', '保存报价')}</button></div>
      </form>
    </>
  );
}

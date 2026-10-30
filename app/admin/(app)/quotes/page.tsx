import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, money, date, QUOTE_STATUS } from '@/lib/admin';
import { Topbar, Pill } from '@/components/admin/ui';

export const metadata = { title: 'Quotes' };

export default async function Quotes({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const u = await requireUser(can.crm);
  const { status } = await searchParams;
  const rows = db().prepare(`SELECT q.*, a.name AS account, o.title AS opp, us.name AS owner FROM quotes q JOIN accounts a ON a.id = q.account_id LEFT JOIN opportunities o ON o.id = q.opportunity_id LEFT JOIN users us ON us.id = q.owner_id
    WHERE ${scope(u, 'q.owner_id')} ${status && QUOTE_STATUS.includes(status) ? `AND q.status = '${status}'` : ''} ORDER BY q.created_at DESC`).all() as any[];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <Topbar title="Quotes" sub="Draft a quote from any opportunity. Sending it moves the opportunity to Quoted." />
      <nav className="seg filters" aria-label="Status" style={{ display: 'inline-flex' }}>
        <Link href="/admin/quotes" aria-current={!status ? 'true' : undefined}>All</Link>
        {QUOTE_STATUS.map((s) => <Link key={s} href={`/admin/quotes?status=${s}`} aria-current={status === s ? 'true' : undefined}>{s[0].toUpperCase() + s.slice(1)}</Link>)}
      </nav>
      <div className="panel"><div className="table-wrap"><table className="t">
        <thead><tr><th>Number</th><th>Customer</th><th>Opportunity</th><th>Owner</th><th>Status</th><th className="r">Total</th><th className="r">Valid until</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={7} className="empty">No quotes.</td></tr>}
          {rows.map((q) => (
            <tr key={q.id}>
              <td><Link className="row-link" href={`/admin/quotes/${q.id}`}>{q.number}</Link><span className="sub">{date(q.created_at)}</span></td>
              <td><Link href={`/admin/accounts/${q.account_id}`}>{q.account}</Link></td>
              <td>{q.opp || '—'}</td><td>{q.owner}</td><td><Pill v={q.status} /></td>
              <td className="r">{money(q.total, q.currency)}</td>
              <td className="r" style={q.status === 'sent' && q.valid_until < today ? { color: 'var(--bad)' } : undefined}>{date(q.valid_until)}</td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}

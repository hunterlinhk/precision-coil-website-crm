import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, date, ago, SAMPLE_STATUS } from '@/lib/admin';
import { Topbar, Pill } from '@/components/admin/ui';
import { updateSample } from '@/app/HunterLin/actions';

export const metadata = { title: 'Samples' };

export default async function Samples({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const u = await requireUser(can.crm);
  const { status } = await searchParams;
  const rows = db().prepare(`SELECT s.*, a.name AS account, o.title AS opp FROM samples s JOIN accounts a ON a.id = s.account_id LEFT JOIN opportunities o ON o.id = s.opportunity_id
    WHERE ${scope(u, 's.owner_id')} ${status && SAMPLE_STATUS.includes(status) ? `AND s.status = '${status}'` : ''} ORDER BY CASE s.status WHEN 'requested' THEN 0 WHEN 'in_production' THEN 1 WHEN 'shipped' THEN 2 ELSE 3 END, s.requested_at DESC`).all() as any[];
  return (
    <>
      <Topbar title="Samples" sub="From request to customer feedback. Shipping a sample records the date; feedback closes the loop." />
      <nav className="seg filters" aria-label="Status" style={{ display: 'inline-flex' }}>
        <Link href="/HunterLin/samples" aria-current={!status ? 'true' : undefined}>All</Link>
        {SAMPLE_STATUS.map((s) => <Link key={s} href={`/HunterLin/samples?status=${s}`} aria-current={status === s ? 'true' : undefined}>{s.replace('_', ' ')}</Link>)}
      </nav>
      <div className="panel"><div className="table-wrap"><table className="t">
        <thead><tr><th>Part</th><th>Customer</th><th>Status</th><th>Update</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="empty">No samples.</td></tr>}
          {rows.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.model}</strong><span className="sub">{s.qty} pcs, requested {date(s.requested_at)} ({ago(s.requested_at)})</span></td>
              <td><Link href={`/HunterLin/accounts/${s.account_id}`}>{s.account}</Link>{s.opp && <span className="sub"><Link href={`/HunterLin/opportunities/${s.opportunity_id}`}>{s.opp}</Link></span>}</td>
              <td><Pill v={s.status} />{s.shipped_at && <span className="sub">shipped {date(s.shipped_at)}</span>}</td>
              <td>
                <form action={updateSample} className="inline-form">
                  <input type="hidden" name="id" value={s.id} />
                  <select name="status" defaultValue={s.status} aria-label="Status">{SAMPLE_STATUS.map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}</select>
                  <input name="courier" defaultValue={s.courier || ''} placeholder="Courier" aria-label="Courier" style={{ width: 90 }} />
                  <input name="tracking" defaultValue={s.tracking || ''} placeholder="Tracking no." aria-label="Tracking number" style={{ width: 130 }} />
                  <input name="feedback" defaultValue={s.feedback || ''} placeholder="Customer feedback" aria-label="Feedback" style={{ width: 200 }} />
                  <button className="btn btn-sm">Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </>
  );
}

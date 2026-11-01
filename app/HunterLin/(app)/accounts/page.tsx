import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, compactMoney, ago, countryName, STAGE_PROB } from '@/lib/admin';
import { Topbar, Pill } from '@/components/admin/ui';

export const metadata = { title: 'Customers' };

export default async function Accounts({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  const u = await requireUser(can.crm);
  const sp = await searchParams;
  const where = [scope(u, 'a.owner_id')];
  const args: any[] = [];
  if (sp.q) { where.push('(a.name LIKE ? OR a.domain LIKE ? OR a.industry LIKE ?)'); args.push(`%${sp.q}%`, `%${sp.q}%`, `%${sp.q}%`); }
  if (sp.stage) { where.push('a.stage = ?'); args.push(sp.stage); }
  const rows = db().prepare(`SELECT a.*, us.name AS owner,
    (SELECT COUNT(*) FROM inquiries i WHERE i.account_id = a.id) AS inq,
    (SELECT MAX(created_at) FROM activities ac WHERE ac.account_id = a.id) AS last_touch
    FROM accounts a LEFT JOIN users us ON us.id = a.owner_id WHERE ${where.join(' AND ')} ORDER BY last_touch DESC NULLS LAST, a.name`).all(...args) as any[];
  const opps = db().prepare(`SELECT account_id, stage, value FROM opportunities`).all() as any[];
  const pipe = (id: number) => opps.filter((o) => o.account_id === id && !['won', 'lost'].includes(o.stage)).reduce((s, o) => s + o.value * STAGE_PROB[o.stage], 0);
  return (
    <>
      <Topbar title="Customers" sub={`${rows.length} companies${can.seeAll(u) ? '' : ' you own'}`}>
        <Link href="/HunterLin/accounts/new" className="btn btn-primary">Add customer</Link>
      </Topbar>
      <form className="filters">
        <input type="search" name="q" placeholder="Search name, domain or industry" defaultValue={sp.q} aria-label="Search customers" />
        <select name="stage" defaultValue={sp.stage || ''} aria-label="Relationship"><option value="">All relationships</option><option value="customer">Customers</option><option value="prospect">Prospects</option><option value="partner">Partners</option></select>
        <button className="btn">Apply</button>
      </form>
      <div className="panel"><div className="table-wrap">
        <table className="t">
          <thead><tr><th>Company</th><th>Country</th><th>Relationship</th><th>Channel</th><th>Owner</th><th className="r">Inquiries</th><th className="r">Open pipeline</th><th className="r">Last activity</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="empty">No customers match.</td></tr>}
            {rows.map((a) => (
              <tr key={a.id}>
                <td><Link className="row-link" href={`/HunterLin/accounts/${a.id}`}>{a.name}</Link><span className="sub">{a.industry}</span></td>
                <td>{countryName(a.country)}</td>
                <td><Pill v={a.stage} /></td>
                <td>{a.source || '—'}</td>
                <td>{a.owner || <span className="muted">—</span>}</td>
                <td className="r">{a.inq}</td>
                <td className="r">{pipe(a.id) ? compactMoney(pipe(a.id)) : <span className="muted">—</span>}</td>
                <td className="r muted">{ago(a.last_touch)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </>
  );
}

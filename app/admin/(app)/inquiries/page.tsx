import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, ago, INQ_STATUS, INQ_TYPE, salesUsers, countryName } from '@/lib/admin';
import { inquiryRef } from '@/lib/crm';
import { Topbar, Pill } from '@/components/admin/ui';

export const metadata = { title: 'Inquiries' };

type SP = { status?: string; type?: string; owner?: string; source?: string; q?: string };

export default async function Inquiries({ searchParams }: { searchParams: Promise<SP> }) {
  const u = await requireUser(can.crm);
  const sp = await searchParams;
  const where = [scope(u, 'i.owner_id', true)];
  const args: any[] = [];
  if (sp.status && INQ_STATUS.includes(sp.status)) { where.push('i.status = ?'); args.push(sp.status); }
  else where.push(`i.status != 'spam'`);
  if (sp.type && INQ_TYPE[sp.type]) { where.push('i.type = ?'); args.push(sp.type); }
  if (sp.owner === 'none') where.push('i.owner_id IS NULL');
  else if (sp.owner === 'me') { where.push('i.owner_id = ?'); args.push(u.id); }
  else if (sp.owner) { where.push('i.owner_id = ?'); args.push(+sp.owner); }
  if (sp.source) { where.push('i.source = ?'); args.push(sp.source); }
  if (sp.q) { where.push('(i.company LIKE ? OR i.name LIKE ? OR i.email LIKE ? OR i.message LIKE ? OR i.items LIKE ?)'); const q = `%${sp.q}%`; args.push(q, q, q, q, q); }
  const rows = db().prepare(`SELECT i.*, us.name AS owner FROM inquiries i LEFT JOIN users us ON us.id = i.owner_id WHERE ${where.join(' AND ')} ORDER BY i.created_at DESC LIMIT 300`).all(...args) as any[];
  const counts = Object.fromEntries((db().prepare(`SELECT status, COUNT(*) c FROM inquiries i WHERE ${scope(u, 'i.owner_id', true)} GROUP BY status`).all() as any[]).map((r) => [r.status, r.c]));
  const sources = (db().prepare('SELECT DISTINCT source FROM inquiries WHERE source IS NOT NULL ORDER BY source').all() as any[]).map((r) => r.source);
  const link = (patch: Partial<SP>) => { const p = new URLSearchParams({ ...sp, ...patch } as any); [...p.keys()].forEach((k) => { if (!p.get(k)) p.delete(k); }); return `/admin/inquiries?${p}`; };

  return (
    <>
      <Topbar title="Inquiries" sub="Every website form submission lands here automatically, with its source, files and an owner by region." />
      <div className="filters">
        <nav className="seg" aria-label="Status">
          <Link href={link({ status: '' })} aria-current={!sp.status ? 'true' : undefined}>All open</Link>
          {INQ_STATUS.map((s) => <Link key={s} href={link({ status: s })} aria-current={sp.status === s ? 'true' : undefined}>{s[0].toUpperCase() + s.slice(1)} <span className="muted">{counts[s] || 0}</span></Link>)}
        </nav>
        <form className="filters" style={{ margin: 0 }}>
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input type="search" name="q" placeholder="Search company, email, part number…" defaultValue={sp.q} aria-label="Search inquiries" />
          <select name="type" defaultValue={sp.type || ''} aria-label="Request type"><option value="">Any request</option>{Object.entries(INQ_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select name="owner" defaultValue={sp.owner || ''} aria-label="Owner"><option value="">Any owner</option><option value="me">Mine</option><option value="none">Unassigned</option>{can.seeAll(u) && salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select name="source" defaultValue={sp.source || ''} aria-label="Source"><option value="">Any source</option>{sources.map((s) => <option key={s}>{s}</option>)}</select>
          <button className="btn">Apply</button>
        </form>
      </div>
      <div className="panel"><div className="table-wrap">
        <table className="t">
          <thead><tr><th>Ref</th><th>Company</th><th>Request</th><th>Parts</th><th>Source</th><th>Owner</th><th>Status</th><th className="r">Received</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="empty">No inquiries match these filters.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className={r.status === 'new' ? 'unread' : ''}>
                <td><Link className="row-link" href={`/admin/inquiries/${r.id}`}>{inquiryRef(r.id)}</Link></td>
                <td><strong>{r.company}</strong><span className="sub">{r.name}, {countryName(r.country)}</span></td>
                <td>{INQ_TYPE[r.type]}{j<any[]>(r.files, []).length > 0 && <span className="sub">{j<any[]>(r.files, []).length} file(s){r.nda ? ', NDA' : ''}</span>}</td>
                <td>{j<any[]>(r.items, []).map((i) => i.model).join(', ') || <span className="muted">—</span>}</td>
                <td>{r.source}</td>
                <td>{r.owner || <span className="muted">Unassigned</span>}</td>
                <td><Pill v={r.status} /></td>
                <td className="r muted">{ago(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </>
  );
}

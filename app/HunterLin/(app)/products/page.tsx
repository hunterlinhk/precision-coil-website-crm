import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { ago } from '@/lib/admin';
import { Topbar, Pill } from '@/components/admin/ui';

export const metadata = { title: 'Products' };

export default async function Products({ searchParams }: { searchParams: Promise<{ cat?: string; status?: string; deleted?: string }> }) {
  await requireUser(can.cms);
  const sp = await searchParams;
  const cats = db().prepare('SELECT * FROM categories ORDER BY sort').all() as any[];
  const where: string[] = ['1=1'];
  const args: any[] = [];
  if (sp.cat) { where.push('c.slug = ?'); args.push(sp.cat); }
  if (sp.status) { where.push('p.status = ?'); args.push(sp.status); }
  const rows = db().prepare(`SELECT p.*, c.name_en AS cat, c.slug AS cat_slug FROM products p JOIN categories c ON c.id = p.category_id WHERE ${where.join(' AND ')} ORDER BY c.sort, p.sort`).all(...args) as any[];
  return (
    <>
      <Topbar title="Products" sub="Catalogue pages in English and Chinese. Drafts stay private until published.">
        <Link href="/HunterLin/products/new" className="btn btn-primary">New product</Link>
      </Topbar>
      {sp.deleted && <p className="notice">Product deleted.</p>}
      <form className="filters">
        <select name="cat" defaultValue={sp.cat || ''} aria-label="Family"><option value="">All families</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name_en}</option>)}</select>
        <select name="status" defaultValue={sp.status || ''} aria-label="Status"><option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option></select>
        <button className="btn">Apply</button>
      </form>
      <div className="panel"><div className="table-wrap"><table className="t">
        <thead><tr><th>Model</th><th>Family</th><th>Translation</th><th>Specs</th><th>Files</th><th>Status</th><th className="r">Updated</th></tr></thead>
        <tbody>
          {rows.map((p) => {
            const zhOk = p.name_zh && p.summary_zh && p.body_zh;
            return (
              <tr key={p.id}>
                <td><Link className="row-link" href={`/HunterLin/products/${p.id}`}>{p.model}</Link><span className="sub">{p.name_en}</span></td>
                <td>{p.cat}</td>
                <td>{zhOk ? <span className="pill plain published">EN + 中文</span> : <span className="pill plain draft">中文 missing</span>}</td>
                <td>{j<any[]>(p.specs, []).length}</td>
                <td>{j<any[]>(p.images, []).length + j<any[]>(p.files, []).length || <span className="muted">—</span>}</td>
                <td><Pill v={p.status} />{p.featured ? <span className="sub">Featured</span> : null}</td>
                <td className="r muted">{ago(p.updated_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
    </>
  );
}

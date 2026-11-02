import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { translator, label, fmtAgo } from '@/lib/admin-lang';
import { Topbar, Pill } from '@/components/admin/ui';

export const metadata = { title: 'Products' };

export default async function Products({ searchParams }: { searchParams: Promise<{ cat?: string; status?: string; deleted?: string }> }) {
  await requireUser(can.cms);
  const { l, tr } = await translator();
  const sp = await searchParams;
  const cats = db().prepare('SELECT * FROM categories ORDER BY sort').all() as any[];
  const where: string[] = ['1=1'];
  const args: any[] = [];
  if (sp.cat) { where.push('c.slug = ?'); args.push(sp.cat); }
  if (sp.status) { where.push('p.status = ?'); args.push(sp.status); }
  const rows = db().prepare(`SELECT p.*, c.name_en AS cat, c.name_zh AS cat_zh, c.slug AS cat_slug FROM products p JOIN categories c ON c.id = p.category_id WHERE ${where.join(' AND ')} ORDER BY c.sort, p.sort`).all(...args) as any[];
  return (
    <>
      <Topbar title={tr('Products', '产品')} sub={tr('Catalogue pages in English and Chinese. Drafts stay private until published.', '中英文产品页面。草稿在发布前不会公开。')}>
        <Link href="/HunterLin/products/new" className="btn btn-primary">{tr('New product', '新建产品')}</Link>
      </Topbar>
      {sp.deleted && <p className="notice">{tr('Product deleted.', '产品已删除。')}</p>}
      <form className="filters">
        <select name="cat" defaultValue={sp.cat || ''} aria-label={tr('Family', '类别')}><option value="">{tr('All families', '全部类别')}</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{l === 'zh' ? c.name_zh || c.name_en : c.name_en}</option>)}</select>
        <select name="status" defaultValue={sp.status || ''} aria-label={tr('Status', '状态')}><option value="">{tr('Any status', '全部状态')}</option><option value="published">{label('published', l)}</option><option value="draft">{label('draft', l)}</option></select>
        <button className="btn">{tr('Apply', '筛选')}</button>
      </form>
      <div className="panel"><div className="table-wrap"><table className="t">
        <thead><tr><th>{tr('Model', '型号')}</th><th>{tr('Family', '类别')}</th><th>{tr('Languages', '语言')}</th><th>{tr('Specs', '参数')}</th><th>{tr('Photos & files', '照片与文件')}</th><th>{tr('Status', '状态')}</th><th className="r">{tr('Updated', '更新')}</th></tr></thead>
        <tbody>
          {rows.map((p) => {
            const zhOk = p.name_zh && p.summary_zh && p.body_zh;
            return (
              <tr key={p.id}>
                <td><Link className="row-link" href={`/HunterLin/products/${p.id}`}>{p.model}</Link><span className="sub">{l === 'zh' ? p.name_zh || p.name_en : p.name_en}</span></td>
                <td>{l === 'zh' ? p.cat_zh || p.cat : p.cat}</td>
                <td>{zhOk ? <span className="pill plain published">EN + 中文</span> : <span className="pill plain draft">{tr('Chinese missing', '缺少中文')}</span>}</td>
                <td>{j<any[]>(p.specs, []).length}</td>
                <td>{j<any[]>(p.images, []).length + j<any[]>(p.files, []).length || <span className="muted">—</span>}</td>
                <td><Pill v={p.status} label={label(p.status, l)} />{p.featured ? <span className="sub">{tr('Featured', '推荐')}</span> : null}</td>
                <td className="r muted">{fmtAgo(p.updated_at, l)}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
    </>
  );
}

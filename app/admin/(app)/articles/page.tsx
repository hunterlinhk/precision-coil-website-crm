import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { ago, date } from '@/lib/admin';
import { Topbar, Pill } from '@/components/admin/ui';

export const metadata = { title: 'News & articles' };
const TYPE: Record<string, string> = { news: 'News', tech: 'Technical note', case: 'Case study' };

export default async function Articles({ searchParams }: { searchParams: Promise<{ type?: string; deleted?: string }> }) {
  await requireUser(can.cms);
  const sp = await searchParams;
  const rows = db().prepare(`SELECT * FROM articles ${sp.type && TYPE[sp.type] ? `WHERE type = '${sp.type}'` : ''} ORDER BY COALESCE(published_at, updated_at) DESC`).all() as any[];
  return (
    <>
      <Topbar title="News & articles" sub="Company news, technical notes and case studies. Technical notes are what search engines and AI assistants cite most.">
        <Link href="/admin/articles/new" className="btn btn-primary">New article</Link>
      </Topbar>
      {sp.deleted && <p className="notice">Article deleted.</p>}
      <nav className="seg filters" aria-label="Type" style={{ display: 'inline-flex' }}>
        <Link href="/admin/articles" aria-current={!sp.type ? 'true' : undefined}>All</Link>
        {Object.entries(TYPE).map(([k, v]) => <Link key={k} href={`/admin/articles?type=${k}`} aria-current={sp.type === k ? 'true' : undefined}>{v}</Link>)}
      </nav>
      <div className="panel"><div className="table-wrap"><table className="t">
        <thead><tr><th>Title</th><th>Type</th><th>Translation</th><th>Status</th><th className="r">Published</th><th className="r">Updated</th></tr></thead>
        <tbody>{rows.map((a) => (
          <tr key={a.id}>
            <td><Link className="row-link" href={`/admin/articles/${a.id}`}>{a.title_en || a.title_zh}</Link><span className="sub">{a.title_zh}</span></td>
            <td>{TYPE[a.type]}</td>
            <td>{a.title_zh && a.body_zh && a.title_en && a.body_en ? <span className="pill plain published">EN + 中文</span> : <span className="pill plain draft">Incomplete</span>}</td>
            <td><Pill v={a.status} /></td>
            <td className="r">{a.status === 'published' ? date(a.published_at) : '—'}</td>
            <td className="r muted">{ago(a.updated_at)}</td>
          </tr>
        ))}</tbody>
      </table></div></div>
    </>
  );
}

import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { translator, label, fmtDate, fmtAgo } from '@/lib/admin-lang';
import { Topbar, Pill } from '@/components/admin/ui';

export const metadata = { title: 'News & articles' };

// What each article still needs before it does its job in search and AI answers.
function articleChecks(a: any) {
  const faq = j<string[][]>(a.faq, []);
  return {
    en: !!(a.title_en && a.body_en && a.excerpt_en),
    zh: !!(a.title_zh && a.body_zh && a.excerpt_zh),
    summary: !!(a.takeaways_en || a.takeaways_zh),
    faq: faq.length > 0,
    seo: !!((a.seo_desc_en || a.excerpt_en) && (a.excerpt_en || '').length <= 200),
    links: j<string[]>(a.products, []).length + j<string[]>(a.applications, []).length > 0,
  };
}

export default async function Articles({ searchParams }: { searchParams: Promise<{ type?: string; status?: string; q?: string; deleted?: string }> }) {
  await requireUser(can.cms);
  const { l, tr } = await translator();
  const sp = await searchParams;
  const where: string[] = ['1=1'];
  const args: any[] = [];
  if (sp.type && ['news', 'tech', 'case'].includes(sp.type)) { where.push('type = ?'); args.push(sp.type); }
  if (sp.status && ['draft', 'published'].includes(sp.status)) { where.push('status = ?'); args.push(sp.status); }
  if (sp.q) { where.push('(title_en LIKE ? OR title_zh LIKE ? OR body_en LIKE ? OR body_zh LIKE ?)'); const q = `%${sp.q}%`; args.push(q, q, q, q); }
  const rows = db().prepare(`SELECT * FROM articles WHERE ${where.join(' AND ')} ORDER BY status = 'draft' DESC, COALESCE(published_at, updated_at) DESC`).all(...args) as any[];
  const counts = db().prepare(`SELECT status, COUNT(*) c FROM articles GROUP BY status`).all() as any[];
  const n = (s: string) => counts.find((c) => c.status === s)?.c || 0;
  const link = (patch: Record<string, string>) => { const p = new URLSearchParams({ ...(sp as any), ...patch }); p.delete('deleted'); [...p.keys()].forEach((k) => { if (!p.get(k)) p.delete(k); }); return `/HunterLin/articles?${p}`; };
  const Dot = ({ ok, t }: { ok: boolean; t: string }) => <span className={`dot ${ok ? 'ok' : 'miss'}`} title={`${t}: ${ok ? '✓' : tr('missing', '缺少')}`}>{t}</span>;
  return (
    <>
      <Topbar title={tr('News & articles', '新闻与文章')} sub={tr('Company news and technical notes. Technical notes answering real buyer questions are what Google and AI assistants cite most.', '公司新闻和技术文章。解答采购常见问题的技术文章，最容易被谷歌和 AI 助手引用。')}>
        <Link href="/HunterLin/articles/new?type=news" className="btn">{tr('Write news', '写新闻')}</Link>
        <Link href="/HunterLin/articles/new?type=tech" className="btn btn-primary">{tr('Write technical note', '写技术文章')}</Link>
      </Topbar>
      {sp.deleted && <p className="notice">{tr('Article deleted.', '文章已删除。')}</p>}
      <div className="filters">
        <nav className="seg" aria-label={tr('Type', '类型')}>
          {[['', tr('All', '全部')], ['tech', label('tech', l)], ['news', label('news', l)], ['case', label('case', l)]].map(([k, v]) => <Link key={k} href={link({ type: k })} aria-current={(sp.type || '') === k ? 'true' : undefined}>{v}</Link>)}
        </nav>
        <nav className="seg" aria-label={tr('Status', '状态')}>
          {[['', tr('Any status', '全部状态')], ['published', `${label('published', l)} ${n('published')}`], ['draft', `${label('draft', l)} ${n('draft')}`]].map(([k, v]) => <Link key={k} href={link({ status: k })} aria-current={(sp.status || '') === k ? 'true' : undefined}>{v}</Link>)}
        </nav>
        <form className="filters" style={{ margin: 0 }}>{sp.type && <input type="hidden" name="type" value={sp.type} />}{sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input type="search" name="q" defaultValue={sp.q} placeholder={tr('Search titles and text', '搜索标题和正文')} aria-label={tr('Search', '搜索')} /><button className="btn">{tr('Search', '搜索')}</button></form>
      </div>
      <div className="panel"><div className="table-wrap"><table className="t">
        <thead><tr><th>{tr('Title', '标题')}</th><th>{tr('Type', '类型')}</th><th>{tr('Ready for search & AI', '搜索与 AI 就绪度')}</th><th>{tr('Status', '状态')}</th><th className="r">{tr('Date', '日期')}</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} className="empty">{tr('No articles match.', '没有符合条件的文章。')}</td></tr>}
          {rows.map((a) => {
            const c = articleChecks(a);
            return (
              <tr key={a.id}>
                <td><Link className="row-link" href={`/HunterLin/articles/${a.id}`}>{(l === 'zh' ? a.title_zh || a.title_en : a.title_en || a.title_zh) || tr('(untitled)', '（无标题）')}</Link><span className="sub">{l === 'zh' ? a.title_en : a.title_zh}</span></td>
                <td>{label(a.type, l)}</td>
                <td><div className="dots"><Dot ok={c.en} t="EN" /><Dot ok={c.zh} t="中文" /><Dot ok={c.summary} t={tr('Summary', '摘要')} /><Dot ok={c.faq} t="FAQ" /><Dot ok={c.links} t={tr('Links', '关联')} /></div></td>
                <td><Pill v={a.status} label={label(a.status, l)} /></td>
                <td className="r">{a.status === 'published' ? fmtDate(a.published_at, l) : <span className="muted">{tr('edited', '编辑于')} {fmtAgo(a.updated_at, l)}</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
    </>
  );
}

import { notFound } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { translator, label, fmtDateTime } from '@/lib/admin-lang';
import { applications } from '@/lib/applications';
import { site } from '@/lib/site';
import { Topbar, Pill } from '@/components/admin/ui';
import { ArticleForm } from '@/components/admin/ArticleForm';
import { saveArticle, deleteArticle, publishArticle, unpublishArticle } from '@/app/HunterLin/actions';

export default async function ArticleEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; type?: string }> }) {
  await requireUser(can.cms);
  const { l, tr } = await translator();
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === 'new';
  const row = isNew ? null : (db().prepare('SELECT * FROM articles WHERE id = ?').get(+id) as any);
  if (!isNew && !row) notFound();
  const a = row
    ? { ...row, faq: j<string[][]>(row.faq, []), products: j<string[]>(row.products, []), applications: j<string[]>(row.applications, []) }
    : { type: ['news', 'tech', 'case'].includes(sp.type || '') ? sp.type : 'tech', author: sp.type === 'news' ? site.brand : `${site.brand} engineering team`, faq: [], products: [], applications: [] };
  const products = (db().prepare('SELECT slug, model, name_en, name_zh FROM products ORDER BY model').all() as any[]).map((p) => ({ value: p.slug, label: `${p.model} · ${l === 'zh' ? p.name_zh || p.name_en : p.name_en}` }));
  const apps = applications.map((x) => ({ value: x.slug, label: l === 'zh' ? x.name_zh : x.name_en }));
  let host = 'example.com';
  try { host = new URL(site.url).host; } catch { /* keep */ }
  const ERR: Record<string, string> = { title: tr('Add an English title (or a web address) before saving.', '保存前请填写英文标题（或网址）。'), slug: tr('Another article already uses that web address.', '其他文章已使用这个网址。') };
  const title = row ? (l === 'zh' ? row.title_zh || row.title_en : row.title_en || row.title_zh) : tr('New article', '新文章');
  return (
    <>
      <Topbar crumbs={[[tr('News & articles', '新闻与文章'), '/HunterLin/articles'], [isNew ? tr('New', '新建') : title]]} title={isNew ? title : <>{title} <Pill v={row.status} label={label(row.status, l)} /></>} sub={row ? `${tr('Last saved', '上次保存')} ${fmtDateTime(row.updated_at, l)}` : undefined}>
        {row && <a className="btn" target="_blank" rel="noreferrer" href={`/en/resources/${row.slug}?preview=1`}>{tr('Preview English ↗', '预览英文版 ↗')}</a>}
        {row && <a className="btn" target="_blank" rel="noreferrer" href={`/zh/resources/${row.slug}?preview=1`}>{tr('Preview Chinese ↗', '预览中文版 ↗')}</a>}
      </Topbar>
      {sp.saved && <p className="notice">{sp.saved === 'publish' ? tr('Published. It is live on the site and in the sitemap.', '已发布，文章已上线并加入网站地图。') : sp.saved === 'unpublish' ? tr('Unpublished.', '已取消发布。') : tr('Draft saved.', '草稿已保存。')}</p>}
      {sp.error && <p className="notice bad">{ERR[sp.error] || tr('Could not save.', '保存失败。')}</p>}
      <ArticleForm a={a} ui={l} products={products} apps={apps} siteHost={host} actions={{ save: saveArticle, publish: publishArticle, unpublish: unpublishArticle, remove: row ? deleteArticle : undefined }} />
    </>
  );
}

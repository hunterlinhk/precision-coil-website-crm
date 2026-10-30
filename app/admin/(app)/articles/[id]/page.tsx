import { notFound } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { dateTime } from '@/lib/admin';
import { applications } from '@/lib/applications';
import { Topbar, Panel, Pill } from '@/components/admin/ui';
import { SeoFields, BodyField } from '@/components/admin/cms';
import { ConfirmButton } from '@/components/admin/client';
import { saveArticle, deleteArticle, publishArticle, unpublishArticle } from '@/app/admin/actions';

const ERR: Record<string, string> = { title: 'An English title or slug is required.', slug: 'Another article already uses that URL.' };

export default async function ArticleEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireUser(can.cms);
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === 'new';
  const a = isNew ? null : (db().prepare('SELECT * FROM articles WHERE id = ?').get(+id) as any);
  if (!isNew && !a) notFound();
  const products = db().prepare('SELECT slug, model FROM products ORDER BY model').all() as any[];
  const linked = j<string[]>(a?.products, []);
  const apps = j<string[]>(a?.applications, []);
  const pair = (name: string, label: string, area?: boolean) => (
    <div className="fgrid">
      {(['en', 'zh'] as const).map((l) => (
        <div className="f" key={l}>
          <label htmlFor={`${name}_${l}`}>{label} ({l === 'en' ? 'English' : '中文'})</label>
          {area ? <textarea id={`${name}_${l}`} name={`${name}_${l}`} defaultValue={a?.[`${name}_${l}`] || ''} style={{ minHeight: 70 }} /> : <input id={`${name}_${l}`} name={`${name}_${l}`} defaultValue={a?.[`${name}_${l}`] || ''} />}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <Topbar crumbs={[['News & articles', '/admin/articles'], [isNew ? 'New' : a.title_en]]} title={isNew ? 'New article' : <>{a.title_en} <Pill v={a.status} /></>} sub={a ? `Last saved ${dateTime(a.updated_at)}` : undefined}>
        {a && <a className="btn" target="_blank" rel="noreferrer" href={`/en/resources/${a.slug}?preview=1`}>Preview ↗</a>}
      </Topbar>
      {sp.saved && <p className="notice">{sp.saved === 'publish' ? 'Published.' : sp.saved === 'unpublish' ? 'Unpublished.' : 'Draft saved.'}</p>}
      {sp.error && <p className="notice bad">{ERR[sp.error] || 'Could not save.'}</p>}
      <form action={saveArticle} className="form">
        {a && <input type="hidden" name="id" value={a.id} />}
        <div className="grid g-main">
          <div className="stack">
            <Panel title="Content">
              <div className="form">
                {pair('title', 'Title')}
                {pair('excerpt', 'Summary', true)}
                <div className="fgrid">
                  <BodyField name="body_en" label="Body (English)" initial={a?.body_en || ''} lang="en" />
                  <BodyField name="body_zh" label="Body (中文)" initial={a?.body_zh || ''} lang="zh" />
                </div>
              </div>
            </Panel>
            <Panel title="Search and AI visibility">
              <SeoFields initial={{ seo_title_en: a?.seo_title_en || '', seo_title_zh: a?.seo_title_zh || '', seo_desc_en: a?.seo_desc_en || '', seo_desc_zh: a?.seo_desc_zh || '' }} urlBase={`arcwind.example › {l} › resources › ${a?.slug || '…'}`} fallbackTitle={{ en: a?.title_en || '', zh: a?.title_zh || '' }} />
            </Panel>
          </div>
          <div className="stack">
            <Panel title="Settings">
              <div className="form">
                <div className="f"><label htmlFor="type">Type</label><select id="type" name="type" defaultValue={a?.type || 'tech'}><option value="tech">Technical note</option><option value="case">Case study</option><option value="news">News</option></select></div>
                <div className="f"><label htmlFor="slug">URL slug</label><input id="slug" name="slug" defaultValue={a?.slug} placeholder="from English title" /></div>
              </div>
            </Panel>
            <Panel title="Related products">
              <div className="checks" style={{ flexDirection: 'column', maxHeight: 260, overflow: 'auto' }}>
                {products.map((p) => <label key={p.slug}><input type="checkbox" name="products" value={p.slug} defaultChecked={linked.includes(p.slug)} /> {p.model}</label>)}
              </div>
            </Panel>
            <Panel title="Applications">
              <div className="checks" style={{ flexDirection: 'column' }}>
                {applications.map((x) => <label key={x.slug}><input type="checkbox" name="applications" value={x.slug} defaultChecked={apps.includes(x.slug)} /> {x.name_en}</label>)}
              </div>
            </Panel>
            {a && <Panel title="Danger zone"><ConfirmButton formAction={deleteArticle} message="Delete this article permanently?">Delete article</ConfirmButton></Panel>}
          </div>
        </div>
        <div className="sticky-actions">
          <button className="btn">Save draft</button>
          {a?.status === 'published' && <button className="btn" formAction={unpublishArticle}>Unpublish</button>}
          <button className="btn btn-copper" formAction={publishArticle}>{a?.status === 'published' ? 'Save and keep live' : 'Publish'}</button>
        </div>
      </form>
    </>
  );
}

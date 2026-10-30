import { notFound } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { dateTime } from '@/lib/admin';
import { applications } from '@/lib/applications';
import { Topbar, Panel, Pill } from '@/components/admin/ui';
import { SpecEditor, SeoFields, BodyField } from '@/components/admin/cms';
import { ConfirmButton } from '@/components/admin/client';
import { saveProduct, deleteProduct, publishProduct, unpublishProduct } from '@/app/admin/actions';

const ERR: Record<string, string> = { model: 'A model number is required.', slug: 'Another product already uses that URL. Change the URL slug.' };

export default async function ProductEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireUser(can.cms);
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === 'new';
  const p = isNew ? null : (db().prepare('SELECT p.*, c.slug AS cat_slug FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?').get(+id) as any);
  if (!isNew && !p) notFound();
  const cats = db().prepare('SELECT * FROM categories ORDER BY sort').all() as any[];
  const params_ = j<Record<string, number>>(p?.params, {});
  const apps = j<string[]>(p?.applications, []);
  const images = j<any[]>(p?.images, []);
  const files = j<any[]>(p?.files, []);
  const previewUrl = p ? `/en/products/${p.cat_slug}/${p.slug}?preview=1` : '';
  const pair = (name: string, label: string, opts: { area?: boolean; rows?: number } = {}) => (
    <div className="fgrid">
      {(['en', 'zh'] as const).map((l) => (
        <div className="f" key={l}>
          <label htmlFor={`${name}_${l}`}>{label} ({l === 'en' ? 'English' : '中文'})</label>
          {opts.area ? <textarea id={`${name}_${l}`} name={`${name}_${l}`} defaultValue={p?.[`${name}_${l}`] || ''} style={{ minHeight: (opts.rows || 3) * 26 }} /> : <input id={`${name}_${l}`} name={`${name}_${l}`} defaultValue={p?.[`${name}_${l}`] || ''} />}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <Topbar crumbs={[['Products', '/admin/products'], [isNew ? 'New' : p.model]]} title={isNew ? 'New product' : <>{p.model} <Pill v={p.status} /></>} sub={p ? `Last saved ${dateTime(p.updated_at)}${p.published_at ? `, first published ${dateTime(p.published_at)}` : ''}` : 'Save as a draft first; publish when both languages are ready.'}>
        {p && <a href={previewUrl} target="_blank" rel="noreferrer" className="btn">Preview{p.status !== 'published' ? ' draft' : ''} ↗</a>}
      </Topbar>
      {sp.saved && <p className="notice">{sp.saved === 'publish' ? 'Published. The product is live on both language sites.' : sp.saved === 'unpublish' ? 'Unpublished. The page is hidden from the site.' : 'Draft saved.'}</p>}
      {sp.error && <p className="notice bad">{ERR[sp.error] || 'Could not save.'}</p>}
      <form action={saveProduct} className="form">
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="grid g-main">
          <div className="stack">
            <Panel title="Identity">
              <div className="fgrid">
                <div className="f"><label htmlFor="model">Model number</label><input id="model" name="model" required defaultValue={p?.model} placeholder="AW-VCM-AF0806" /></div>
                <div className="f"><label htmlFor="category_id">Product family</label><select id="category_id" name="category_id" defaultValue={p?.category_id || cats[0].id}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}</select></div>
                <div className="f full"><label htmlFor="slug">URL slug</label><input id="slug" name="slug" defaultValue={p?.slug} placeholder="generated from model number" /><div className="hint"><span>Changing this changes the public URL.</span></div></div>
              </div>
              {pair('name', 'Product name')}
              {pair('summary', 'One-line summary', { area: true, rows: 2 })}
            </Panel>
            <Panel title="Specifications"><SpecEditor initial={j(p?.specs, [])} /></Panel>
            <Panel title="Description">
              <div className="fgrid">
                <BodyField name="body_en" label="Description (English)" initial={p?.body_en || ''} lang="en" />
                <BodyField name="body_zh" label="Description (中文)" initial={p?.body_zh || ''} lang="zh" />
              </div>
              {pair('custom', 'Customization options', { area: true, rows: 2 })}
            </Panel>
            <Panel title="Images and documents">
              <div className="form">
                {(images.length > 0 || files.length > 0) && (
                  <div className="file-chips">
                    {images.map((f) => <label className="file-chip" key={f.id}><img src={`/api/media/${f.id}`} alt="" />{f.name}<input type="checkbox" name="remove_file" value={f.id} aria-label={`Remove ${f.name}`} /> remove</label>)}
                    {files.map((f) => <label className="file-chip" key={f.id}><a href={`/api/media/${f.id}`}>{f.name}</a><input type="checkbox" name="remove_file" value={f.id} aria-label={`Remove ${f.name}`} /> remove</label>)}
                  </div>
                )}
                <div className="fgrid">
                  <div className="f"><label htmlFor="new_images">Add product photos</label><input id="new_images" name="new_images" type="file" accept="image/*" multiple /><div className="hint"><span>Shown as tabs next to the generated drawing.</span></div></div>
                  <div className="f"><label htmlFor="new_files">Add datasheets (PDF)</label><input id="new_files" name="new_files" type="file" accept=".pdf,.step,.stp,.zip" multiple /><div className="hint"><span>Listed under Documents on the product page.</span></div></div>
                </div>
              </div>
            </Panel>
            <Panel title="Search and AI visibility">
              <SeoFields initial={{ seo_title_en: p?.seo_title_en || '', seo_title_zh: p?.seo_title_zh || '', seo_desc_en: p?.seo_desc_en || '', seo_desc_zh: p?.seo_desc_zh || '' }}
                urlBase={`arcwind.example › {l} › products › ${p?.cat_slug || '…'} › ${p?.slug || '…'}`} fallbackTitle={{ en: p ? `${p.model} ${p.name_en}` : '', zh: p ? `${p.model} ${p.name_zh}` : '' }} />
            </Panel>
          </div>
          <div className="stack">
            <Panel title="Publishing">
              <dl className="dl"><dt>Status</dt><dd>{p ? <Pill v={p.status} /> : 'New'}</dd></dl>
              <label className="checks" style={{ marginTop: 12 }}><label><input type="checkbox" name="featured" defaultChecked={!!p?.featured} /> Feature on family pages</label></label>
            </Panel>
            <Panel title="Filter values">
              <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 10 }}>Numbers used by the parametric product finder.</p>
              <div className="fgrid">
                {[['od', 'Outline / OD (mm)'], ['h', 'Height (mm)'], ['wire', 'Wire (mm)'], ['r', 'Resistance (Ω)'], ['l', 'Inductance (µH)'], ['turns', 'Turns']].map(([k, l]) => (
                  <div className="f" key={k}><label htmlFor={`p_${k}`}>{l}</label><input id={`p_${k}`} name={`p_${k}`} inputMode="decimal" defaultValue={params_[k] ?? ''} /></div>
                ))}
              </div>
            </Panel>
            <Panel title="Drawing geometry">
              <div className="f">
                <label htmlFor="dims">Dimensions (JSON, mm)</label>
                <textarea id="dims" name="dims" defaultValue={JSON.stringify(j(p?.dims, { shape: 'racetrack', L: 8, W: 6, iL: 5, iW: 3, H: 1 }), null, 1)} style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem', minHeight: 120 }} />
                <div className="hint"><span>shape: racetrack (L, W, iL, iW, H), ring (OD, ID, H), bobbin (D, L, d), spiral (OD, ID, T), lra (L, W, H), coin (D, H), module (L, W, H)</span></div>
              </div>
            </Panel>
            <Panel title="Applications">
              <div className="checks" style={{ flexDirection: 'column' }}>
                {applications.map((a) => <label key={a.slug}><input type="checkbox" name="applications" value={a.slug} defaultChecked={apps.includes(a.slug)} /> {a.name_en}</label>)}
              </div>
            </Panel>
            {p && (
              <Panel title="Danger zone">
                <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 10 }}>Unpublishing hides the page but keeps it. Deleting cannot be undone.</p>
                <ConfirmButton formAction={deleteProduct} message={`Delete ${p.model} permanently?`}>Delete product</ConfirmButton>
              </Panel>
            )}
          </div>
        </div>
        <div className="sticky-actions">
          <button className="btn">Save draft</button>
          {p?.status === 'published' && <button className="btn" formAction={unpublishProduct}>Unpublish</button>}
          <button className="btn btn-copper" formAction={publishProduct}>{p?.status === 'published' ? 'Save and keep live' : 'Publish'}</button>
        </div>
      </form>
    </>
  );
}

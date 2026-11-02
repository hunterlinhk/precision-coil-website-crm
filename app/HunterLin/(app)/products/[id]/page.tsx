import { notFound } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { translator, label, fmtDateTime } from '@/lib/admin-lang';
import { applications } from '@/lib/applications';
import { Topbar, Panel, Pill } from '@/components/admin/ui';
import { SpecEditor, SeoFields, BodyField } from '@/components/admin/cms';
import { ConfirmButton } from '@/components/admin/client';
import { PhotoManager } from '@/components/admin/PhotoManager';
import { productRenderName, renderSrc } from '@/lib/renders';
import { saveProduct, deleteProduct, publishProduct, unpublishProduct } from '@/app/HunterLin/actions';


export default async function ProductEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireUser(can.cms);
  const { l, tr } = await translator();
  const ERR: Record<string, string> = { model: tr('A model number is required.', '请填写型号。'), slug: tr('Another product already uses that web address. Change it.', '其他产品已使用该网址，请修改。') };
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === 'new';
  const p = isNew ? null : (db().prepare('SELECT p.*, c.slug AS cat_slug, c.shape AS cat_shape FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?').get(+id) as any);
  if (!isNew && !p) notFound();
  const cats = db().prepare('SELECT * FROM categories ORDER BY sort').all() as any[];
  const params_ = j<Record<string, number>>(p?.params, {});
  const apps = j<string[]>(p?.applications, []);
  const images = j<any[]>(p?.images, []);
  const files = j<any[]>(p?.files, []);
  const previewUrl = p ? `/en/products/${p.cat_slug}/${p.slug}?preview=1` : '';
  const pair = (name: string, lab: string, opts: { area?: boolean; rows?: number } = {}) => (
    <div className="fgrid">
      {(['en', 'zh'] as const).map((lg) => (
        <div className="f" key={lg}>
          <label htmlFor={`${name}_${lg}`}>{lab} ({lg === 'en' ? tr('English', '英文') : tr('Chinese', '中文')})</label>
          {opts.area ? <textarea id={`${name}_${lg}`} name={`${name}_${lg}`} defaultValue={p?.[`${name}_${lg}`] || ''} style={{ minHeight: (opts.rows || 3) * 26 }} /> : <input id={`${name}_${lg}`} name={`${name}_${lg}`} defaultValue={p?.[`${name}_${lg}`] || ''} />}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <Topbar crumbs={[[tr('Products', '产品'), '/HunterLin/products'], [isNew ? tr('New', '新建') : p.model]]} title={isNew ? tr('New product', '新产品') : <>{p.model} <Pill v={p.status} label={label(p.status, l)} /></>} sub={p ? `${tr('Last saved', '上次保存')} ${fmtDateTime(p.updated_at, l)}${p.published_at ? ` · ${tr('first published', '首次发布')} ${fmtDateTime(p.published_at, l)}` : ''}` : tr('Save as a draft first; publish when both languages are ready.', '先保存为草稿，中英文都准备好后再发布。')}>
        {p && <a href={previewUrl} target="_blank" rel="noreferrer" className="btn">{p.status !== 'published' ? tr('Preview draft ↗', '预览草稿 ↗') : tr('Preview ↗', '预览 ↗')}</a>}
      </Topbar>
      {sp.saved && <p className="notice">{sp.saved === 'publish' ? tr('Published. The product is live on both language sites.', '已发布，产品已在中英文网站上线。') : sp.saved === 'unpublish' ? tr('Unpublished. The page is hidden from the site.', '已取消发布，页面已从网站隐藏。') : tr('Draft saved.', '草稿已保存。')}</p>}
      {sp.error && <p className="notice bad">{ERR[sp.error] || tr('Could not save.', '保存失败。')}</p>}
      <form action={saveProduct} className="form">
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="grid g-main">
          <div className="stack">
            <Panel title={tr('Basics', '基本信息')}>
              <div className="fgrid">
                <div className="f"><label htmlFor="model">{tr('Model number', '型号')}</label><input id="model" name="model" required defaultValue={p?.model} placeholder="AW-VCM-AF0806" /></div>
                <div className="f"><label htmlFor="category_id">{tr('Product family', '产品类别')}</label><select id="category_id" name="category_id" defaultValue={p?.category_id || cats[0].id}>{cats.map((c) => <option key={c.id} value={c.id}>{l === 'zh' ? c.name_zh || c.name_en : c.name_en}</option>)}</select></div>
                <div className="f full"><label htmlFor="slug">{tr('Web address', '网址')}</label><input id="slug" name="slug" defaultValue={p?.slug} placeholder={tr('generated from model number', '根据型号自动生成')} /><div className="hint"><span>{tr('Changing this changes the public URL.', '修改后公开网址也会改变。')}</span></div></div>
              </div>
              {pair('name', tr('Product name', '产品名称'))}
              {pair('summary', tr('One-line summary', '一句话简介'), { area: true, rows: 2 })}
            </Panel>
            <Panel title={tr('Specifications', '技术参数')}><SpecEditor initial={j(p?.specs, [])} l={l} /></Panel>
            <Panel title={tr('Description', '产品介绍')}>
              <div className="fgrid">
                <BodyField name="body_en" label={tr('Description (English)', '介绍（英文）')} initial={p?.body_en || ''} lang="en" ui={l} />
                <BodyField name="body_zh" label={tr('Description (Chinese)', '介绍（中文）')} initial={p?.body_zh || ''} lang="zh" ui={l} />
              </div>
              {pair('custom', tr('Customization options', '可定制项'), { area: true, rows: 2 })}
            </Panel>
            <Panel title={tr('Photos', '产品照片')}>
              <PhotoManager key={images.map((i) => i.id).join(',') || 'none'} images={images} model={p?.model || tr('New product', '新产品')} l={l} fallback={p ? renderSrc(productRenderName({ slug: p.slug, dims: j(p.dims, {}), shape: p.cat_shape }))?.src : undefined} />
            </Panel>
            <Panel title={tr('Documents', '资料下载')}>
              <div className="form">
                {files.length > 0 && (
                  <div className="file-chips">
                    {files.map((f) => <label className="file-chip" key={f.id}><a href={`/api/media/${f.id}`}>{f.name}</a><input type="checkbox" name="remove_file" value={f.id} aria-label={`${tr('Remove', '删除')} ${f.name}`} /> {tr('remove', '删除')}</label>)}
                  </div>
                )}
                <div className="f"><label htmlFor="new_files">{tr('Add datasheets (PDF)', '添加规格书（PDF）')}</label><input id="new_files" name="new_files" type="file" accept=".pdf,.step,.stp,.zip" multiple /><div className="hint"><span>{tr('Listed under Documents on the product page.', '显示在产品页的“资料下载”中。')}</span></div></div>
              </div>
            </Panel>
            <Panel title={tr('Search and AI visibility', '搜索与 AI 可见度')}>
              <SeoFields initial={{ seo_title_en: p?.seo_title_en || '', seo_title_zh: p?.seo_title_zh || '', seo_desc_en: p?.seo_desc_en || '', seo_desc_zh: p?.seo_desc_zh || '' }}
                urlBase={`arcwind.example › {l} › products › ${p?.cat_slug || '…'} › ${p?.slug || '…'}`} fallbackTitle={{ en: p ? `${p.model} ${p.name_en}` : '', zh: p ? `${p.model} ${p.name_zh}` : '' }} ui={l} />
            </Panel>
          </div>
          <div className="stack">
            <Panel title={tr('Publishing', '发布')}>
              <dl className="dl"><dt>{tr('Status', '状态')}</dt><dd>{p ? <Pill v={p.status} label={label(p.status, l)} /> : tr('New', '新建')}</dd></dl>
              <label className="checks" style={{ marginTop: 12 }}><label><input type="checkbox" name="featured" defaultChecked={!!p?.featured} /> {tr('Feature on family pages', '在类别页推荐')}</label></label>
            </Panel>
            <Panel title={tr('Filter values', '筛选参数')}>
              <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 10 }}>{tr('Numbers used by the parametric product finder.', '用于网站“参数选型”筛选的数值。')}</p>
              <div className="fgrid">
                {[['od', tr('Outline / OD (mm)', '外形 / 外径 (mm)')], ['h', tr('Height (mm)', '高度 (mm)')], ['wire', tr('Wire (mm)', '线径 (mm)')], ['r', tr('Resistance (Ω)', '电阻 (Ω)')], ['l', tr('Inductance (µH)', '电感 (µH)')], ['turns', tr('Turns', '圈数')]].map(([k, lab]) => (
                  <div className="f" key={k}><label htmlFor={`p_${k}`}>{lab}</label><input id={`p_${k}`} name={`p_${k}`} inputMode="decimal" defaultValue={params_[k] ?? ''} /></div>
                ))}
              </div>
            </Panel>
            <Panel title={tr('Drawing geometry', '图纸尺寸')}>
              <div className="f">
                <label htmlFor="dims">{tr('Dimensions (JSON, mm)', '尺寸（JSON，毫米）')}</label>
                <textarea id="dims" name="dims" defaultValue={JSON.stringify(j(p?.dims, { shape: 'racetrack', L: 8, W: 6, iL: 5, iW: 3, H: 1 }), null, 1)} style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem', minHeight: 120 }} />
                <div className="hint"><span>shape: racetrack (L, W, iL, iW, H), ring (OD, ID, H), bobbin (D, L, d), spiral (OD, ID, T), lra (L, W, H), coin (D, H), module (L, W, H)</span></div>
              </div>
            </Panel>
            <Panel title={tr('Applications', '应用领域')}>
              <div className="checks" style={{ flexDirection: 'column' }}>
                {applications.map((a) => <label key={a.slug}><input type="checkbox" name="applications" value={a.slug} defaultChecked={apps.includes(a.slug)} /> {l === 'zh' ? a.name_zh : a.name_en}</label>)}
              </div>
            </Panel>
            {p && (
              <Panel title={tr('Delete', '删除')}>
                <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 10 }}>{tr('Unpublishing hides the page but keeps it. Deleting cannot be undone.', '取消发布只是隐藏页面；删除后无法恢复。')}</p>
                <ConfirmButton formAction={deleteProduct} message={tr(`Delete ${p.model} permanently?`, `确定永久删除 ${p.model}？`)}>{tr('Delete product', '删除产品')}</ConfirmButton>
              </Panel>
            )}
          </div>
        </div>
        <div className="sticky-actions">
          <button className="btn">{tr('Save draft', '保存草稿')}</button>
          {p?.status === 'published' && <button className="btn" formAction={unpublishProduct}>{tr('Unpublish', '取消发布')}</button>}
          <button className="btn btn-copper" formAction={publishProduct}>{p?.status === 'published' ? tr('Save and keep live', '保存并保持发布') : tr('Publish', '发布')}</button>
        </div>
      </form>
    </>
  );
}

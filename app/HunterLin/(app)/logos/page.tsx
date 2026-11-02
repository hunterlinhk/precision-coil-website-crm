import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { translator } from '@/lib/admin-lang';
import { Topbar, Panel } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/client';
import { saveLogo, moveLogo, deleteLogo } from '../../actions-more';

export const metadata = { title: 'Customer logos' };

export default async function Logos({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  await requireUser(can.cms);
  const { tr } = await translator();
  const sp = await searchParams;
  const rows = db().prepare('SELECT * FROM logos ORDER BY sort, id').all() as any[];
  return (
    <>
      <Topbar title={tr('Customer logos', '客户标志')} sub={tr('The strip of customer brands under the homepage banner. Without an uploaded file, the name is shown as text.', '首页横幅下方的客户品牌展示。未上传标志文件时，以文字显示品牌名称。')}>
        <a className="btn" href="/en#logos-title" target="_blank" rel="noreferrer">{tr('See it on the site ↗', '在网站上查看 ↗')}</a>
      </Topbar>
      {sp.saved && <p className="notice">{tr('Saved. The homepage is updated.', '已保存，首页已更新。')}</p>}
      {sp.deleted && <p className="notice">{tr('Logo removed.', '已删除。')}</p>}
      {sp.error && <p className="notice bad">{sp.error === 'image' ? tr('Upload a PNG, JPG, WebP or SVG image.', '请上传 PNG、JPG、WebP 或 SVG 图片。') : tr('A name is required.', '请填写名称。')}</p>}
      <p className="notice warn">{tr('Only show brands you have permission to name publicly. Most customers’ supplier agreements cover this; check with sales if unsure.', '请只展示已获准公开的客户品牌。大部分客户的供应商协议里会对此有约定，不确定时请先与销售确认。')}</p>
      <Panel flush>
        <ul className="logo-rows">
          {rows.map((r, i) => (
            <li key={r.id} className={r.visible ? '' : 'hidden-logo'}>
              <div className="logo-prev" aria-hidden="true">{r.image ? <img src={`/api/media/${r.image}`} alt="" /> : <span>{r.name}</span>}</div>
              <form action={saveLogo} className="logo-form">
                <input type="hidden" name="id" value={r.id} />
                <input name="name" defaultValue={r.name} required aria-label={tr('Name', '名称')} />
                <input name="url" defaultValue={r.url || ''} placeholder={tr('Link (optional)', '链接（可选）')} aria-label={tr('Link', '链接')} />
                <label className="file-btn btn btn-sm">{r.image ? tr('Replace image', '更换图片') : tr('Upload logo', '上传标志')}<input type="file" name="image" accept=".png,.jpg,.jpeg,.webp,.svg" /></label>
                {r.image && <label className="check"><input type="checkbox" name="image_remove" /> {tr('Remove image', '删除图片')}</label>}
                <label className="check"><input type="checkbox" name="visible" defaultChecked={!!r.visible} /> {tr('Show', '显示')}</label>
                <button className="btn btn-sm btn-primary">{tr('Save', '保存')}</button>
              </form>
              <div className="logo-ctl">
                <form action={moveLogo}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="dir" value="up" /><button className="btn btn-ghost btn-sm" disabled={i === 0} aria-label={tr('Move up', '上移')}>↑</button></form>
                <form action={moveLogo}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="dir" value="down" /><button className="btn btn-ghost btn-sm" disabled={i === rows.length - 1} aria-label={tr('Move down', '下移')}>↓</button></form>
                <form action={deleteLogo}><input type="hidden" name="id" value={r.id} /><ConfirmButton className="btn btn-ghost btn-sm" message={tr(`Remove ${r.name}?`, `确定删除 ${r.name}？`)}>{tr('Delete', '删除')}</ConfirmButton></form>
              </div>
            </li>
          ))}
        </ul>
        <form action={saveLogo} className="logo-form logo-add">
          <strong>{tr('Add a customer', '添加客户品牌')}</strong>
          <input name="name" required placeholder={tr('Brand name, e.g. Honor', '品牌名称，例如 Honor')} aria-label={tr('Name', '名称')} />
          <input name="url" placeholder={tr('Link (optional)', '链接（可选）')} aria-label={tr('Link', '链接')} />
          <label className="file-btn btn btn-sm">{tr('Logo file (optional)', '标志文件（可选）')}<input type="file" name="image" accept=".png,.jpg,.jpeg,.webp,.svg" /></label>
          <button className="btn btn-sm btn-primary">{tr('Add', '添加')}</button>
        </form>
      </Panel>
      <p className="muted" style={{ fontSize: '0.82rem', marginTop: 10 }}>{tr('Tip: a single-colour SVG or a transparent PNG about 300 px wide looks best. Logos are shown in grey and turn to colour on hover.', '建议使用单色 SVG 或约 300 像素宽的透明 PNG。标志默认显示为灰色，鼠标悬停时显示原色。')}</p>
    </>
  );
}

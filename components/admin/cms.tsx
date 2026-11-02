'use client';
import { useState } from 'react';

type Spec = { k: string; en: string; zh: string; v: string; u?: string };

export function SpecEditor({ initial, l = 'en' }: { initial: Spec[]; l?: 'en' | 'zh' }) {
  const tr = (en: string, zh: string) => (l === 'zh' ? zh : en);
  const [rows, setRows] = useState<Spec[]>(initial.length ? initial : [{ k: '', en: '', zh: '', v: '', u: '' }]);
  const set = (i: number, k: keyof Spec, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) => { const n = [...rows]; const t = n[i]; n[i] = n[i + d]; n[i + d] = t; setRows(n); };
  return (
    <div>
      <input type="hidden" name="specs" value={JSON.stringify(rows)} />
      <div className="spec-head"><span>{tr('Label (English)', '名称（英文）')}</span><span>{tr('Label (Chinese)', '名称（中文）')}</span><span>{tr('Value', '数值')}</span><span>{tr('Unit', '单位')}</span></div>
      <div className="spec-rows">
        {rows.map((r, i) => (
          <div className="spec-row" key={i}>
            <input value={r.en} onChange={(e) => set(i, 'en', e.target.value)} aria-label={`Spec ${i + 1} label`} placeholder="DC resistance @20 °C" />
            <input value={r.zh} onChange={(e) => set(i, 'zh', e.target.value)} aria-label={`Spec ${i + 1} Chinese label`} placeholder="直流电阻" />
            <input value={r.v} onChange={(e) => set(i, 'v', e.target.value)} aria-label={`Spec ${i + 1} value`} placeholder="12.5 ±5%" />
            <input value={r.u || ''} onChange={(e) => set(i, 'u', e.target.value)} aria-label={`Spec ${i + 1} unit`} placeholder={tr('unit', '单位')} />
            <span style={{ display: 'flex', gap: 2 }}>
              <button type="button" className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={tr('Move up', '上移')}>↑</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={tr('Remove row', '删除此行')}>✕</button>
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setRows([...rows, { k: '', en: '', zh: '', v: '', u: '' }])}>{tr('Add specification', '添加参数')}</button>
    </div>
  );
}

// Search-result preview with length guidance, per language.
export function SeoFields({ initial, urlBase, fallbackTitle, ui = 'en' }: { initial: Record<string, string>; urlBase: string; fallbackTitle: Record<string, string>; ui?: 'en' | 'zh' }) {
  const tr = (en: string, zh: string) => (ui === 'zh' ? zh : en);
  const [v, setV] = useState(initial);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const title = v[`seo_title_${lang}`] || fallbackTitle[lang] || '';
  const desc = v[`seo_desc_${lang}`] || '';
  const tMax = lang === 'en' ? 60 : 32, dMax = lang === 'en' ? 158 : 80;
  return (
    <div className="form">
      <div className="ltabs" role="tablist">
        {(['en', 'zh'] as const).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)}>
            {l === 'en' ? 'English' : '中文'}{!v[`seo_desc_${l}`] && <span className="miss">{tr('missing description', '缺少描述')}</span>}
          </button>
        ))}
      </div>
      {(['en', 'zh'] as const).map((l) => (
        <div key={l} hidden={lang !== l} className="form">
          <div className="f">
            <label htmlFor={`seo_title_${l}`}>{tr('Search title', '搜索标题')}</label>
            <input id={`seo_title_${l}`} name={`seo_title_${l}`} value={v[`seo_title_${l}`] || ''} onChange={(e) => setV({ ...v, [`seo_title_${l}`]: e.target.value })} placeholder={fallbackTitle[l]} />
            <div className="hint"><span>{tr('Leave empty to use the page name.', '留空则使用页面名称。')}</span><span className={(v[`seo_title_${l}`] || '').length > tMax ? 'over' : ''}>{(v[`seo_title_${l}`] || '').length} / {tMax}</span></div>
          </div>
          <div className="f">
            <label htmlFor={`seo_desc_${l}`}>{tr('Search description', '搜索描述')}</label>
            <textarea id={`seo_desc_${l}`} name={`seo_desc_${l}`} value={v[`seo_desc_${l}`] || ''} onChange={(e) => setV({ ...v, [`seo_desc_${l}`]: e.target.value })} style={{ minHeight: 70 }} />
            <div className="hint"><span>{tr('One or two factual sentences. AI assistants often quote this.', '一两句客观描述，AI 助手经常引用这段文字。')}</span><span className={desc.length > dMax ? 'over' : ''}>{desc.length} / {dMax}</span></div>
          </div>
        </div>
      ))}
      <div className="serp" aria-label={tr('Search result preview', '搜索结果预览')}>
        <div className="u">{urlBase.replace('{l}', lang)}</div>
        <div className="t">{title.length > tMax + 5 ? title.slice(0, tMax + 2) + '…' : title}</div>
        <div className="d">{desc ? (desc.length > dMax + 5 ? desc.slice(0, dMax) + '…' : desc) : <em>{tr('No description yet. Search engines will pick text from the page.', '还没有描述，搜索引擎会自动从页面中截取文字。')}</em>}</div>
      </div>
    </div>
  );
}

// Body editor with a word count and a quick-reference for the supported Markdown.
export function BodyField({ name, label, initial, lang, ui = 'en' }: { name: string; label: string; initial: string; lang: 'en' | 'zh'; ui?: 'en' | 'zh' }) {
  const [v, setV] = useState(initial || '');
  const count = lang === 'en' ? v.split(/\s+/).filter(Boolean).length : v.replace(/\s/g, '').length;
  return (
    <div className="f">
      <label htmlFor={name}>{label}</label>
      <textarea id={name} name={name} className="tall" value={v} onChange={(e) => setV(e.target.value)} />
      <div className="hint"><span>{ui === 'zh' ? '## 小标题，**加粗**，- 列表，1. 编号，[链接](网址)' : '## Heading, **bold**, - list, 1. numbered, [link](url)'}</span><span>{count} {lang === 'en' ? 'words' : '字'}</span></div>
    </div>
  );
}

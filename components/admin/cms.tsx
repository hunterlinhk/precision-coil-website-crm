'use client';
import { useState } from 'react';

type Spec = { k: string; en: string; zh: string; v: string; u?: string };

export function SpecEditor({ initial }: { initial: Spec[] }) {
  const [rows, setRows] = useState<Spec[]>(initial.length ? initial : [{ k: '', en: '', zh: '', v: '', u: '' }]);
  const set = (i: number, k: keyof Spec, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) => { const n = [...rows]; const t = n[i]; n[i] = n[i + d]; n[i + d] = t; setRows(n); };
  return (
    <div>
      <input type="hidden" name="specs" value={JSON.stringify(rows)} />
      <div className="spec-head"><span>Label (English)</span><span>标签（中文）</span><span>Value</span><span>Unit</span></div>
      <div className="spec-rows">
        {rows.map((r, i) => (
          <div className="spec-row" key={i}>
            <input value={r.en} onChange={(e) => set(i, 'en', e.target.value)} aria-label={`Spec ${i + 1} label`} placeholder="DC resistance @20 °C" />
            <input value={r.zh} onChange={(e) => set(i, 'zh', e.target.value)} aria-label={`Spec ${i + 1} Chinese label`} placeholder="直流电阻" />
            <input value={r.v} onChange={(e) => set(i, 'v', e.target.value)} aria-label={`Spec ${i + 1} value`} placeholder="12.5 ±5%" />
            <input value={r.u || ''} onChange={(e) => set(i, 'u', e.target.value)} aria-label={`Spec ${i + 1} unit`} placeholder="unit" />
            <span style={{ display: 'flex', gap: 2 }}>
              <button type="button" className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove row">✕</button>
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setRows([...rows, { k: '', en: '', zh: '', v: '', u: '' }])}>Add specification</button>
    </div>
  );
}

// Search-result preview with length guidance, per language.
export function SeoFields({ initial, urlBase, fallbackTitle }: { initial: Record<string, string>; urlBase: string; fallbackTitle: Record<string, string> }) {
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
            {l === 'en' ? 'English' : '中文'}{!v[`seo_desc_${l}`] && <span className="miss">missing description</span>}
          </button>
        ))}
      </div>
      {(['en', 'zh'] as const).map((l) => (
        <div key={l} hidden={lang !== l} className="form">
          <div className="f">
            <label htmlFor={`seo_title_${l}`}>Search title</label>
            <input id={`seo_title_${l}`} name={`seo_title_${l}`} value={v[`seo_title_${l}`] || ''} onChange={(e) => setV({ ...v, [`seo_title_${l}`]: e.target.value })} placeholder={fallbackTitle[l]} />
            <div className="hint"><span>Leave empty to use the page name.</span><span className={(v[`seo_title_${l}`] || '').length > tMax ? 'over' : ''}>{(v[`seo_title_${l}`] || '').length} / {tMax}</span></div>
          </div>
          <div className="f">
            <label htmlFor={`seo_desc_${l}`}>Search description</label>
            <textarea id={`seo_desc_${l}`} name={`seo_desc_${l}`} value={v[`seo_desc_${l}`] || ''} onChange={(e) => setV({ ...v, [`seo_desc_${l}`]: e.target.value })} style={{ minHeight: 70 }} />
            <div className="hint"><span>One or two factual sentences. AI assistants often quote this.</span><span className={desc.length > dMax ? 'over' : ''}>{desc.length} / {dMax}</span></div>
          </div>
        </div>
      ))}
      <div className="serp" aria-label="Search result preview">
        <div className="u">{urlBase.replace('{l}', lang)}</div>
        <div className="t">{title.length > tMax + 5 ? title.slice(0, tMax + 2) + '…' : title}</div>
        <div className="d">{desc ? (desc.length > dMax + 5 ? desc.slice(0, dMax) + '…' : desc) : <em>No description yet. Search engines will pick text from the page.</em>}</div>
      </div>
    </div>
  );
}

// Body editor with a word count and a quick-reference for the supported Markdown.
export function BodyField({ name, label, initial, lang }: { name: string; label: string; initial: string; lang: 'en' | 'zh' }) {
  const [v, setV] = useState(initial || '');
  const count = lang === 'en' ? v.split(/\s+/).filter(Boolean).length : v.replace(/\s/g, '').length;
  return (
    <div className="f">
      <label htmlFor={name}>{label}</label>
      <textarea id={name} name={name} className="tall" value={v} onChange={(e) => setV(e.target.value)} />
      <div className="hint"><span>## Heading, **bold**, - list, 1. numbered, [link](url)</span><span>{count} {lang === 'en' ? 'words' : '字'}</span></div>
    </div>
  );
}

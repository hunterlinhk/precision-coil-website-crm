'use client';
import { toneOf } from '@/lib/tones';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AddToRfq } from './client';

export type FinderRow = {
  slug: string; model: string; name: string; name_en: string; name_zh: string; category: string; categoryName: string;
  params: { od?: number; h?: number; wire?: number; r?: number }; thumb: React.ReactNode;
};
type Labels = {
  finder: string; od: string; height: string; wire: string; resistance: string; reset: string; results: string;
  noResults: string; model: string; family: string; add: string; added: string; search: string; sendDrawing: string; toDrawing: string;
  grid: string; table: string; filters: string; toDrawingBody: string; short: [string, string, string];
};
type Key = 'od' | 'h' | 'wire' | 'r';
const empty: Record<Key, [string, string]> = { od: ['', ''], h: ['', ''], wire: ['', ''], r: ['', ''] };

export function ProductFinder({ rows, labels, locale, pills, pillsLabel }: { rows: FinderRow[]; labels: Labels; locale: string; pills: { href: string; label: string; current: boolean }[]; pillsLabel: string }) {
  const [q, setQ] = useState('');
  const [range, setRange] = useState(empty);
  const [sort, setSort] = useState<{ key: Key | 'model'; dir: 1 | -1 }>({ key: 'model', dir: 1 });
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [open, setOpen] = useState(false);
  useEffect(() => { try { const v = localStorage.getItem('aw_view'); if (v === 'table' || v === 'grid') setView(v); } catch { /* ignore */ } }, []);
  const pick = (v: 'grid' | 'table') => { setView(v); try { localStorage.setItem('aw_view', v); } catch { /* ignore */ } };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (term && !`${r.model} ${r.name_en} ${r.name_zh}`.toLowerCase().includes(term)) return false;
      return (Object.keys(range) as Key[]).every((k) => {
        const [lo, hi] = range[k];
        const v = r.params[k];
        if (lo !== '' && (v === undefined || v < +lo)) return false;
        if (hi !== '' && (v === undefined || v > +hi)) return false;
        return true;
      });
    });
    return sort.key === 'model' ? out : [...out].sort((a, b) => ((a.params[sort.key as Key] ?? 0) - (b.params[sort.key as Key] ?? 0)) * sort.dir);
  }, [rows, q, range, sort]);

  const set = (k: Key, i: 0 | 1, v: string) => setRange((r) => ({ ...r, [k]: (i === 0 ? [v, r[k][1]] : [r[k][0], v]) as [string, string] }));
  const fields: [Key, string][] = [['od', labels.od], ['h', labels.height], ['wire', labels.wire], ['r', labels.resistance]];
  const fmt = (n?: number) => (n === undefined ? '—' : n >= 100 ? n.toLocaleString('en') : String(n));
  const active = !!q || Object.values(range).some(([a, b]) => a || b);
  const sortBtn = (k: Key, label: string) => (
    <button type="button" onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (-s.dir as 1 | -1) : 1 }))} aria-label={`${label}, sort`}>
      {label}<span aria-hidden="true">{sort.key === k ? (sort.dir === 1 ? '↑' : '↓') : ''}</span>
    </button>
  );
  const item = (r: FinderRow) => ({ model: r.model, slug: r.slug, category: r.category, name_en: r.name_en, name_zh: r.name_zh });

  return (
    <div>
      <div className="catbar">
        <nav className="pills" aria-label={pillsLabel}>
          {pills.map((p) => <Link key={p.href} href={p.href} aria-current={p.current ? 'page' : undefined}>{p.label}</Link>)}
        </nav>
        <div className="cat-tools">
          <button type="button" className="btn btn-line btn-sm" aria-expanded={open} aria-controls="filters" onClick={() => setOpen(!open)}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.4" fill="none" /></svg>
            {labels.filters}{active ? ' •' : ''}
          </button>
          <div className="seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'grid'} onClick={() => pick('grid')}>{labels.grid}</button>
            <button type="button" aria-pressed={view === 'table'} onClick={() => pick('table')}>{labels.table}</button>
          </div>
        </div>
      </div>
      <div id="filters" className="filter-panel" hidden={!open}>
        <div className="range">
          <label htmlFor="f-q">{labels.search}</label>
          <input id="f-q" className="field-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="AW-VCM…" />
        </div>
        {fields.map(([k, label]) => (
          <div className="range" key={k}>
            <label htmlFor={`f-${k}-lo`}>{label}</label>
            <div className="range-row">
              <input id={`f-${k}-lo`} className="field-input" inputMode="decimal" placeholder="min" value={range[k][0]} onChange={(e) => set(k, 0, e.target.value)} aria-label={`${label} min`} />
              <span>–</span>
              <input className="field-input" inputMode="decimal" placeholder="max" value={range[k][1]} onChange={(e) => set(k, 1, e.target.value)} aria-label={`${label} max`} />
            </div>
          </div>
        ))}
      </div>
      <div className="finder-meta">
        <span aria-live="polite">{filtered.length} {labels.results}</span>
        {active && <button type="button" className="reset" onClick={() => { setQ(''); setRange(empty); }}>{labels.reset}</button>}
      </div>

      {filtered.length === 0 ? (
        <p className="finder-empty">{labels.noResults} <Link className="link" href={`/${locale}/contact?type=drawing`}>{labels.sendDrawing}</Link></p>
      ) : view === 'grid' ? (
        <ul className="pgrid">
          {filtered.map((r) => (
            <li key={r.slug} className="pcard">
              <div className="pcard-media" data-spot data-tone={toneOf(r.category)}>{r.thumb}</div>
              <div className="pcard-body">
                <Link className="pcard-model" href={`/${locale}/products/${r.category}/${r.slug}`}>{r.model}</Link>
                <span className="pcard-name">{r.name}</span>
                <span className="pcard-add"><AddToRfq variant="icon" labels={{ add: labels.add, added: labels.added }} item={item(r)} /></span>
                <span className="pcard-specs">
                  <span>{fmt(r.params.od)} mm<small>{labels.short[0]}</small></span>
                  <span>{fmt(r.params.h)} mm<small>{labels.short[1]}</small></span>
                  <span>{fmt(r.params.wire)} mm<small>{labels.short[2]}</small></span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="table-scroll">
          <table className="ptable">
            <thead>
              <tr>
                <th>{labels.model}</th>
                <th className="n">{sortBtn('od', labels.od)}</th>
                <th className="n">{sortBtn('h', labels.height)}</th>
                <th className="n">{sortBtn('wire', labels.wire)}</th>
                <th className="n">{sortBtn('r', labels.resistance)}</th>
                <th><span className="sr-only">RFQ</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.slug}>
                  <td>
                    <div className="p-cell">
                      <div className="p-thumb" data-tone={toneOf(r.category)}>{r.thumb}</div>
                      <div><Link className="p-model" href={`/${locale}/products/${r.category}/${r.slug}`}>{r.model}</Link><span className="p-name">{r.name}</span></div>
                    </div>
                  </td>
                  <td className="n" data-label={labels.od}>{fmt(r.params.od)}</td>
                  <td className="n" data-label={labels.height}>{fmt(r.params.h)}</td>
                  <td className="n" data-label={labels.wire}>{fmt(r.params.wire)}</td>
                  <td className="n" data-label={labels.resistance}>{fmt(r.params.r)}</td>
                  <td className="n"><AddToRfq size="sm" labels={{ add: labels.add, added: labels.added }} item={item(r)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="custom-band">
        <div><h2>{labels.toDrawing}</h2><p>{labels.toDrawingBody}</p></div>
        <Link href={`/${locale}/contact?type=drawing`} className="btn btn-light">{labels.sendDrawing}</Link>
      </div>
    </div>
  );
}

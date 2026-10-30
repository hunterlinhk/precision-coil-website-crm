'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AddToRfq } from './client';

export type FinderRow = {
  slug: string; model: string; name: string; name_en: string; name_zh: string; category: string; categoryName: string;
  params: { od?: number; h?: number; wire?: number; r?: number }; thumb: React.ReactNode;
};
type Labels = {
  finder: string; od: string; height: string; wire: string; resistance: string; reset: string; results: string;
  noResults: string; model: string; family: string; add: string; added: string; search: string; sendDrawing: string; toDrawing: string;
};
type Key = 'od' | 'h' | 'wire' | 'r';

export function ProductFinder({ rows, labels, locale }: { rows: FinderRow[]; labels: Labels; locale: string }) {
  const [q, setQ] = useState('');
  const [range, setRange] = useState<Record<Key, [string, string]>>({ od: ['', ''], h: ['', ''], wire: ['', ''], r: ['', ''] });
  const [sort, setSort] = useState<{ key: Key | 'model'; dir: 1 | -1 }>({ key: 'model', dir: 1 });

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
    return out.sort((a, b) => {
      if (sort.key === 'model') return 0; // keep catalogue order
      return ((a.params[sort.key] ?? 0) - (b.params[sort.key] ?? 0)) * sort.dir;
    });
  }, [rows, q, range, sort]);

  const set = (k: Key, i: 0 | 1, v: string) => setRange((r) => ({ ...r, [k]: (i === 0 ? [v, r[k][1]] : [r[k][0], v]) as [string, string] }));
  const fields: [Key, string][] = [['od', labels.od], ['h', labels.height], ['wire', labels.wire], ['r', labels.resistance]];
  const fmt = (n?: number) => (n === undefined ? '—' : n >= 100 ? n.toLocaleString('en') : String(n));
  const sortBtn = (k: Key, label: string) => (
    <button type="button" onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (-s.dir as 1 | -1) : 1 }))}
      aria-label={`${label}, sort`}>
      {label}<span aria-hidden="true">{sort.key === k ? (sort.dir === 1 ? '↑' : '↓') : ''}</span>
    </button>
  );
  const active = q || Object.values(range).some(([a, b]) => a || b);

  return (
    <div className="finder">
      <aside className="finder-filters" aria-label={labels.finder}>
        <h2>{labels.finder}</h2>
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
        {active && <button type="button" className="finder-reset" onClick={() => { setQ(''); setRange({ od: ['', ''], h: ['', ''], wire: ['', ''], r: ['', ''] }); }}>{labels.reset}</button>}
      </aside>
      <div>
        <p className="finder-count" aria-live="polite">{filtered.length} {labels.results}</p>
        {filtered.length === 0 ? (
          <p className="finder-empty">{labels.noResults} <Link className="text-link" href={`/${locale}/contact?type=drawing`}>{labels.sendDrawing}</Link></p>
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
                        <div className="p-thumb">{r.thumb}</div>
                        <div>
                          <Link className="p-model" href={`/${locale}/products/${r.category}/${r.slug}`}>{r.model}</Link>
                          <span className="p-name">{r.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="n" data-label={labels.od}>{fmt(r.params.od)}</td>
                    <td className="n" data-label={labels.height}>{fmt(r.params.h)}</td>
                    <td className="n" data-label={labels.wire}>{fmt(r.params.wire)}</td>
                    <td className="n" data-label={labels.resistance}>{fmt(r.params.r)}</td>
                    <td>
                      <AddToRfq size="sm" labels={{ add: labels.add, added: labels.added }}
                        item={{ model: r.model, slug: r.slug, category: r.category, name_en: r.name_en, name_zh: r.name_zh }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="finder-note">
          <span>{labels.toDrawing}</span>
          <Link href={`/${locale}/contact?type=drawing`} className="btn btn-ink btn-sm">{labels.sendDrawing}</Link>
        </div>
      </div>
    </div>
  );
}

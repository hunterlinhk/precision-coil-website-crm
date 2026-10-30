'use client';
import { useState } from 'react';

type Line = { model: string; qty: number; unit: number };

export function QuoteLines({ initial, models, currency, readOnly }: { initial: Line[]; models: string[]; currency: string; readOnly?: boolean }) {
  const [lines, setLines] = useState<Line[]>(initial.length ? initial : [{ model: '', qty: 0, unit: 0 }]);
  const total = lines.reduce((s, l) => s + (+l.qty || 0) * (+l.unit || 0), 0);
  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(v);
  const set = (i: number, k: keyof Line, v: string) => setLines(lines.map((l, j) => (j === i ? { ...l, [k]: k === 'model' ? v : +v } : l)));
  return (
    <div>
      <input type="hidden" name="items" value={JSON.stringify(lines)} />
      <datalist id="models">{models.map((m) => <option key={m} value={m} />)}</datalist>
      <table className="t">
        <thead><tr><th>Part</th><th className="r">Quantity</th><th className="r">Unit price</th><th className="r">Line total</th>{!readOnly && <th />}</tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td>{readOnly ? <strong>{l.model}</strong> : <input list="models" value={l.model} onChange={(e) => set(i, 'model', e.target.value)} aria-label="Part number" style={{ width: '100%', minHeight: 32, border: '1px solid var(--rule-2)', borderRadius: 6, padding: '0 8px' }} />}</td>
              <td className="r">{readOnly ? l.qty.toLocaleString('en') : <input value={l.qty || ''} inputMode="numeric" onChange={(e) => set(i, 'qty', e.target.value.replace(/[^\d]/g, ''))} aria-label="Quantity" style={{ width: 110, minHeight: 32, textAlign: 'right', border: '1px solid var(--rule-2)', borderRadius: 6, padding: '0 8px' }} />}</td>
              <td className="r">{readOnly ? l.unit.toFixed(4) : <input value={l.unit || ''} inputMode="decimal" onChange={(e) => set(i, 'unit', e.target.value)} aria-label="Unit price" style={{ width: 100, minHeight: 32, textAlign: 'right', border: '1px solid var(--rule-2)', borderRadius: 6, padding: '0 8px' }} />}</td>
              <td className="r">{fmt((+l.qty || 0) * (+l.unit || 0))}</td>
              {!readOnly && <td className="r"><button type="button" className="btn btn-ghost btn-sm" onClick={() => setLines(lines.filter((_, j) => j !== i))} aria-label="Remove line">Remove</button></td>}
            </tr>
          ))}
          <tr><td colSpan={3} className="r"><strong>Total</strong></td><td className="r"><strong>{fmt(total)}</strong></td>{!readOnly && <td />}</tr>
        </tbody>
      </table>
      {!readOnly && <button type="button" className="btn btn-sm no-print" style={{ marginTop: 10 }} onClick={() => setLines([...lines, { model: '', qty: 0, unit: 0 }])}>Add line</button>}
    </div>
  );
}

export function PrintBtn() {
  return <button type="button" className="btn" onClick={() => window.print()}>Print or save PDF</button>;
}

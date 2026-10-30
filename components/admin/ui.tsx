import Link from 'next/link';

export function Topbar({ title, sub, crumbs, children }: { title: React.ReactNode; sub?: React.ReactNode; crumbs?: [string, string?][]; children?: React.ReactNode }) {
  return (
    <div className="topbar">
      <div>
        {crumbs && <div className="crumb">{crumbs.map(([l, h], i) => <span key={i}>{h ? <Link href={h}>{l}</Link> : l}{i < crumbs.length - 1 ? ' / ' : ''}</span>)}</div>}
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children && <div className="topbar-actions">{children}</div>}
    </div>
  );
}

export const Pill = ({ v, label }: { v: string; label?: string }) => <span className={`pill ${v}`}>{label || v.replace(/_/g, ' ')}</span>;

export function Panel({ title, aside, children, flush }: { title?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; flush?: boolean }) {
  return (
    <section className="panel">
      {title && <div className="panel-head"><h2>{title}</h2>{aside}</div>}
      <div className={`panel-body ${flush ? 'flush' : ''}`}>{children}</div>
    </section>
  );
}

// Single-series vertical bar chart (SVG). Each bar has a native tooltip.
export function BarChart({ data, height = 180, ink }: { data: { label: string; value: number; title?: string }[]; height?: number; ink?: boolean }) {
  const W = 640, H = height, padL = 28, padB = 22, padT = 16;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const ticks = [0, top / 2, top];
  const bw = (W - padL) / data.length;
  const y = (v: number) => H - padB - (v / top) * (H - padB - padT);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid-line" x1={padL} x2={W} y1={y(t)} y2={y(t)} />
          <text className="axis-label" x={padL - 6} y={y(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padL + i * bw + bw * 0.18;
        const w = bw * 0.64;
        const h = Math.max(0, H - padB - y(d.value));
        const r = Math.min(4, w / 2, h);
        return (
          <g key={d.label + i}>
            <path className={`bar ${ink ? 'ink' : ''}`} d={`M${x},${H - padB} V${H - padB - h + r} Q${x},${H - padB - h} ${x + r},${H - padB - h} H${x + w - r} Q${x + w},${H - padB - h} ${x + w},${H - padB - h + r} V${H - padB} Z`}>
              <title>{d.title || `${d.label}: ${d.value}`}</title>
            </path>
            {i === data.length - 1 && d.value > 0 && <text className="val-label" x={x + w / 2} y={H - padB - h - 5} textAnchor="middle">{d.value}</text>}
            {(i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && <text className="axis-label" x={x + w / 2} y={H - 6} textAnchor="middle">{d.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function HBars({ data, ink, format }: { data: { label: string; value: number }[]; ink?: boolean; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="hbars">
      {data.map((d) => (
        <div className="hbar" key={d.label} title={`${d.label}: ${format ? format(d.value) : d.value}`}>
          <span className="name">{d.label}</span>
          <span className="track"><span className={`fill ${ink ? 'ink' : ''}`} style={{ width: `${(d.value / max) * 100}%` }} /></span>
          <span className="n">{format ? format(d.value) : d.value}</span>
        </div>
      ))}
    </div>
  );
}

import { Render } from './Render';

/* Decorative, server-rendered pieces that the motion layer brings to life. */

// Infinite strip of words and product renders. The second copy is hidden from assistive tech.
export function Marquee({ items, tone = 'copper', speed = 48 }: { items: { label: string; render?: string; tone?: string }[]; tone?: 'copper' | 'dark' | 'light'; speed?: number }) {
  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <li key={i}>
          {it.render && <span className="marquee-art" data-tone={it.tone}><Render name={it.render} alt="" sizes="120px" /></span>}
          <span>{it.label}</span>
          <svg className="marquee-sep" viewBox="0 0 30 26" aria-hidden="true"><circle cx="8" cy="18.4" r="6.2" /><circle cx="22" cy="18.4" r="6.2" /><circle cx="15" cy="6.4" r="6.2" /></svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee marquee-${tone}`} style={{ ['--dur' as any]: `${speed}s` }}>
      <div className="marquee-track">{row(false)}{row(true)}</div>
    </div>
  );
}

// A length of wire that runs in from the left, winds into a coil, and runs out again.
// Drawn on as the section scrolls through the viewport (stroke-dashoffset from --p).
export function WireCoil({ className, turns = 9 }: { className?: string; turns?: number }) {
  const W = 1600;
  const x0 = 500, a = 52, b = 92, bottom = 250;
  const pts: [number, number][] = [];
  // lead in: rises from the left and arrives level with the bottom of the first turn
  for (let x = -20; x < x0; x += 16) { const k = Math.max(0, x) / x0; pts.push([x, 110 + (bottom - 110) * (1 - Math.cos(Math.PI * k)) / 2]); }
  // winding: a prolate cycloid reads as turns seen from the side; start at the bottom of a loop moving right
  const steps = turns * 48;
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * turns * Math.PI * 2;
    const t = u + Math.PI;
    pts.push([x0 + (a * u) / (Math.PI * 2) + (a * u) / 6 - b * 0.55 * Math.sin(t), bottom - b * 0.82 * (1 + Math.cos(t))]);
  }
  // lead out: level, then easing back up to the right edge
  const [lx, ly] = pts[pts.length - 1];
  for (let x = lx + 16; x <= W + 20; x += 16) { const k = (x - lx) / (W + 20 - lx); pts.push([x, ly - 90 * (1 - Math.cos(Math.PI * k)) / 2]); }
  const d = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
  return (
    <svg className={`wirecoil ${className || ''}`} viewBox={`0 0 ${W} 300`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <linearGradient id="cu-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6a2c0c" />
          <stop offset="0.35" stopColor="#c4652c" />
          <stop offset="0.55" stopColor="#ffc9a1" />
          <stop offset="0.75" stopColor="#c4652c" />
          <stop offset="1" stopColor="#7a3512" />
        </linearGradient>
      </defs>
      <path className="wirecoil-shadow" d={d} pathLength={1} />
      <path className="wirecoil-wire" d={d} pathLength={1} stroke="url(#cu-grad)" />
    </svg>
  );
}

// Rotating text seal.
export function Seal({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`seal ${className || ''}`} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs><path id="seal-path" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" /></defs>
        <text textLength={284} lengthAdjust="spacing"><textPath href="#seal-path" startOffset="0" textLength={284} lengthAdjust="spacing">{text}</textPath></text>
      </svg>
      <svg className="seal-core" viewBox="0 0 30 26"><circle cx="8" cy="18.4" r="6.2" /><circle cx="22" cy="18.4" r="6.2" /><circle cx="15" cy="6.4" r="6.2" /></svg>
    </span>
  );
}

// Title split into words for a masked, staggered rise. `mark` (a phrase in the title) is set in copper.
export function SplitTitle({ text, mark, as: Tag = 'h1', className }: { text: string; mark?: string; as?: 'h1' | 'h2'; className?: string }) {
  const lines = text.split('\n');
  let n = 0;
  const cjk = /[㐀-鿿]/.test(text);
  const piece = (s: string, marked: boolean, key: string) => {
    const parts = cjk ? [s] : s.split(/(\s+)/).filter(Boolean);
    return parts.map((w, i) => /^\s+$/.test(w)
      ? ' '
      : <span className={`w${marked ? ' mark' : ''}`} key={`${key}-${i}`}><span style={{ ['--i' as any]: n++ }}>{w}</span></span>);
  };
  return (
    <Tag className={`split-title ${className || ''}`} data-reveal="words">
      {lines.map((line, li) => {
        const at = mark ? line.indexOf(mark) : -1;
        const content = at < 0 ? piece(line, false, `${li}`) : [
          ...piece(line.slice(0, at), false, `${li}a`),
          ...piece(mark!, true, `${li}m`),
          ...piece(line.slice(at + mark!.length), false, `${li}b`),
        ];
        return lines.length > 1 ? <span className="line" key={li}>{content}</span> : <span key={li}>{content}</span>;
      })}
    </Tag>
  );
}

export function Arrow() {
  return <svg className="arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

export function CertMark() {
  return <svg className="cert-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" /><circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M14 20.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>;
}

// Coils on the production-tray render that the inspection scan "passes" (x %, y %, resistance).
const SCAN_MARKS: [number, number, string][] = [
  [12.5, 29.6, '2.41'], [29, 25.6, '2.39'], [36.3, 48, '2.40'], [47.3, 40.6, '2.42'], [51.5, 67, '2.40'],
  [60.3, 36, '2.38'], [70.4, 50, '2.41'], [67, 71, '2.40'], [83.4, 78.6, '2.39'], [88.4, 56.4, '2.42'],
];

// Vision-inspection pass over the tray render: a scan line sweeps across and each coil it crosses reports PASS.
export function ScanOverlay({ zh }: { zh: boolean }) {
  return (
    <div className="scan" aria-hidden="true">
      <span className="scan-line" />
      {SCAN_MARKS.map(([x, y, r]) => (
        <span key={`${x}-${y}`} className="scan-mark" style={{ left: `${x}%`, top: `${y}%`, ['--x' as any]: x / 100 }}><b>PASS</b>{r} Ω</span>
      ))}
      <span className="scan-hud"><i />AOI-07 · {zh ? '视觉检测' : 'vision inspection'} · 0.6 s / {zh ? '颗' : 'part'} · {zh ? '不良 0' : '0 rejects'}</span>
    </div>
  );
}

// Two plants, one process: a dot-matrix strip of the region with a shuttle line between them.
export function PlantsMap({ a, b, km }: { a: string; b: string; km: string }) {
  const dots: [number, number][] = [];
  for (let x = 6; x < 1200; x += 12) for (let y = 6; y < 240; y += 12) {
    // a loose coastline: land above a wavy line
    const coast = 170 + 38 * Math.sin(x / 140) + 22 * Math.cos(x / 53) - (x > 760 ? (x - 760) * 0.12 : 0);
    if (y < coast) dots.push([x, y]);
  }
  const route = 'M330 150 C 480 40, 720 30, 880 112';
  return (
    <figure className="plants-map" data-reveal>
      <svg viewBox="0 0 1200 240" aria-hidden="true">
        {dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" className="pm-dot" />)}
        <path d={route} className="pm-route" />
        <path d={route} className="pm-shuttle" pathLength={1} />
        <g className="pm-pin" transform="translate(880 112)"><circle r="16" className="pm-ping" /><circle r="6" /></g>
        <g className="pm-pin" transform="translate(330 150)"><circle r="16" className="pm-ping" /><circle r="6" /></g>
        <text x="880" y="146" textAnchor="middle" className="pm-label">{a}</text>
        <text x="330" y="184" textAnchor="middle" className="pm-label">{b}</text>
        <text x="605" y="40" textAnchor="middle" className="pm-km">{km}</text>
      </svg>
    </figure>
  );
}

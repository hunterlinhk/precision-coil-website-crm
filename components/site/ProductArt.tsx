// Procedural line illustrations of each coil type, drawn from the product's own dimensions.
// Used as product imagery until the client uploads photography.

type Props = { dims: any; shape?: string; title?: string; className?: string };

const CU = 'var(--copper)';
const INK = 'var(--ink)';

function racetrackPath(cx: number, cy: number, w: number, h: number) {
  const r = Math.min(w, h) / 2;
  const x0 = cx - w / 2, y0 = cy - h / 2;
  return `M${x0 + r},${y0} H${x0 + w - r} A${r},${r} 0 0 1 ${x0 + w - r},${y0 + h} H${x0 + r} A${r},${r} 0 0 1 ${x0 + r},${y0} Z`;
}

function Racetrack({ d }: { d: any }) {
  const scale = 300 / Math.max(d.L, d.W * 1.4);
  const W = d.L * scale, H = d.W * scale, iW = d.iL * scale, iH = d.iW * scale;
  const n = 16;
  return (
    <g>
      <path d={racetrackPath(200, 150, W + 18, H + 18)} fill="none" stroke={INK} strokeOpacity=".12" strokeDasharray="2 5" />
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        return <path key={i} d={racetrackPath(200, 150, iW + (W - iW) * t, iH + (H - iH) * t)} fill="none" stroke={CU} strokeWidth={i % 5 === 0 ? 1.6 : 0.9} strokeOpacity={0.55 + 0.45 * t} />;
      })}
      <path d={`M${200 + W / 2 - 6},${150 - H / 4} q 30,-10 52,-46`} fill="none" stroke={CU} strokeWidth="1.4" />
      <path d={`M${200 + W / 2 - 6},${150 - H / 4 + 8} q 36,-6 62,-38`} fill="none" stroke={CU} strokeWidth="1.4" />
    </g>
  );
}

function Cylinder({ d, bobbin }: { d: any; bobbin?: boolean }) {
  const od = bobbin ? d.D : d.OD;
  const len = bobbin ? d.L : d.H;
  const k = 230 / Math.max(od, len * 1.2);
  const rx = (od * k) / 2, ry = rx * 0.32, h = Math.max(len * k, 40);
  const cx = 200, top = 150 - h / 2;
  const turns = Math.min(26, Math.max(8, Math.round(h / 7)));
  const coilRx = bobbin ? rx * 0.82 : rx;
  const inner = bobbin ? (d.d * k) / 2 : ((d.ID || od * 0.9) * k) / 2;
  return (
    <g>
      {bobbin && (
        <>
          <ellipse cx={cx} cy={top - 6} rx={rx} ry={ry} fill="var(--paper)" stroke={INK} strokeOpacity=".55" />
          <path d={`M${cx - rx},${top - 6} v12 a${rx},${ry} 0 0 0 ${2 * rx},0 v-12`} fill="var(--paper-2)" stroke={INK} strokeOpacity=".55" />
        </>
      )}
      <path d={`M${cx - coilRx},${top + 6} V${top + h - 6} a${coilRx},${ry * (coilRx / rx)} 0 0 0 ${2 * coilRx},0 V${top + 6}`} fill="var(--paper)" stroke="none" />
      {Array.from({ length: turns }, (_, i) => {
        const y = top + 8 + (i * (h - 16)) / (turns - 1);
        return <path key={i} d={`M${cx - coilRx},${y} a${coilRx},${ry * (coilRx / rx)} 0 0 0 ${2 * coilRx},0`} fill="none" stroke={CU} strokeWidth={i % 4 === 0 ? 1.5 : 1} />;
      })}
      <line x1={cx - coilRx} y1={top + 6} x2={cx - coilRx} y2={top + h - 6} stroke={CU} strokeOpacity=".7" />
      <line x1={cx + coilRx} y1={top + 6} x2={cx + coilRx} y2={top + h - 6} stroke={CU} strokeOpacity=".7" />
      {bobbin ? (
        <>
          <ellipse cx={cx} cy={top + h + 6} rx={rx} ry={ry} fill="var(--paper-2)" stroke={INK} strokeOpacity=".55" />
          <path d={`M${cx - rx},${top + h - 6} v12`} stroke={INK} strokeOpacity=".55" />
          <path d={`M${cx + rx},${top + h - 6} v12`} stroke={INK} strokeOpacity=".55" />
          <ellipse cx={cx} cy={top - 6} rx={inner} ry={ry * (inner / rx)} fill="var(--paper-2)" stroke={INK} strokeOpacity=".55" />
          <line x1={cx - rx * 0.5} y1={top + h + 6 + ry} x2={cx - rx * 0.5} y2={top + h + 46} stroke={INK} strokeOpacity=".6" strokeWidth="2.4" />
          <line x1={cx + rx * 0.5} y1={top + h + 6 + ry} x2={cx + rx * 0.5} y2={top + h + 46} stroke={INK} strokeOpacity=".6" strokeWidth="2.4" />
        </>
      ) : (
        <>
          <ellipse cx={cx} cy={top + 6} rx={coilRx} ry={ry} fill="var(--paper-2)" stroke={CU} strokeWidth="1.4" />
          <ellipse cx={cx} cy={top + 6} rx={Math.max(inner, coilRx * 0.86)} ry={ry * 0.86} fill="var(--paper)" stroke={CU} strokeOpacity=".6" />
          <path d={`M${cx + coilRx * 0.7},${top + 4} q 20,-30 60,-40`} fill="none" stroke={CU} strokeWidth="1.3" />
        </>
      )}
    </g>
  );
}

function Spiral({ d, module }: { d: any; module?: boolean }) {
  const R = 118, r0 = R * ((d.ID || 10) / (d.OD || 40));
  const turns = 11;
  const pts: string[] = [];
  const steps = turns * 72;
  for (let i = 0; i <= steps; i++) {
    const a = (i / 72) * Math.PI * 2;
    const rr = r0 + ((R - r0) * i) / steps;
    pts.push(`${(200 + rr * Math.cos(a)).toFixed(1)},${(150 + rr * Math.sin(a)).toFixed(1)}`);
  }
  return (
    <g>
      {module ? (
        <rect x={200 - R - 18} y={150 - R - 18} width={(R + 18) * 2} height={(R + 18) * 2} rx="14" fill="var(--paper-2)" stroke={INK} strokeOpacity=".45" />
      ) : (
        <circle cx="200" cy="150" r={R + 10} fill="var(--ferrite)" />
      )}
      {module && Array.from({ length: 16 }, (_, i) => {
        const a1 = (i / 16) * Math.PI * 2 + 0.04, a2 = ((i + 1) / 16) * Math.PI * 2 - 0.04;
        const ro = R + 12, ri = R + 4;
        return <path key={i} d={`M${200 + ri * Math.cos(a1)},${150 + ri * Math.sin(a1)} L${200 + ro * Math.cos(a1)},${150 + ro * Math.sin(a1)} A${ro},${ro} 0 0 1 ${200 + ro * Math.cos(a2)},${150 + ro * Math.sin(a2)} L${200 + ri * Math.cos(a2)},${150 + ri * Math.sin(a2)} A${ri},${ri} 0 0 0 ${200 + ri * Math.cos(a1)},${150 + ri * Math.sin(a1)}`} fill={INK} fillOpacity=".55" />;
      })}
      <polyline points={pts.join(' ')} fill="none" stroke={CU} strokeWidth="3.2" strokeLinejoin="round" />
      <polyline points={pts.join(' ')} fill="none" stroke="#f4c49a" strokeOpacity=".55" strokeWidth=".8" />
      <path d={`M${200 + R},150 h70`} stroke={CU} strokeWidth="3" />
      <path d={`M${200 + r0},152 L${200 + R + 6},166 h64`} fill="none" stroke={CU} strokeWidth="3" />
    </g>
  );
}

function Lra({ d, coin }: { d: any; coin?: boolean }) {
  if (coin) {
    return (
      <g>
        <circle cx="200" cy="150" r="112" fill="var(--paper-2)" stroke={INK} strokeOpacity=".5" />
        <circle cx="200" cy="150" r="96" fill="none" stroke={INK} strokeOpacity=".2" strokeDasharray="3 4" />
        {Array.from({ length: 14 }, (_, i) => <circle key={i} cx="200" cy="150" r={34 + i * 3.6} fill="none" stroke={CU} strokeWidth={i % 4 === 0 ? 1.5 : 0.9} />)}
        <circle cx="200" cy="150" r="26" fill={INK} fillOpacity=".7" />
        <path d="M286,214 l40,34 h36 M276,226 l40,34 h36" fill="none" stroke={INK} strokeOpacity=".6" strokeWidth="2" />
      </g>
    );
  }
  const w = 320, h = Math.max(70, (d.W / d.L) * 320 * 1.6);
  return (
    <g>
      <rect x={200 - w / 2} y={150 - h / 2} width={w} height={h} rx="10" fill="var(--paper-2)" stroke={INK} strokeOpacity=".5" />
      <rect x={200 - w / 2 + 50} y={150 - h / 2 + 10} width={w - 100} height={h - 20} rx="6" fill={INK} fillOpacity=".1" />
      {[-1, 1].map((side) => (
        <g key={side}>
          {Array.from({ length: 9 }, (_, i) => <path key={i} d={racetrackPath(200 + side * 52, 150, 50 + i * 5, h * 0.3 + i * 4)} fill="none" stroke={CU} strokeWidth={i % 4 === 0 ? 1.5 : 0.9} />)}
        </g>
      ))}
      <path d={`M${200 - w / 2 + 14},${150 - h / 2 + 14} q 16,${h / 2 - 14} 0,${h - 28}`} fill="none" stroke={INK} strokeOpacity=".5" />
      <path d={`M${200 + w / 2 - 14},${150 - h / 2 + 14} q -16,${h / 2 - 14} 0,${h - 28}`} fill="none" stroke={INK} strokeOpacity=".5" />
    </g>
  );
}

export function ProductArt({ dims, shape, title, className }: Props) {
  const s = dims?.shape || shape;
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label={title || 'Coil illustration'}>
      {s === 'racetrack' && <Racetrack d={dims} />}
      {s === 'ring' && <Cylinder d={dims} />}
      {s === 'bobbin' && <Cylinder d={dims} bobbin />}
      {s === 'spiral' && <Spiral d={dims} />}
      {s === 'module' && <Spiral d={{ OD: 50, ID: 18 }} module />}
      {s === 'lra' && <Lra d={dims} />}
      {s === 'coin' && <Lra d={dims} coin />}
    </svg>
  );
}

// Default illustration per family when no product is at hand.
export const familyDims: Record<string, any> = {
  racetrack: { shape: 'racetrack', L: 8, W: 6, iL: 5.2, iW: 3.2 },
  ring: { shape: 'ring', OD: 12.3, ID: 11.4, H: 6 },
  bobbin: { shape: 'bobbin', D: 11.5, L: 14, d: 6 },
  spiral: { shape: 'spiral', OD: 50, ID: 20 },
  lra: { shape: 'lra', L: 35, W: 8 },
  module: { shape: 'module' },
};

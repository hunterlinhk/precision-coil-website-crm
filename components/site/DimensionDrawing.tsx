// Engineering-style dimensioned drawing generated from product dimensions (mm).
// Third-angle projection: plan view left, side view right, title block bottom right.

const f = (n: number) => (n >= 10 ? n.toFixed(1) : n.toFixed(2));
const LINE = 'var(--ink)';

function Arrow({ x, y, dir }: { x: number; y: number; dir: 'l' | 'r' | 'u' | 'd' }) {
  const s = 7, w = 2.6;
  const p = dir === 'r' ? `${x},${y} ${x - s},${y - w} ${x - s},${y + w}` : dir === 'l' ? `${x},${y} ${x + s},${y - w} ${x + s},${y + w}`
    : dir === 'd' ? `${x},${y} ${x - w},${y - s} ${x + w},${y - s}` : `${x},${y} ${x - w},${y + s} ${x + w},${y + s}`;
  return <polygon points={p} fill={LINE} />;
}

function HDim({ x1, x2, y, from, label }: { x1: number; x2: number; y: number; from: number; label: string }) {
  return (
    <g className="dim">
      <line x1={x1} y1={from} x2={x1} y2={y + (y > from ? 5 : -5)} />
      <line x1={x2} y1={from} x2={x2} y2={y + (y > from ? 5 : -5)} />
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <Arrow x={x1} y={y} dir="l" /><Arrow x={x2} y={y} dir="r" />
      <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle">{label}</text>
    </g>
  );
}

function VDim({ y1, y2, x, from, label }: { y1: number; y2: number; x: number; from: number; label: string }) {
  return (
    <g className="dim">
      <line x1={from} y1={y1} x2={x + (x > from ? 5 : -5)} y2={y1} />
      <line x1={from} y1={y2} x2={x + (x > from ? 5 : -5)} y2={y2} />
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <Arrow x={x} y={y1} dir="u" /><Arrow x={x} y={y2} dir="d" />
      <text x={x + (x > from ? 8 : -8)} y={(y1 + y2) / 2 + 4} textAnchor={x > from ? 'start' : 'end'}>{label}</text>
    </g>
  );
}

function rt(cx: number, cy: number, w: number, h: number) {
  const r = Math.min(w, h) / 2;
  return `M${cx - w / 2 + r},${cy - h / 2} H${cx + w / 2 - r} A${r},${r} 0 0 1 ${cx + w / 2 - r},${cy + h / 2} H${cx - w / 2 + r} A${r},${r} 0 0 1 ${cx - w / 2 + r},${cy - h / 2} Z`;
}

function Center({ x1, y1, x2, y2 }: any) {
  return <line className="center" x1={x1} y1={y1} x2={x2} y2={y2} />;
}

export function DimensionDrawing({ dims, model }: { dims: any; model: string }) {
  const s = dims?.shape;
  const PX = 190, PY = 190; // plan view centre
  const SX = 500, SY = 190; // side view centre
  const els: React.ReactNode[] = [];

  if (s === 'racetrack' || s === 'lra' || s === 'module') {
    const L = dims.L, W = dims.W, H = dims.H || dims.T || 1;
    const k = Math.min(250 / L, 170 / W);
    const w = L * k, h = W * k;
    const sideK = Math.min(k, 120 / Math.max(H, 0.1));
    const hh = Math.max(H * sideK, 10);
    if (s === 'racetrack') {
      els.push(<path key="o" className="part" d={rt(PX, PY, w, h)} />);
      els.push(<path key="i" className="part" d={rt(PX, PY, dims.iL * k, dims.iW * k)} />);
      els.push(<HDim key="d1" x1={PX - w / 2} x2={PX + w / 2} y={PY - h / 2 - 34} from={PY - h / 2 - 4} label={f(L)} />);
      els.push(<VDim key="d2" y1={PY - h / 2} y2={PY + h / 2} x={PX - w / 2 - 34} from={PX - w / 2 - 4} label={f(W)} />);
      els.push(<HDim key="d3" x1={PX - (dims.iL * k) / 2} x2={PX + (dims.iL * k) / 2} y={PY + h / 2 + 30} from={PY + (dims.iW * k) / 2} label={f(dims.iL)} />);
      els.push(<VDim key="d4" y1={PY - (dims.iW * k) / 2} y2={PY + (dims.iW * k) / 2} x={PX + w / 2 + 30} from={PX + (dims.iL * k) / 2} label={f(dims.iW)} />);
    } else {
      els.push(<rect key="o" className="part" x={PX - w / 2} y={PY - h / 2} width={w} height={h} rx={s === 'module' ? 8 : 3} />);
      if (s === 'module') els.push(<circle key="c" className="hidden" cx={PX} cy={PY} r={Math.min(w, h) * 0.4} />);
      else els.push(<rect key="c" className="hidden" x={PX - w / 2 + 12} y={PY - h / 2 + 6} width={w - 24} height={h - 12} rx="2" />);
      els.push(<HDim key="d1" x1={PX - w / 2} x2={PX + w / 2} y={PY - h / 2 - 34} from={PY - h / 2 - 4} label={f(L)} />);
      els.push(<VDim key="d2" y1={PY - h / 2} y2={PY + h / 2} x={PX - w / 2 - 34} from={PX - w / 2 - 4} label={f(W)} />);
    }
    els.push(<Center key="c1" x1={PX - w / 2 - 14} y1={PY} x2={PX + w / 2 + 14} y2={PY} />, <Center key="c2" x1={PX} y1={PY - h / 2 - 14} x2={PX} y2={PY + h / 2 + 14} />);
    const sw = Math.min(W * k, 150);
    els.push(<rect key="s" className="part" x={SX - sw / 2} y={SY - hh / 2} width={sw} height={hh} rx="1.5" />);
    els.push(<VDim key="sh" y1={SY - hh / 2} y2={SY + hh / 2} x={SX + sw / 2 + 30} from={SX + sw / 2 + 4} label={f(H)} />);
  } else if (s === 'ring' || s === 'spiral' || s === 'coin') {
    const OD = dims.OD || dims.D, ID = dims.ID || 0, H = dims.H || dims.T || 1;
    const k = 200 / OD;
    const R = (OD * k) / 2, r = (ID * k) / 2;
    els.push(<circle key="o" className="part" cx={PX} cy={PY} r={R} />);
    if (r) els.push(<circle key="i" className="part" cx={PX} cy={PY} r={r} />);
    els.push(<Center key="c1" x1={PX - R - 14} y1={PY} x2={PX + R + 14} y2={PY} />, <Center key="c2" x1={PX} y1={PY - R - 14} x2={PX} y2={PY + R + 14} />);
    els.push(<HDim key="d1" x1={PX - R} x2={PX + R} y={PY - R - 30} from={PY} label={`Ø${f(OD)}`} />);
    if (r) els.push(<HDim key="d2" x1={PX - r} x2={PX + r} y={PY + R + 30} from={PY} label={`Ø${f(ID)}`} />);
    const sideK = Math.min(k * 0.6, 120 / OD);
    const sw = OD * sideK, hh = Math.max(Math.min(H * (s === 'ring' ? k * 0.6 : sideK * 2), 160), 8);
    els.push(<rect key="s" className="part" x={SX - sw / 2} y={SY - hh / 2} width={sw} height={hh} />);
    if (r && s === 'ring') {
      const rw = ID * sideK;
      els.push(<line key="h1" className="hidden" x1={SX - rw / 2} y1={SY - hh / 2} x2={SX - rw / 2} y2={SY + hh / 2} />, <line key="h2" className="hidden" x1={SX + rw / 2} y1={SY - hh / 2} x2={SX + rw / 2} y2={SY + hh / 2} />);
    }
    els.push(<VDim key="sh" y1={SY - hh / 2} y2={SY + hh / 2} x={SX + sw / 2 + 30} from={SX + sw / 2 + 4} label={f(H)} />);
  } else if (s === 'bobbin') {
    const D = dims.D, L = dims.L, d = dims.d;
    const k = Math.min(220 / D, 220 / L);
    const R = (D * k) / 2, r = (d * k) / 2, coil = R * 0.8;
    els.push(<circle key="o" className="part" cx={PX} cy={PY} r={R} />, <circle key="cb" className="hidden" cx={PX} cy={PY} r={coil} />, <circle key="i" className="part" cx={PX} cy={PY} r={r} />);
    els.push(<Center key="c1" x1={PX - R - 14} y1={PY} x2={PX + R + 14} y2={PY} />, <Center key="c2" x1={PX} y1={PY - R - 14} x2={PX} y2={PY + R + 14} />);
    els.push(<HDim key="d1" x1={PX - R} x2={PX + R} y={PY - R - 30} from={PY} label={`Ø${f(D)}`} />);
    els.push(<HDim key="d2" x1={PX - r} x2={PX + r} y={PY + R + 30} from={PY} label={`Ø${f(d)}`} />);
    const len = L * k * 0.62, dia = D * k * 0.62, fl = 6;
    els.push(
      <rect key="f1" className="part" x={SX - dia / 2} y={SY - len / 2} width={dia} height={fl} />,
      <rect key="f2" className="part" x={SX - dia / 2} y={SY + len / 2 - fl} width={dia} height={fl} />,
      <rect key="body" className="part fillcu" x={SX - dia * 0.4} y={SY - len / 2 + fl} width={dia * 0.8} height={len - 2 * fl} />,
      <line key="p1" className="part" x1={SX - dia * 0.25} y1={SY + len / 2} x2={SX - dia * 0.25} y2={SY + len / 2 + 26} />,
      <line key="p2" className="part" x1={SX + dia * 0.25} y1={SY + len / 2} x2={SX + dia * 0.25} y2={SY + len / 2 + 26} />,
    );
    els.push(<VDim key="sh" y1={SY - len / 2} y2={SY + len / 2} x={SX + dia / 2 + 30} from={SX + dia / 2 + 4} label={f(L)} />);
  }

  return (
    <svg viewBox="0 0 640 400" className="drawing" role="img" aria-label={`Dimensional drawing of ${model}, millimetres`}>
      <rect x="1" y="1" width="638" height="398" className="frame" />
      {els}
      <g className="tblock">
        <rect x="430" y="340" width="208" height="58" />
        <line x1="430" y1="360" x2="638" y2="360" />
        <line x1="534" y1="360" x2="534" y2="398" />
        <text x="440" y="355" className="tb-model">{model}</text>
        <text x="440" y="376">Unit: mm</text>
        <text x="440" y="391">Not to scale</text>
        <g transform="translate(560 368)" className="proj">
          <circle cx="40" cy="10" r="9" /><circle cx="40" cy="10" r="4" />
          <path d="M2,4 L22,1 L22,19 L2,16 Z" />
          <line x1="0" y1="10" x2="54" y2="10" className="center" />
        </g>
      </g>
    </svg>
  );
}

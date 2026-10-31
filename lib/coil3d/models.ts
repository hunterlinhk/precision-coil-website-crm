// Procedural 3D models of every product family, in millimetres.
// Shared by the offline renderer (scripts/render) and the live viewers on the site.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------------------------------------------------------------- random
function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

// ---------------------------------------------------------------- textures
// Height-field → normal map, generated in code so no image files are needed.
function normalMapFromHeight(w: number, h: number, height: (u: number, v: number) => number, strength = 2) {
  const data = new Uint8Array(w * h * 4);
  const H = (x: number, y: number) => height(((x % w) + w) % w / w, ((y % h) + h) % h / h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
    const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const n = new THREE.Vector3(-dx, -dy, 1).normalize();
    const i = (y * w + x) * 4;
    data[i] = (n.x * 0.5 + 0.5) * 255; data[i + 1] = (n.y * 0.5 + 0.5) * 255; data[i + 2] = (n.z * 0.5 + 0.5) * 255; data[i + 3] = 255;
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

let _litz: THREE.DataTexture | null = null;
const litzNormal = () => (_litz ||= normalMapFromHeight(128, 64, (u, v) => Math.abs(Math.sin((u * 6 + v * 2) * Math.PI * 2)) * 0.6, 3));
let _grooves: THREE.DataTexture | null = null;
const grooveNormal = () => (_grooves ||= normalMapFromHeight(8, 256, (_u, v) => Math.sqrt(Math.abs(Math.sin(v * Math.PI * 64))), 4));
let _brushed: THREE.DataTexture | null = null;
const brushedNormal = () => (_brushed ||= (() => {
  const r = rng(7); const rows = Array.from({ length: 256 }, () => r());
  return normalMapFromHeight(256, 256, (_u, v) => rows[Math.floor(v * 256) % 256] * 0.25, 1);
})());

// ---------------------------------------------------------------- materials
export function materials() {
  // Enamelled magnet wire: saturated copper under a glossy varnish coat.
  const copperTone = new THREE.Color().setRGB(0.95, 0.38, 0.15, THREE.LinearSRGBColorSpace);
  const copper = new THREE.MeshPhysicalMaterial({
    color: copperTone, metalness: 1, roughness: 0.17, clearcoat: 1, clearcoatRoughness: 0.03, vertexColors: true,
  });
  const copperPolished = new THREE.MeshPhysicalMaterial({ color: 0xf0a77c, metalness: 1, roughness: 0.32 });
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0x8a3d12, metalness: 0.2, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04 });
  const tin = new THREE.MeshPhysicalMaterial({ color: 0xd4d6d8, metalness: 1, roughness: 0.28 });
  const silver = new THREE.MeshPhysicalMaterial({ color: 0xe6e7e8, metalness: 1, roughness: 0.16 });
  const plasticBlack = new THREE.MeshPhysicalMaterial({ color: 0x17181a, metalness: 0, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const plasticLcp = new THREE.MeshPhysicalMaterial({ color: 0xe8e2d2, metalness: 0, roughness: 0.48, sheen: 0.2 });
  const ferrite = new THREE.MeshPhysicalMaterial({ color: 0x2b2d2f, metalness: 0.15, roughness: 0.78 });
  const nanocrystal = new THREE.MeshPhysicalMaterial({ color: 0x34373b, metalness: 0.7, roughness: 0.34 });
  const nickel = new THREE.MeshPhysicalMaterial({ color: 0xd2d6da, metalness: 1, roughness: 0.3 });
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xc9ccce, metalness: 1, roughness: 0.32, normalMap: brushedNormal(), normalScale: new THREE.Vector2(0.4, 0.4) });
  const polyimide = new THREE.MeshPhysicalMaterial({ color: 0xbf6a14, metalness: 0, roughness: 0.3, clearcoat: 0.8, transmission: 0.25, thickness: 0.1 });
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xe6b860, metalness: 1, roughness: 0.22 });
  const pcb = new THREE.MeshPhysicalMaterial({ color: 0x141619, metalness: 0, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xb59a7a, roughness: 0.55 });
  const icBlack = new THREE.MeshPhysicalMaterial({ color: 0x1b1c1e, roughness: 0.7 });
  const wireRed = new THREE.MeshPhysicalMaterial({ color: 0xa3141b, roughness: 0.4, clearcoat: 0.6 });
  const wireBlack = new THREE.MeshPhysicalMaterial({ color: 0x111213, roughness: 0.4, clearcoat: 0.6 });
  const anodized = new THREE.MeshPhysicalMaterial({ color: 0x2a2c30, metalness: 0.8, roughness: 0.38 });
  const fabric = new THREE.MeshPhysicalMaterial({ color: 0x3a3b3d, roughness: 0.95, sheen: 1, sheenColor: new THREE.Color(0x777777), sheenRoughness: 0.8 });
  const aluWhite = new THREE.MeshPhysicalMaterial({ color: 0xe9e9e7, metalness: 0.2, roughness: 0.42 });
  const trayBlack = new THREE.MeshPhysicalMaterial({ color: 0x1a1b1d, roughness: 0.62, metalness: 0 });
  const litz = new THREE.MeshPhysicalMaterial({ color: copperTone, metalness: 1, roughness: 0.34, clearcoat: 0.8, clearcoatRoughness: 0.15, normalMap: litzNormal(), normalScale: new THREE.Vector2(0.9, 0.9), vertexColors: true });
  const spoolCopper = new THREE.MeshPhysicalMaterial({ color: copperTone, metalness: 1, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, normalMap: grooveNormal(), normalScale: new THREE.Vector2(1.2, 1.2) });
  return { copper, copperPolished, enamel, tin, silver, plasticBlack, plasticLcp, ferrite, nanocrystal, nickel, steel, polyimide, gold, pcb, ceramic, icBlack, wireRed, wireBlack, anodized, fabric, aluWhite, trayBlack, litz, spoolCopper };
}
export type Mats = ReturnType<typeof materials>;

// ---------------------------------------------------------------- curves
// Rounded rectangle in the XZ plane at height y (stadium when r = w/2).
class RoundRectCurve extends THREE.Curve<THREE.Vector3> {
  constructor(public L: number, public W: number, public r: number, public y: number) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    const { L, W, y } = this;
    const r = Math.min(this.r, W / 2, L / 2);
    const sx = L - 2 * r, sz = W - 2 * r;
    const per = 2 * sx + 2 * sz + 2 * Math.PI * r;
    let d = (t % 1) * per;
    const seg = (len: number) => { if (d <= len) return true; d -= len; return false; };
    const hx = L / 2, hz = W / 2;
    // start at middle of +Z side going +X
    if (seg(sx / 2)) return target.set(d, y, hz);
    if (seg((Math.PI / 2) * r)) { const a = d / r; return target.set(hx - r + Math.sin(a) * r, y, hz - r + Math.cos(a) * r); }
    if (seg(sz)) return target.set(hx, y, hz - r - d);
    if (seg((Math.PI / 2) * r)) { const a = d / r; return target.set(hx - r + Math.cos(a) * r, y, -hz + r - Math.sin(a) * r); }
    if (seg(sx)) return target.set(hx - r - d, y, -hz);
    if (seg((Math.PI / 2) * r)) { const a = d / r; return target.set(-hx + r - Math.sin(a) * r, y, -hz + r - Math.cos(a) * r); }
    if (seg(sz)) return target.set(-hx, y, -hz + r + d);
    if (seg((Math.PI / 2) * r)) { const a = d / r; return target.set(-hx + r - Math.cos(a) * r, y, hz - r + Math.sin(a) * r); }
    return target.set(-hx + r + d, y, hz);
  }
}

class SpiralCurve extends THREE.Curve<THREE.Vector3> {
  constructor(public r0: number, public r1: number, public turns: number, public y = 0, public square = 0) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    const r = this.r0 + (this.r1 - this.r0) * t;
    let x = Math.cos(a), z = Math.sin(a);
    if (this.square) {
      // superellipse: rounded square spiral
      const p = 2 + this.square * 6;
      const k = Math.pow(Math.pow(Math.abs(x), p) + Math.pow(Math.abs(z), p), -1 / p);
      x *= k; z *= k;
    }
    return target.set(x * r, this.y, z * r);
  }
}

class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(public R: number, public pitch: number, public turns: number) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    return target.set(Math.cos(a) * this.R, t * this.turns * this.pitch, Math.sin(a) * this.R);
  }
}

const tube = (curve: THREE.Curve<THREE.Vector3>, radius: number, segs: number, radial = 8, closed = false) =>
  new THREE.TubeGeometry(curve, segs, radius, radial, closed);
const path = (pts: number[][], radius: number, segs = 64, radial = 8) =>
  tube(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal'), radius, segs, radial);

// Tint a geometry by writing a vertex colour (used for subtle turn-to-turn variation).
function tint(g: THREE.BufferGeometry, k: number) {
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3).fill(k);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
const merge = (gs: THREE.BufferGeometry[]) => {
  const out = mergeGeometries(gs, false)!;
  gs.forEach((g) => g.dispose());
  return out;
};

// ---------------------------------------------------------------- coil bodies
type Winding = { turns: number; layers: number; d: number };

// Racetrack / rounded-rectangle self-bonding coil. Returns merged geometry.
export function racetrackCoilGeometry(o: { L: number; W: number; iL: number; iW: number; H: number; turns?: number; corner?: number; seed?: number; quality?: number }) {
  const turns = o.turns ?? 12;
  const t = Math.min((o.L - o.iL) / 2, (o.W - o.iW) / 2);
  const d = t / (turns + 0.5);
  const layers = Math.max(2, Math.round((o.H - d) / (d * 0.866)) + 1);
  const r0 = o.corner ?? Math.min(o.iW / 2, o.iL / 2);
  const q = o.quality ?? 1;
  const rand = rng(o.seed ?? 3);
  const gs: THREE.BufferGeometry[] = [];
  for (let j = 0; j < layers; j++) {
    const shift = j % 2 ? 0.5 : 0;
    const n = j % 2 ? turns - 1 : turns;
    for (let i = 0; i < n; i++) {
      const off = d * (i + 0.5 + shift);
      const L = o.iL + 2 * off, W = o.iW + 2 * off, r = r0 + off;
      const y = d / 2 + j * d * 0.866;
      const per = 2 * (L + W);
      const g = tube(new RoundRectCurve(L, W, r, y), d * 0.47, Math.max(48, Math.round((per / d) * 1.2 * q)), Math.round(8 * q), true);
      gs.push(tint(g, 0.86 + rand() * 0.2));
    }
  }
  return { geometry: merge(gs), winding: { turns, layers, d } as Winding };
}

// Two lead wires leaving the outer turn.
function leads(L: number, W: number, d: number, h: number, mats: Mats, opts: { len?: number; spread?: number; side?: 'x' | 'z' } = {}) {
  const g = new THREE.Group();
  const len = opts.len ?? Math.max(L, W) * 0.38;
  const s = opts.spread ?? d * 2.4;
  for (const k of [-1, 1]) {
    const x0 = L / 2 - d * 0.6, z0 = k * s;
    const pts = [[x0 - d * 3, h * 0.9, z0], [x0, h * 0.95, z0], [x0 + len * 0.35, h * 1.1, z0 * 1.4], [x0 + len, h * 0.6 + len * 0.18, z0 * 2.2]];
    const wire = path(pts, d * 0.45, 48, 8);
    tint(wire, 1);
    g.add(new THREE.Mesh(wire, mats.copper));
    const end = pts[pts.length - 1];
    const tip = new THREE.Mesh(new THREE.SphereGeometry(d * 0.55, 12, 8), mats.tin);
    tip.position.set(end[0], end[1], end[2]);
    g.add(tip);
  }
  return g;
}

export function racetrackCoil(o: { L: number; W: number; iL: number; iW: number; H: number; turns?: number; corner?: number }, mats: Mats, quality = 1) {
  const { geometry, winding } = racetrackCoilGeometry({ ...o, quality });
  const g = new THREE.Group();
  const m = new THREE.Mesh(geometry, mats.copper);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  const top = winding.d / 2 + (winding.layers - 1) * winding.d * 0.866;
  g.add(leads(o.L, o.W, winding.d, top, mats));
  return g;
}

// Short cylindrical coil from stacked rings (voice coils, sensors).
function ringStack(R: number, rows: number, layers: number, d: number, mats: Mats, y0 = 0, q = 1, mat?: THREE.Material) {
  const rand = rng(11);
  const gs: THREE.BufferGeometry[] = [];
  for (let l = 0; l < layers; l++) for (let i = 0; i < rows; i++) {
    const rr = R + d * (l + 0.5);
    const g = new THREE.TorusGeometry(rr, d * 0.47, Math.round(8 * q), Math.max(64, Math.round(rr / d * 6 * q)));
    g.rotateX(Math.PI / 2);
    g.translate(0, y0 + d * (i + 0.5 + (l % 2) * 0.5), 0);
    gs.push(tint(g, 0.86 + rand() * 0.2));
  }
  const mesh = new THREE.Mesh(merge(gs), mat || mats.copper);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function voiceCoil(o: { OD: number; ID: number; H: number }, mats: Mats, q = 1) {
  const g = new THREE.Group();
  const d = Math.max((o.OD - o.ID) / 2 / 2, o.H / 16);
  const rows = Math.round(o.H / d);
  g.add(ringStack(o.ID / 2, rows, 2, d, mats, 0, q));
  for (const k of [-1, 1]) {
    const a = 0.25 * k;
    const x = Math.cos(a) * (o.OD / 2), z = Math.sin(a) * (o.OD / 2);
    const w = new THREE.Mesh(tint(path([[x, o.H * 0.8, z], [x * 1.15, o.H * 1.05, z * 1.2], [x * 1.6, o.H * 1.4, z * 1.8]], d * 0.45), 1), mats.copper);
    g.add(w);
  }
  return g;
}

export function rfInductor(o: { OD: number; H: number }, mats: Mats) {
  const g = new THREE.Group();
  const turns = 6, wireR = o.OD * 0.07;
  const R = o.OD / 2 - wireR;
  const pitch = (o.H - wireR * 2) / turns;
  const helix = new THREE.Mesh(tube(new HelixCurve(R, pitch, turns), wireR, 360, 12), mats.silver);
  helix.position.y = o.OD * 0.9;
  helix.rotation.z = Math.PI / 2;
  helix.position.x = (turns * pitch) / 2;
  helix.castShadow = true;
  g.add(helix);
  // straight leads bent down
  const y = o.OD * 0.9;
  const xL = -(turns * pitch) / 2, xR = (turns * pitch) / 2;
  g.add(new THREE.Mesh(path([[xL, y - R, 0], [xL - R * 0.6, y - R * 0.8, 0], [xL - R * 0.8, y - R * 1.6, 0], [xL - R * 0.8, 0.05, 0]], wireR, 40, 12), mats.silver));
  g.add(new THREE.Mesh(path([[xR, y + R, 0], [xR + R * 0.6, y + R * 0.4, 0], [xR + R * 0.8, y - R * 1.6, 0], [xR + R * 0.8, 0.05, 0]], wireR, 40, 12), mats.silver));
  g.children.forEach((c) => { c.castShadow = true; });
  return g;
}

export function telecoil(o: { L: number; W: number; iL: number; iW: number; H: number }, mats: Mats, q = 1) {
  const g = racetrackCoil({ ...o, turns: 10, corner: o.iW / 2 }, mats, q);
  const rod = new THREE.Mesh(new RoundedBoxGeometry(o.L * 1.5, o.iW * 0.8, o.iW * 0.8, 3, o.iW * 0.2), mats.ferrite);
  rod.position.y = o.H * 0.5;
  g.add(rod);
  return g;
}

// Bobbin (LCP or black) with winding between flanges.
export function bobbinCoil(o: { D: number; L: number; d: number }, mats: Mats, opts: { white?: boolean; pins?: boolean; wound?: number } = {}, q = 1) {
  const g = new THREE.Group();
  const fl = Math.max(o.L * 0.07, 0.6);
  const Rf = o.D / 2, Rc = o.d / 2 + Math.max(0.4, o.D * 0.04);
  const prof: THREE.Vector2[] = [
    [o.d / 2, 0], [Rf - 0.2, 0], [Rf, 0.2], [Rf, fl - 0.2], [Rf - 0.2, fl], [Rc, fl], [Rc, o.L - fl], [Rf - 0.2, o.L - fl], [Rf, o.L - fl + 0.2], [Rf, o.L - 0.2], [Rf - 0.2, o.L], [o.d / 2, o.L], [o.d / 2, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bob = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), opts.white ? mats.plasticLcp : mats.plasticBlack);
  bob.castShadow = true; bob.receiveShadow = true;
  g.add(bob);
  // winding: visible outer layers as rings, rest as a filled copper core
  const space = o.L - 2 * fl;
  const outer = Rc + (Rf - Rc) * (opts.wound ?? 0.82);
  const d = Math.max(space / 34, 0.12);
  const rows = Math.floor(space / d) - 1;
  const fullRows = opts.wound !== undefined && opts.wound < 0.8 ? Math.round(rows * 0.6) : rows;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(outer - d, outer - d, space - 0.02, 96), mats.copper);
  tint(core.geometry, 0.8);
  core.position.y = fl + space / 2;
  g.add(core);
  const rings = ringStack(outer - d * 1.5, fullRows, 2, d, mats, fl + 0.02, q);
  g.add(rings);
  if (opts.pins) {
    for (const k of [-1, 1]) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.64, o.L * 0.45, 0.64), mats.tin);
      pin.position.set(k * Rf * 0.55, -o.L * 0.22, Rf * 0.25);
      pin.castShadow = true;
      g.add(pin);
      const lug = new THREE.Mesh(new THREE.BoxGeometry(o.D * 0.18, fl, o.D * 0.22), opts.white ? mats.plasticLcp : mats.plasticBlack);
      lug.position.set(k * Rf * 0.55, fl / 2, Rf * 0.25);
      g.add(lug);
    }
  }
  return g;
}

export function solenoidCoil(o: { D: number; L: number; d: number }, mats: Mats) {
  const g = new THREE.Group();
  const R = o.D / 2, f = 1.4;
  const prof = [[o.d / 2, 0], [R - f, 0], [R, f], [R, o.L - f], [R - f, o.L], [o.d / 2, o.L], [o.d / 2, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), mats.plasticBlack);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const box = new THREE.Mesh(new RoundedBoxGeometry(o.D * 0.62, o.L * 0.8, o.D * 0.5, 4, 1.2), mats.plasticBlack);
  box.position.set(0, o.L * 0.45, R + o.D * 0.12);
  box.castShadow = true;
  g.add(box);
  for (const k of [-1, 1]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.4, 6.3), mats.tin);
    blade.position.set(k * o.D * 0.14, o.L * 0.45, R + o.D * 0.4);
    blade.rotation.y = Math.PI / 2;
    g.add(blade);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(o.d / 2 + 0.6, 0.35, 12, 64), mats.steel);
  ring.rotation.x = Math.PI / 2; ring.position.y = o.L + 0.05;
  g.add(ring);
  return g;
}

// Magnet ring of n segments (Qi2 MPP alignment).
function magnetRing(r0: number, r1: number, h: number, n: number, mats: Mats) {
  const gs: THREE.BufferGeometry[] = [];
  const gap = 0.025;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + gap, a1 = ((i + 1) / n) * Math.PI * 2 - gap;
    const s = new THREE.Shape();
    s.absarc(0, 0, r1, a0, a1, false);
    s.absarc(0, 0, r0, a1, a0, true);
    const e = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: 12 });
    e.rotateX(-Math.PI / 2);
    gs.push(e);
  }
  const m = new THREE.Mesh(merge(gs), mats.nickel);
  m.castShadow = true;
  return m;
}

export function spiralCoil(o: { OD: number; ID: number; T: number; turns?: number; square?: number }, mats: Mats, q = 1) {
  const turns = o.turns ?? 11;
  const R = o.OD / 2, r0 = o.ID / 2;
  const pitch = (R - r0) / turns;
  const wireR = pitch * 0.46;
  const curve = new SpiralCurve(r0 + wireR, R - wireR, turns, wireR, o.square || 0);
  const geo = tube(curve, wireR, Math.round(turns * 140 * q), Math.round(10 * q));
  tint(geo, 1);
  const len = curve.getLength();
  (geo.attributes.uv as THREE.BufferAttribute).array.forEach((_, i, arr: any) => { if (i % 2 === 0) arr[i] *= len / (wireR * 6); });
  const m = new THREE.Mesh(geo, mats.litz);
  m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group();
  g.add(m);
  // leads: one from the outer end, one tucked under from the centre
  const end = curve.getPoint(1);
  g.add(new THREE.Mesh(tint(path([[end.x, wireR, end.z], [end.x + R * 0.25, wireR, end.z + R * 0.05], [end.x + R * 0.6, wireR, end.z + R * 0.08]], wireR, 30, 10), 1), mats.litz));
  const start = curve.getPoint(0);
  g.add(new THREE.Mesh(tint(path([[start.x, wireR, start.z], [start.x, -wireR * 0.6, start.z], [R * 0.6, -wireR * 0.9, start.z + wireR * 2.5], [R + R * 0.6, -wireR * 0.9, start.z + wireR * 3]], wireR, 40, 10), 1), mats.litz));
  return { group: g, wireR };
}

export function wpcTx(o: { OD: number; ID: number; T: number }, mats: Mats, opts: { magnets?: boolean } = {}, q = 1) {
  const g = new THREE.Group();
  const R = o.OD / 2;
  const fer = new THREE.Mesh(new THREE.CylinderGeometry(R + 1.2, R + 1.2, 0.8, 128), mats.ferrite);
  fer.position.y = -0.4; fer.receiveShadow = true; fer.castShadow = true;
  g.add(fer);
  const { group, wireR } = spiralCoil(o, mats, q);
  group.position.y = 0.02;
  g.add(group);
  if (opts.magnets) {
    const ring = magnetRing(R + 1.6, R + 4.2, 1.2 + wireR, 18, mats);
    ring.position.y = -0.8;
    g.add(ring);
  }
  return g;
}

export function rxNfc(o: { OD: number; ID: number; T: number }, mats: Mats, q = 1) {
  const g = new THREE.Group();
  const S = o.OD;
  const sheet = new THREE.Mesh(new RoundedBoxGeometry(S, 0.2, S, 4, 1.5), mats.nanocrystal);
  sheet.position.y = -0.1; sheet.receiveShadow = true;
  g.add(sheet);
  const turns = 14, R = S * 0.36, r0 = S * 0.16;
  const wireR = ((R - r0) / turns) * 0.42;
  const coil = new THREE.Mesh(tint(tube(new SpiralCurve(r0, R, turns, wireR * 0.4, 0.15), wireR, Math.round(turns * 140 * q), 8), 1), mats.copper);
  coil.scale.y = 0.35; coil.castShadow = true;
  g.add(coil);
  // NFC loop: 3 rounded-square turns near the edge
  for (let i = 0; i < 3; i++) {
    const s = S * 0.92 - i * wireR * 3.2;
    const loop = new THREE.Mesh(tint(tube(new RoundRectCurve(s, s, 3, wireR * 0.4), wireR, 260, 8, true), 1), mats.copper);
    loop.scale.y = 0.35;
    g.add(loop);
  }
  const tail = new THREE.Mesh(new RoundedBoxGeometry(S * 0.18, 0.12, S * 0.35, 2, 0.6), mats.polyimide);
  tail.position.set(S * 0.28, 0, S / 2 + S * 0.15);
  g.add(tail);
  for (let i = 0; i < 4; i++) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(S * 0.025, 0.16, S * 0.06), mats.gold);
    pad.position.set(S * 0.28 + (i - 1.5) * S * 0.04, 0.02, S / 2 + S * 0.27);
    g.add(pad);
  }
  return g;
}

export function lraX(o: { L: number; W: number; H: number }, mats: Mats) {
  const g = new THREE.Group();
  const can = new THREE.Mesh(new RoundedBoxGeometry(o.L, o.H, o.W, 6, Math.min(o.H, o.W) * 0.28), mats.steel);
  can.position.y = o.H / 2; can.castShadow = true; can.receiveShadow = true;
  g.add(can);
  // laser weld seam & embossed rib
  const rib = new THREE.Mesh(new RoundedBoxGeometry(o.L * 0.7, 0.08, o.W * 0.5, 2, 0.04), mats.steel);
  rib.position.y = o.H + 0.02;
  g.add(rib);
  const tail = new THREE.Mesh(new RoundedBoxGeometry(o.W * 0.9, 0.12, o.W * 0.55, 2, 0.05), mats.polyimide);
  tail.position.set(o.L / 2 + o.W * 0.42, 0.12, 0);
  g.add(tail);
  for (const k of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(o.W * 0.25, 0.14, o.W * 0.18), mats.gold);
    pad.position.set(o.L / 2 + o.W * 0.62, 0.16, k * o.W * 0.13);
    g.add(pad);
  }
  return g;
}

export function lraCoin(o: { D: number; H: number }, mats: Mats) {
  const g = new THREE.Group();
  const R = o.D / 2, b = 0.25;
  const prof = [[0, 0], [R - b, 0], [R, b], [R, o.H - b], [R - b, o.H], [0, o.H]].map(([x, y]) => new THREE.Vector2(x, y));
  const can = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), mats.steel);
  can.castShadow = true; can.receiveShadow = true;
  g.add(can);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 0.7, 0.05, 8, 96), mats.steel);
  ring.rotation.x = Math.PI / 2; ring.position.y = o.H + 0.01;
  g.add(ring);
  const mats2 = [mats.wireRed, mats.wireBlack];
  [-1, 1].forEach((k, i) => {
    const z = k * 0.45;
    const pts = [[R * 0.6, 0.5, z], [R + 1.5, 0.6, z * 1.2], [R + 4, 0.4, z * 2.4 + k * 0.6], [R + 7.5, 0.2, z * 2 + k * 1.6]];
    const w = new THREE.Mesh(path(pts, 0.22, 48, 10), mats2[i]);
    w.castShadow = true;
    g.add(w);
    const tipPts = pts[pts.length - 1];
    const tip = new THREE.Mesh(path([tipPts, [tipPts[0] + 1.6, tipPts[1], tipPts[2] + k * 0.2]], 0.12, 8, 8), mats.tin);
    g.add(tip);
  });
  return g;
}

export function qi2Module(o: { L: number; W: number; H: number }, mats: Mats, q = 1, explode = 0) {
  const g = new THREE.Group();
  const S = o.L;
  const board = new THREE.Mesh(new RoundedBoxGeometry(S, 1.2, S, 4, 2), mats.pcb);
  board.position.y = 0.6; board.castShadow = true; board.receiveShadow = true;
  g.add(board);
  // components on the board's top face, visible around the coil and when exploded
  const r = rng(5);
  const comps = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    const big = i < 3;
    const w = big ? 5 + r() * 3 : 1 + r() * 1.6, d = big ? 5 : 0.6 + r() * 1;
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, big ? 1 : 0.6, d, 2, 0.1), big ? mats.icBlack : r() > 0.5 ? mats.ceramic : mats.icBlack);
    const a = r() * Math.PI * 2, rr = S * (0.12 + r() * 0.3);
    m.position.set(Math.cos(a) * rr, 1.2 + (big ? 0.5 : 0.3), Math.sin(a) * rr);
    m.rotation.y = Math.round(r() * 2) * (Math.PI / 2);
    comps.add(m);
  }
  g.add(comps);
  const usb = new THREE.Mesh(new RoundedBoxGeometry(9, 3.2, 7.4, 4, 1.5), mats.steel);
  usb.position.set(0, 2.2, S / 2 - 2.6);
  g.add(usb);
  const coilStack = new THREE.Group();
  const fer = new THREE.Mesh(new THREE.CylinderGeometry(26.2, 26.2, 0.9, 128), mats.ferrite);
  fer.castShadow = true; fer.receiveShadow = true;
  const coil = spiralCoil({ OD: 50, ID: 20, T: 3 }, mats, q).group;
  const mags = magnetRing(27.5, 30.4, 1.4, 18, mats);
  fer.position.y = 0;
  coil.position.y = 0.45 + explode * 9;
  mags.position.y = 0.2 + explode * 18;
  coilStack.add(fer, coil, mags);
  coilStack.position.y = 1.2 + 2.4 + explode * 10;
  g.add(coilStack);
  if (explode) { comps.position.y = 0; }
  return g;
}

export function station(o: { L: number; W: number; H: number }, mats: Mats, q = 1) {
  // Charging-station platform shown with its top cover off: three coils on ferrite in a white chassis.
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(o.L, o.H, o.W, 8, o.H * 0.45), mats.aluWhite);
  base.position.y = o.H / 2; base.castShadow = true; base.receiveShadow = true;
  g.add(base);
  const pads: [number, number, number][] = [[-o.L * 0.25, 54, 22], [o.L * 0.13, 30, 10], [o.L * 0.36, 22, 8]];
  for (const [x, od, id] of pads) {
    const well = new THREE.Mesh(new THREE.CylinderGeometry(od / 2 + 2.4, od / 2 + 2.4, 0.6, 96), mats.plasticBlack);
    well.position.set(x, o.H + 0.05, 0); well.receiveShadow = true;
    g.add(well);
    const fer = new THREE.Mesh(new THREE.CylinderGeometry(od / 2 + 1, od / 2 + 1, 0.8, 96), mats.ferrite);
    fer.position.set(x, o.H + 0.6, 0);
    g.add(fer);
    const { group } = spiralCoil({ OD: od, ID: id, T: 2, turns: od > 40 ? 11 : 9 }, mats, q);
    group.position.set(x, o.H + 1.02, 0);
    g.add(group);
  }
  return g;
}

// ---------------------------------------------------------------- dispatch
// Pick a model from a product's dims (shape + optional model hint) or slug.
export function productModel(dims: any, slug: string, mats: Mats, q = 1): THREE.Group {
  const s = dims?.shape;
  if (slug.includes('rf')) return rfInductor({ OD: dims.OD || 3.5, H: dims.H || 4.2 }, mats);
  if (slug.includes('-tc')) return telecoil({ L: dims.L, W: dims.W, iL: dims.iL, iW: dims.iW, H: dims.H }, mats, q);
  if (slug.includes('-sv')) return solenoidCoil({ D: dims.D, L: dims.L, d: dims.d }, mats);
  if (slug.includes('-rx')) return rxNfc({ OD: dims.OD, ID: dims.ID, T: dims.T }, mats, q);
  if (slug.includes('-mpp')) return wpcTx({ OD: dims.OD, ID: dims.ID, T: dims.T }, mats, { magnets: true }, q);
  if (slug.includes('st3')) return station({ L: 180, W: 90, H: 14 }, mats, q);
  switch (s) {
    case 'racetrack': return racetrackCoil({ L: dims.L, W: dims.W, iL: dims.iL, iW: dims.iW, H: Math.max(dims.H, 0.5), turns: dims.W < 5 ? 9 : 12 }, mats, q);
    case 'ring': return voiceCoil({ OD: dims.OD, ID: dims.ID, H: dims.H }, mats, q);
    case 'bobbin': return bobbinCoil({ D: dims.D, L: dims.L, d: dims.d }, mats, { white: slug.includes('rl'), pins: slug.includes('rl') }, q);
    case 'spiral': return wpcTx({ OD: dims.OD, ID: dims.ID, T: dims.T }, mats, {}, q);
    case 'lra': return lraX({ L: dims.L, W: dims.W, H: dims.H }, mats);
    case 'coin': return lraCoin({ D: dims.D, H: dims.H }, mats);
    case 'module': return qi2Module({ L: dims.L, W: dims.W, H: dims.H }, mats, q);
    default: return racetrackCoil({ L: 8, W: 6, iL: 5.2, iW: 3.2, H: 0.9 }, mats, q);
  }
}

export { RoundRectCurve, SpiralCurve, HelixCurve, rng, tint, merge, tube, path, magnetRing, ringStack };

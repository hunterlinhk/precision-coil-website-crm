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
  const nanocrystal = new THREE.MeshPhysicalMaterial({ color: 0xbdbcb5, metalness: 0.75, roughness: 0.5, normalMap: brushedNormal(), normalScale: new THREE.Vector2(0.25, 0.25) });
  const nanoCore = new THREE.MeshPhysicalMaterial({ color: 0x2c2e31, metalness: 0.35, roughness: 0.55 });
  // Litz bundles as they really look: many fine strands, paler and pinker than solid enamelled wire.
  const litzPale = new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(0.96, 0.5, 0.33, THREE.LinearSRGBColorSpace), metalness: 0.85, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.25, normalMap: litzNormal(), normalScale: new THREE.Vector2(1.1, 1.1), vertexColors: true });
  const kapton = new THREE.MeshPhysicalMaterial({ color: 0xe0a02a, metalness: 0, roughness: 0.25, clearcoat: 0.9, transmission: 0.35, thickness: 0.05 });
  const carrierBlack = new THREE.MeshPhysicalMaterial({ color: 0x1c1d20, metalness: 0, roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.6 });
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
  return { copper, copperPolished, enamel, tin, silver, plasticBlack, plasticLcp, ferrite, nanocrystal, nanoCore, litzPale, kapton, carrierBlack, nickel, steel, polyimide, gold, pcb, ceramic, icBlack, wireRed, wireBlack, anodized, fabric, aluWhite, trayBlack, litz, spoolCopper };
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
  const helix = new THREE.Mesh(tint(tube(new HelixCurve(R, pitch, turns), wireR, 360, 12), 1), mats.copper);
  helix.position.y = o.OD * 0.9;
  helix.rotation.z = Math.PI / 2;
  helix.position.x = (turns * pitch) / 2;
  helix.castShadow = true;
  g.add(helix);
  // straight leads bent down
  const y = o.OD * 0.9;
  const xL = -(turns * pitch) / 2, xR = (turns * pitch) / 2;
  g.add(new THREE.Mesh(tint(path([[xL, y - R, 0], [xL - R * 0.6, y - R * 0.8, 0], [xL - R * 0.8, y - R * 1.6, 0], [xL - R * 0.8, R * 1.2, 0]], wireR, 40, 12), 1), mats.copper));
  g.add(new THREE.Mesh(tint(path([[xR, y + R, 0], [xR + R * 0.6, y + R * 0.4, 0], [xR + R * 0.8, y - R * 1.6, 0], [xR + R * 0.8, R * 1.2, 0]], wireR, 40, 12), 1), mats.copper));
  for (const x of [xL - R * 0.8, xR + R * 0.8]) { // tinned, stripped ends
    const t = new THREE.Mesh(new THREE.CylinderGeometry(wireR, wireR, R * 1.2, 16), mats.tin);
    t.position.set(x, R * 0.6, 0); g.add(t);
  }
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

// ---------------------------------------------------------------- lens carriers (VCM)
// Octagon, across-flats S, corners cut by c, centred in XY (used as an extrusion profile).
function octPoints(S: number, c: number): [number, number][] {
  const h = S / 2;
  return [[h - c, h], [-h + c, h], [-h, h - c], [-h, -h + c], [-h + c, -h], [h - c, -h], [h, -h + c], [h, h - c]];
}
function octShape(S: number, c: number, holeR = 0) {
  const pts = octPoints(S, c);
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  if (holeR) { const hole = new THREE.Path(); hole.absarc(0, 0, holeR, 0, Math.PI * 2, true); sh.holes.push(hole); }
  return sh;
}
// Closed, slightly rounded octagon in the XZ plane at height y: the path a turn takes around the carrier.
function octCurve(S: number, c: number, y: number, round = 0.35) {
  const pts = octPoints(S, c);
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[i], n = pts[(i + 1) % pts.length];
    for (const k of [round, 0.5 * round, 0]) {
      const p = k ? [b[0] + (a[0] - b[0]) * k * 0.4, b[1] + (a[1] - b[1]) * k * 0.4] : b;
      if (k) out.push(new THREE.Vector3(p[0], y, p[1]));
    }
    out.push(new THREE.Vector3(b[0] + (n[0] - b[0]) * round * 0.2, y, b[1] + (n[1] - b[1]) * round * 0.2));
    out.push(new THREE.Vector3(b[0] + (n[0] - b[0]) * 0.5, y, b[1] + (n[1] - b[1]) * 0.5));
  }
  return new THREE.CatmullRomCurve3(out, true, 'centripetal', 0.5);
}
function extrudeY(shape: THREE.Shape, depth: number, y0: number, bevel = 0.05) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 48 });
  g.rotateX(-Math.PI / 2); // extrusion along +Y
  g.translate(0, y0, 0);
  return g;
}
// Threaded bore: a ring of fine ridges on the inside wall.
function threadedBore(r: number, h: number, y0: number, mats: Mats) {
  const prof: THREE.Vector2[] = [];
  const n = Math.max(4, Math.round(h / 0.22));
  for (let i = 0; i <= n; i++) {
    const y = y0 + (i / n) * h;
    prof.push(new THREE.Vector2(r + (i % 2 ? 0 : 0.07), y));
  }
  const g = new THREE.LatheGeometry(prof, 96);
  const m = new THREE.Mesh(g, mats.carrierBlack);
  (m.material as THREE.Material).side = THREE.DoubleSide;
  return m;
}

// Autofocus coil wound straight onto the lens carrier: an octagonal band of fine wire between two plastic flanges.
export function afCarrier(o: { S: number; D: number; H: number; C: number }, mats: Mats, q = 1) {
  const g = new THREE.Group();
  const S = o.S, c = S * 0.21, R = o.D / 2;
  const fb = o.H * 0.17, yb = fb, yt = fb + o.C; // bottom flange, coil band, top block
  const coilT = 0.3;
  const mk = (geo: THREE.BufferGeometry) => { const m = new THREE.Mesh(geo, mats.carrierBlack); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  mk(extrudeY(octShape(S - 0.1, c, R), fb - 0.06, 0.03, 0.03));
  mk(extrudeY(octShape(S - 2 * coilT, c * 0.9, R), o.C + 0.02, yb, 0));
  mk(extrudeY(octShape(S, c, R), o.H - yt - 0.06, yt + 0.03, 0.04));
  g.add(threadedBore(R, o.H, 0, mats));
  // winding: visible outer turns over a solid copper band
  const d = o.C / 15;
  const rand = rng(31);
  const turns: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 15; i++) {
    const y = yb + d * (i + 0.5);
    const tg = tube(octCurve(S - 2 * coilT + 2 * (coilT - d * 0.5) + 0.12, c * 0.92, y), d * 0.48, Math.round(260 * q), Math.max(5, Math.round(6 * q)), true);
    turns.push(tint(tg, 0.82 + rand() * 0.24));
  }
  const band = new THREE.Mesh(merge(turns), mats.copper);
  band.castShadow = true;
  g.add(band);
  // four locating tabs on the top, at alternate corners
  const corners = octPoints(S, c);
  for (let k = 0; k < 4; k++) {
    const [ax, az] = corners[k * 2], [bx, bz] = corners[k * 2 + 1];
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, ang = Math.atan2(mz, mx);
    const tab = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.34, 0.7, 2, 0.08), mats.carrierBlack);
    tab.position.set(Math.cos(ang) * (S / 2 - 0.1), o.H + 0.12, -Math.sin(ang) * (S / 2 - 0.1));
    tab.rotation.y = ang;
    tab.castShadow = true;
    g.add(tab);
    const post = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.3, 0.42, 2, 0.06), mats.carrierBlack);
    post.position.set(Math.cos(ang + 0.45) * (S / 2 - 1.1), o.H + 0.12, -Math.sin(ang + 0.45) * (S / 2 - 1.1));
    g.add(post);
  }
  // wire ends wrapped on two terminal posts under one corner
  for (const k of [-1, 1]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 16), mats.tin);
    pin.position.set(S / 2 - c * 0.35, yb - 0.12, k * 0.6);
    g.add(pin);
    g.add(new THREE.Mesh(tint(path([[S / 2 - coilT * 0.2, yb + 0.1, k * 0.3], [S / 2 - c * 0.2, yb - 0.02, k * 0.55], [S / 2 - c * 0.35, yb - 0.18, k * 0.6]], d * 0.5, 16, 6), 1), mats.copper));
  }
  return g;
}

// Flat racetrack coil standing on a face: normal along +X (side) or +Y (top).
function faceCoil(L: number, W: number, H: number, mats: Mats, q: number) {
  const { geometry } = racetrackCoilGeometry({ L, W, iL: L * 0.62, iW: Math.max(W * 0.28, 0.3), H, turns: 8, quality: q * 0.8 });
  const m = new THREE.Mesh(geometry, mats.copper);
  m.castShadow = true;
  return m;
}

// AF + OIS carrier: a chamfered square body around a threaded bore, flat drive coils on three faces.
export function oisCarrier(o: { S: number; D: number; H: number }, mats: Mats, q = 1) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  const S = o.S, c = S * 0.16, R = o.D / 2;
  const add = (geo: THREE.BufferGeometry) => { const m = new THREE.Mesh(geo, mats.carrierBlack); m.castShadow = true; m.receiveShadow = true; body.add(m); return m; };
  add(extrudeY(octShape(S * 0.86, c * 0.8, R), o.H, 0, 0.05));
  add(extrudeY(octShape(S, c, R + 0.05), o.H * 0.16, 0, 0.04));            // bottom flange
  add(extrudeY(octShape(S, c, R + 0.05), o.H * 0.16, o.H * 0.84, 0.04));   // top flange
  body.add(threadedBore(R, o.H, 0, mats));
  // corner bosses with terminal pads
  for (const [x, z] of octPoints(S, c).filter((_, i) => i % 2 === 0)) {
    const boss = new THREE.Mesh(new RoundedBoxGeometry(1.1, o.H * 0.5, 1.1, 2, 0.12), mats.carrierBlack);
    boss.position.set(x * 0.9, o.H * 0.5, -z * 0.9);
    boss.castShadow = true;
    body.add(boss);
    const pad = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.32, 0.5, 2, 0.06), mats.copperPolished);
    pad.position.set(x * 0.98, o.H * 0.3, -z * 0.98);
    body.add(pad);
  }
  // drive coils on +X and -X (AF / OIS-X) and on the top face (OIS-Y)
  const cw = S * 0.56, ch = o.H * 0.62, ct = 0.55;
  const basis = (cols: number[][]) => new THREE.Matrix4().makeBasis(new THREE.Vector3(...cols[0]), new THREE.Vector3(...cols[1]), new THREE.Vector3(...cols[2]));
  const faces: [number[][], [number, number, number]][] = [
    [[[0, 0, 1], [1, 0, 0], [0, 1, 0]], [S * 0.43, o.H / 2, 0]],
    [[[0, 0, 1], [-1, 0, 0], [0, -1, 0]], [-S * 0.43, o.H / 2, 0]],
    [[[1, 0, 0], [0, 0, -1], [0, 1, 0]], [0, o.H / 2, -S * 0.43]],
  ];
  for (const [cols, pos] of faces) {
    const m = faceCoil(cw, ch, ct, mats, q);
    m.setRotationFromMatrix(basis(cols));
    m.position.set(...pos);
    body.add(m);
  }
  // stand it on edge so the bore faces the camera, like it sits in a module
  body.rotation.x = Math.PI / 2;
  body.position.set(0, S / 2, -o.H / 2);
  g.add(body);
  return g;
}

// ---------------------------------------------------------------- wireless power, as built
// Receiver coil on a nanocrystalline sheet: the thin, silvery disc is what keeps the stack under 0.5 mm.
export function nanoRx(o: { OD: number; ID: number }, mats: Mats, q = 1) {
  const g = new THREE.Group();
  const R = o.OD / 2, Rs = R + 2.6, r0 = o.ID / 2;
  const sh = new THREE.Shape();
  const notch = 0.07;
  sh.absarc(0, 0, Rs, Math.PI / 2 + notch, Math.PI / 2 + Math.PI * 2 - notch, false);
  sh.lineTo(Math.cos(Math.PI / 2 - notch) * (Rs - 2.2), Math.sin(Math.PI / 2 - notch) * (Rs - 2.2));
  sh.lineTo(Math.cos(Math.PI / 2 + notch) * (Rs - 2.2), Math.sin(Math.PI / 2 + notch) * (Rs - 2.2));
  sh.closePath();
  const sheet = new THREE.Mesh(extrudeY(sh, 0.12, -0.12, 0.02), mats.nanocrystal);
  sheet.receiveShadow = true; sheet.castShadow = true;
  g.add(sheet);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(r0 - 0.4, r0 - 0.4, 0.04, 96), mats.nanoCore);
  core.position.y = 0.02;
  g.add(core);
  const turns = 21;
  const wireR = ((R - r0) / turns) * 0.47;
  const curve = new SpiralCurve(r0 + wireR, R - wireR, turns, wireR * 0.6);
  const coil = new THREE.Mesh(tint(tube(curve, wireR, Math.round(turns * 150 * q), 8), 1), mats.litzPale);
  coil.scale.y = 0.55; coil.castShadow = true;
  g.add(coil);
  // two flat leads leave through the notch, side by side
  for (const k of [-1, 1]) {
    const x = k * 1.1;
    const lead = new THREE.Mesh(tint(path([[x * 0.6, wireR, -R + 0.6], [x, wireR * 1.2, -R - 1], [x, wireR * 1.2, -Rs - 4], [x * 1.05, wireR * 1.2, -Rs - R * 0.95]], wireR * 1.15, 40, 8), 1), mats.litzPale);
    lead.scale.y = 0.6; lead.castShadow = true;
    g.add(lead);
    const tip = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.25, 1.6, 2, 0.1), mats.tin);
    tip.position.set(x * 1.05, wireR, -Rs - R * 0.95 - 0.6);
    g.add(tip);
  }
  // the inner end crossing out under the turns
  const bridge = new THREE.Mesh(tint(path([[0, wireR, -r0 - wireR], [-0.5, wireR * 3, -R * 0.7], [-1.1, wireR * 2, -R + 0.6]], wireR * 1.05, 30, 8), 1), mats.litzPale);
  bridge.scale.y = 0.6;
  g.add(bridge);
  return g;
}

// Rounded-rectangle spiral (for transmitter coils): radii grow separately in X and Z.
class RectSpiralCurve extends THREE.Curve<THREE.Vector3> {
  constructor(public a0: number, public b0: number, public a1: number, public b1: number, public turns: number, public y = 0, public p = 4) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    const ang = t * this.turns * Math.PI * 2;
    const a = this.a0 + (this.a1 - this.a0) * t, b = this.b0 + (this.b1 - this.b0) * t;
    const cx = Math.cos(ang), sz = Math.sin(ang);
    const k = Math.pow(Math.pow(Math.abs(cx), this.p) + Math.pow(Math.abs(sz), this.p), -1 / this.p);
    return target.set(cx * k * a, this.y, sz * k * b);
  }
}

// One transmitter coil: litz wound in a rounded rectangle, both ends led out the top with Kapton over the exit.
function txCoil(mats: Mats, q: number, y: number) {
  const g = new THREE.Group();
  const turns = 11, a0 = 10.5, b0 = 6.5, a1 = 22, b1 = 20;
  const wireR = ((a1 - a0) / turns) * 0.5;
  const curve = new RectSpiralCurve(a0 + wireR, b0 + wireR, a1 - wireR, b1 - wireR, turns, y + wireR * 0.6, 4);
  const coil = new THREE.Mesh(tint(tube(curve, wireR, Math.round(turns * 150 * q), 8), 1), mats.litzPale);
  coil.scale.y = 0.7; coil.castShadow = true; coil.receiveShadow = true;
  g.add(coil);
  const end = curve.getPoint(1);
  for (const [k, x0] of [[0, end.x], [1, -2.2]] as [number, number][]) {
    const z0 = k ? -b0 : end.z;
    const lead = new THREE.Mesh(tint(path([[x0, y + wireR * (k ? 2.2 : 1), z0], [x0 + 2.6 + k * 0.6, y + wireR * 2.4, -b1 - 1], [x0 + 3 + k * 0.8, y + wireR * 2.4, -b1 - 9], [x0 + 3.2 + k * 0.8, y + wireR * 2.2, -b1 - 15]], wireR * 0.95, 40, 8), 1), mats.litzPale);
    lead.castShadow = true;
    g.add(lead);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(wireR * 0.95, wireR * 0.95, 2.2, 12), mats.tin);
    tip.rotation.x = Math.PI / 2; tip.position.set(x0 + 3.2 + k * 0.8, y + wireR * 2.2, -b1 - 16);
    g.add(tip);
  }
  const tape = new THREE.Mesh(new RoundedBoxGeometry(7.5, 0.08, 6, 2, 0.03), mats.kapton);
  tape.position.set(end.x * 0.5 + 0.6, y + wireR * 3.1, -b1 + 1.2);
  g.add(tape);
  return g;
}

// Two- or three-coil transmitter on a black ferrite sheet (A11 / MP-A13 style layouts).
export function multiTx(n: 2 | 3, mats: Mats, q = 1) {
  const g = new THREE.Group();
  const pos: [number, number, number][] = n === 2 ? [[-13, 0, 0], [13, 1, 0]] : [[-22.5, 0, 0], [22.5, 0, 0], [0, 1, 0]];
  const L = n === 2 ? 76 : 98, W = 50;
  const sheet = new THREE.Mesh(new RoundedBoxGeometry(L, 0.8, W, 4, n === 2 ? 14 : 10), mats.ferrite);
  sheet.position.y = -0.4; sheet.receiveShadow = true; sheet.castShadow = true;
  g.add(sheet);
  pos.forEach(([x, y, z]) => { const c = txCoil(mats, q, y); c.position.set(x, 0, z); g.add(c); });
  return g;
}

// ---------------------------------------------------------------- linear motor drive coil
// SMD drive coil: copper winding on a black bobbin base, steel core pin, tinned end-caps for reflow.
export function smdDriveCoil(mats: Mats, q = 1) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.75, 1.8, 3, 0.12), mats.carrierBlack);
  base.position.y = 0.375; base.castShadow = true; base.receiveShadow = true;
  g.add(base);
  const step = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.18, 1.4, 2, 0.05), mats.carrierBlack);
  step.position.y = 0.84; g.add(step);
  for (const k of [-1, 1]) {
    const cap = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.34, 0.5, 2, 0.08), mats.tin);
    cap.position.set(k * 1.0, 0.22, 0.75); cap.castShadow = true;
    g.add(cap);
  }
  const winding = ringStack(0.42, 11, 3, 0.085, mats, 0.93, q);
  g.add(winding);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.92, 64), mats.copper);
  tint(fill.geometry, 0.75); fill.position.y = 1.39;
  g.add(fill);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.7, 32), mats.steel);
  pin.position.y = 1.55; pin.castShadow = true;
  g.add(pin);
  for (const k of [-1, 1]) {
    g.add(new THREE.Mesh(tint(path([[k * 0.55, 1.0, 0.45], [k * 0.85, 0.85, 0.7], [k * 1.0, 0.45, 0.78]], 0.028, 20, 6), 1), mats.copper));
  }
  return g;
}

// ---------------------------------------------------------------- dispatch
// Pick a model from a product's dims (shape + optional model hint) or slug.
export function productModel(dims: any, slug: string, mats: Mats, q = 1): THREE.Group {
  const s = dims?.shape;
  if (slug.includes('-cw')) return afCarrier({ S: dims.S, D: dims.D, H: dims.H, C: dims.C }, mats, q);
  if (slug.includes('-cx')) return oisCarrier({ S: dims.S, D: dims.D, H: dims.H }, mats, q);
  if (slug.includes('-dt')) return multiTx(2, mats, q);
  if (slug.includes('-tt')) return multiTx(3, mats, q);
  if (slug.includes('-dc0')) return smdDriveCoil(mats, q);
  if (slug.includes('rf')) return rfInductor({ OD: dims.OD || 3.5, H: dims.H || 4.2 }, mats);
  if (slug.includes('-tc')) return telecoil({ L: dims.L, W: dims.W, iL: dims.iL, iW: dims.iW, H: dims.H }, mats, q);
  if (slug.includes('-sv')) return solenoidCoil({ D: dims.D, L: dims.L, d: dims.d }, mats);
  if (slug.includes('-rx')) return nanoRx({ OD: dims.OD, ID: dims.ID }, mats, q);
  if (slug.includes('-mpp')) return wpcTx({ OD: dims.OD, ID: dims.ID, T: dims.T }, mats, { magnets: true }, q);
  if (slug.includes('st3')) return station({ L: 180, W: 90, H: 14 }, mats, q);
  switch (s) {
    case 'racetrack': return racetrackCoil({ L: dims.L, W: dims.W, iL: dims.iL, iW: dims.iW, H: Math.max(dims.H, 0.5), turns: dims.W < 5 ? 9 : 12, corner: dims.r }, mats, q);
    case 'ring': return voiceCoil({ OD: dims.OD, ID: dims.ID, H: dims.H }, mats, q);
    case 'bobbin': return bobbinCoil({ D: dims.D, L: dims.L, d: dims.d }, mats, { white: slug.includes('rl'), pins: slug.includes('rl') }, q);
    case 'spiral': return wpcTx({ OD: dims.OD, ID: dims.ID, T: dims.T }, mats, {}, q);
    case 'lra': return lraX({ L: dims.L, W: dims.W, H: dims.H }, mats);
    case 'coin': return lraCoin({ D: dims.D, H: dims.H }, mats);
    case 'module': return qi2Module({ L: dims.L, W: dims.W, H: dims.H }, mats, q);
    default: return racetrackCoil({ L: 8, W: 6, iL: 5.2, iW: 3.2, H: 0.9 }, mats, q);
  }
}

export { RectSpiralCurve, octPoints, RoundRectCurve, SpiralCurve, HelixCurve, rng, tint, merge, tube, path, magnetRing, ringStack };

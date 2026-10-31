// Composed scenes: product shots and the manufacturing / macro storytelling images.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { type Mats, productModel, racetrackCoil, racetrackCoilGeometry, bobbinCoil, qi2Module, ringStack, path, tint, rng } from './models';
import type { Mode, View } from './studio';

export type Shot = { build: (m: Mats, q: number) => THREE.Object3D; view: View; mode: Mode; size: [number, number]; ss?: number };

const AF = { L: 8, W: 6, iL: 5.2, iW: 3.2, H: 0.9 };

export function productView(shape: string, slug: string): View {
  if (slug.includes('rf')) return { az: 30, el: 18, fill: 0.7 };
  if (slug.includes('st3')) return { az: 28, el: 32, fill: 0.86 };
  switch (shape) {
    case 'racetrack': return { az: 32, el: 36, fill: 1.05 };
    case 'ring': return { az: 30, el: 26, fill: 0.92 };
    case 'bobbin': return { az: 34, el: 22, fill: 0.66 };
    case 'spiral': return { az: 24, el: 48, fill: 0.8 };
    case 'lra': return { az: 34, el: 30, fill: 0.78 };
    case 'coin': return { az: 30, el: 34, fill: 0.74 };
    case 'module': return { az: 30, el: 42, fill: 0.8 };
    default: return { az: 32, el: 32, fill: 0.72 };
  }
}

export function productShot(dims: any, slug: string): Shot {
  return { build: (m, q) => productModel(dims, slug, m, q), view: productView(dims?.shape, slug), mode: 'light', size: [1600, 1200], ss: 2.5 };
}

// A production tray of autofocus coils.
function tray(m: Mats, q: number) {
  const g = new THREE.Group();
  const cols = 7, rows = 5, px = 11, pz = 9;
  const W = cols * px + 8, D = rows * pz + 8;
  const base = new THREE.Mesh(new RoundedBoxGeometry(W, 4, D, 4, 1.2), m.trayBlack);
  base.position.y = -2; base.receiveShadow = true; base.castShadow = true;
  g.add(base);
  const pocketMat = new THREE.MeshPhysicalMaterial({ color: 0x0e0f10, roughness: 0.8 });
  const pocketGeo = new RoundedBoxGeometry(9.4, 0.6, 7.6, 3, 1.4);
  const { geometry } = racetrackCoilGeometry({ ...AF, quality: q * 0.7 });
  const coils = new THREE.InstancedMesh(geometry, m.copper, cols * rows);
  coils.castShadow = true; coils.receiveShadow = true;
  const r = rng(9);
  const M = new THREE.Matrix4();
  let k = 0;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = (i - (cols - 1) / 2) * px, z = (j - (rows - 1) / 2) * pz;
    const pocket = new THREE.Mesh(pocketGeo, pocketMat);
    pocket.position.set(x, -0.05, z);
    g.add(pocket);
    const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (r() - 0.5) * 0.06, 0));
    M.compose(new THREE.Vector3(x + (r() - 0.5) * 0.3, 0.26, z + (r() - 0.5) * 0.3), rot, new THREE.Vector3(1, 1, 1));
    coils.setMatrixAt(k++, M);
  }
  g.add(coils);
  return g;
}

// Winding head laying wire onto a bobbin.
function winding(m: Mats, q: number) {
  const g = new THREE.Group();
  const bob = bobbinCoil({ D: 16, L: 22, d: 6 }, m, { white: true, wound: 0.5 }, q);
  bob.rotation.z = Math.PI / 2;
  bob.position.x = 11;
  g.add(bob);
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 70, 64), m.steel);
  spindle.rotation.z = Math.PI / 2; spindle.position.x = -10;
  spindle.castShadow = true;
  g.add(spindle);
  const chuck = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 10, 64), m.anodized);
  chuck.rotation.z = Math.PI / 2; chuck.position.x = -20; chuck.castShadow = true;
  g.add(chuck);
  // wire from the current turn to the nozzle
  const topY = 6.3, x = 4;
  const wire = new THREE.Mesh(tint(path([[x, topY, 0.4], [x, topY + 6, 0.2], [x, 24, 0]], 0.2, 40, 8), 1), m.copper);
  g.add(wire);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 16, 32), m.steel);
  nozzle.position.set(x, 32, 0); nozzle.castShadow = true;
  g.add(nozzle);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.8, 24), m.plasticLcp);
  tip.position.set(x, 23.6, 0);
  g.add(tip);
  const block = new THREE.Mesh(new RoundedBoxGeometry(10, 12, 10, 4, 1), m.anodized);
  block.position.set(x, 45, 0); block.castShadow = true;
  g.add(block);
  const wireUp = new THREE.Mesh(tint(path([[x, 40, 0], [x - 10, 60, 6], [x - 30, 80, 14]], 0.12, 30, 8), 1), m.copper);
  g.add(wireUp);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(110, 3, 50, 4, 1), m.anodized);
  plate.position.set(-8, -12, 0); plate.receiveShadow = true;
  g.add(plate);
  return g;
}

// Cut-away block of orthocyclic winding: copper cores with enamel coats.
function section(m: Mats) {
  const g = new THREE.Group();
  const r = 1, len = 26, layers = 7, per = 9;
  const core = new THREE.CylinderGeometry(r * 0.9, r * 0.9, len, 48, 1, true);
  core.rotateX(Math.PI / 2); core.translate(0, 0, -len / 2);
  const coat = new THREE.CylinderGeometry(r, r, len, 48, 1, true);
  coat.rotateX(Math.PI / 2); coat.translate(0, 0, -len / 2);
  const face = new THREE.CircleGeometry(r * 0.9, 48);
  const ring = new THREE.RingGeometry(r * 0.9, r, 48);
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0x9b4a17, metalness: 0.4, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.03 });
  const cores: THREE.BufferGeometry[] = [], coats: THREE.BufferGeometry[] = [], faces: THREE.BufferGeometry[] = [], rings: THREE.BufferGeometry[] = [];
  const rand = rng(21);
  for (let l = 0; l < layers; l++) {
    const n = l % 2 ? per - 1 : per;
    for (let i = 0; i < n; i++) {
      const x = (i - (per - 1) / 2) * 2 * r + (l % 2 ? r : 0);
      const y = r + l * r * Math.sqrt(3);
      const k = 0.86 + rand() * 0.2;
      cores.push(tint(core.clone().translate(x, y, 0), k));
      coats.push(coat.clone().translate(x, y, 0));
      faces.push(face.clone().translate(x, y, 0.001));
      rings.push(ring.clone().translate(x, y, 0.002));
    }
  }
  const mk = (gs: THREE.BufferGeometry[], mat: THREE.Material) => { const mm = new THREE.Mesh(mergeAll(gs), mat); mm.castShadow = true; mm.receiveShadow = true; return mm; };
  const cut = new THREE.MeshPhysicalMaterial({ color: 0xf2a271, metalness: 0.55, roughness: 0.38, clearcoat: 0.4 });
  g.add(mk(cores, m.copper), mk(coats, enamel), mk(faces, cut), mk(rings, enamel));
  const wall = new THREE.Mesh(new RoundedBoxGeometry(per * 2 * r + 6, 3, len, 3, 0.4), m.plasticLcp);
  wall.position.set(r * 0.5, -1.5, -len / 2); wall.receiveShadow = true;
  g.add(wall);
  return g;
}
function mergeAll(gs: THREE.BufferGeometry[]) {
  return mergeGeometries(gs, false)!;
}

function spool(m: Mats) {
  const g = new THREE.Group();
  const prof = [[4, 0], [30, 0], [30, 2.4], [16, 2.4], [16, 37.6], [30, 37.6], [30, 40], [4, 40], [4, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const reel = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), m.plasticBlack);
  reel.castShadow = true; reel.receiveShadow = true;
  g.add(reel);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 35.2, 160, 1, true), m.spoolCopper);
  drum.position.y = 20; drum.castShadow = true;
  (drum.material as THREE.MeshPhysicalMaterial).normalMap!.repeat.set(30, 1);
  g.add(drum);
  const wire = new THREE.Mesh(tint(path([[25, 30, 0], [29, 30.5, 8], [40, 31, 18], [62, 26, 22], [80, 4, 24]], 0.22, 60, 8), 1), m.copper);
  g.add(wire);
  return g;
}

function vcmFamily(m: Mats, q: number) {
  const g = new THREE.Group();
  const af = racetrackCoil(AF, m, q); af.position.set(-7, 0, 2);
  const ois = racetrackCoil({ L: 12, W: 10, iL: 7.6, iW: 5.2, H: 0.55, turns: 13 }, m, q); ois.position.set(6, 0, -3); ois.rotation.y = 0.5;
  const per = racetrackCoil({ L: 16, W: 4, iL: 13.4, iW: 1.4, H: 1.2, turns: 8 }, m, q); per.position.set(-2, 0, 10); per.rotation.y = -0.25;
  g.add(af, ois, per);
  return g;
}

export const shots: Record<string, Shot> = {
  'hero-af': { build: (m, q) => racetrackCoil({ ...AF, turns: 13 }, m, q * 1.4), view: { az: 26, el: 38, fill: 0.86 }, mode: 'light', size: [2000, 1700], ss: 1.6 },
  'macro-turns': { build: (m, q) => racetrackCoil({ ...AF, turns: 13 }, m, q * 1.6), view: { az: 62, el: 16, fov: 16, target: [3.4, 0.25, 1.6], dist: 7.5, ground: false }, mode: 'dark', size: [2400, 1350], ss: 1.5 },
  tray: { build: tray, view: { az: 22, el: 34, fov: 26, fill: 2.1, target: [4, 0, 4], ground: false }, mode: 'dark', size: [2400, 1500], ss: 1.5 },
  winding: { build: winding, view: { az: 32, el: 13, fov: 24, fill: 1.9, target: [7, 3, 0], ground: false }, mode: 'dark', size: [1800, 2000], ss: 1.5 },
  section: { build: (m) => section(m), view: { az: 24, el: 14, fov: 20, fill: 1.7, target: [0, 5, -3], ground: false }, mode: 'dark', size: [1800, 1350], ss: 1.5 },
  spool: { build: (m) => spool(m), view: { az: 24, el: 26, fill: 0.9 }, mode: 'dark', size: [1600, 1300] },
  exploded: { build: (m, q) => qi2Module({ L: 56, W: 56, H: 6.5 }, m, q, 1), view: { az: 34, el: 22, fov: 22, fill: 0.84 }, mode: 'light', size: [1800, 2000], ss: 1.5 },
  'family-vcm': { build: vcmFamily, view: { az: 20, el: 46, fill: 1.3 }, mode: 'light', size: [1600, 1200] },
};

export { ringStack };

// Live, in-browser rendering of the same models used for the static renders.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { materials, productModel, racetrackCoil } from './models';
import { createStudio, type View } from './studio';
import { productView } from './scenes';

export type LiveOptions = {
  kind: 'hero' | 'product';
  dims?: any; slug?: string;
  view?: View;
  interactive?: boolean;
  onReady?: () => void;
};

export function mountLive(canvas: HTMLCanvasElement, o: LiveOptions) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const studio = createStudio(canvas, { mode: 'light', alpha: true, pixelRatio: Math.min(window.devicePixelRatio || 1, o.kind === 'hero' ? 1.5 : 2) });
  const mats = materials();
  const subject = o.kind === 'hero'
    ? racetrackCoil({ L: 8, W: 6, iL: 5.2, iW: 3.2, H: 0.9, turns: 13 }, mats, 1)
    : productModel(o.dims, o.slug || '', mats, 1);
  const view = o.view || (o.kind === 'hero' ? { az: 26, el: 38, fill: 0.86 } : productView(o.dims?.shape, o.slug || ''));
  studio.setSubject(subject, view);

  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w && h) studio.resize(w, h);
  };
  size();

  // Rotate the subject about its own centre so framing stays put.
  const c = studio.center.clone();
  subject.position.sub(c);
  studio.pivot.position.copy(c);

  let controls: OrbitControls | null = null;
  if (o.interactive) {
    controls = new OrbitControls(studio.camera, canvas);
    controls.target.copy(c);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = studio.camera.position.distanceTo(c) * 0.45;
    controls.maxDistance = studio.camera.position.distanceTo(c) * 1.6;
    controls.autoRotate = !reduce.matches;
    controls.autoRotateSpeed = 1.1;
    controls.addEventListener('start', () => { controls!.autoRotate = false; });
    controls.update();
  }

  // Pointer tilt for the hero.
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
    tilt.ty = ((e.clientY - r.top) / r.height - 0.5) * 0.3;
  };
  if (o.kind === 'hero') window.addEventListener('pointermove', onPointer, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; loop(); }, { threshold: 0 });
  io.observe(canvas);
  const ro = new ResizeObserver(() => { size(); studio.render(); });
  ro.observe(canvas);

  const clock = new THREE.Clock();
  let ready = false;
  let running = false;
  function frame() {
    const t = clock.getElapsedTime();
    if (o.kind === 'hero') {
      tilt.x += (tilt.tx - tilt.x) * 0.06;
      tilt.y += (tilt.ty - tilt.y) * 0.06;
      const drift = reduce.matches ? 0 : Math.sin(t * 0.35) * 0.22;
      studio.pivot.rotation.set(tilt.y, drift + tilt.x, 0);
    }
    controls?.update();
    studio.render();
    if (!ready) { ready = true; o.onReady?.(); }
  }
  function loop() {
    const animate = visible && !document.hidden && !(o.kind === 'hero' && reduce.matches);
    if (animate && !running) { running = true; studio.renderer.setAnimationLoop(frame); }
    if (!animate && running) { running = false; studio.renderer.setAnimationLoop(null); }
    if (!running) frame();
  }
  const onVis = () => loop();
  document.addEventListener('visibilitychange', onVis);
  if (controls) controls.addEventListener('change', () => { if (!running) frame(); });
  loop();

  return () => {
    studio.renderer.setAnimationLoop(null);
    io.disconnect(); ro.disconnect();
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVis);
    controls?.dispose();
    studio.dispose();
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

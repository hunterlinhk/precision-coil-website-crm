// Browser entry for the offline renderer. Exposes window.renderShot(name).
import { materials } from '../../lib/coil3d/models';
import { createStudio } from '../../lib/coil3d/studio';
import { shots, productShot } from '../../lib/coil3d/scenes';
import { products } from '../../lib/catalog-seed';

const all: Record<string, any> = { ...shots };
for (const p of products) all[p.slug] = productShot(p.dims, p.slug);

(window as any).shotNames = Object.keys(all);
(window as any).renderShot = (name: string, scale = 1, tm?: string, exp?: number) => {
  (globalThis as any).__toneMapping = tm === 'agx' ? 6 : tm === 'neutral' ? 7 : undefined;
  (globalThis as any).__exposure = exp;
  const s = all[name];
  if (!s) throw new Error('unknown shot ' + name);
  const ss = (s.ss ?? 2) * scale;
  const [w, h] = s.size;
  const canvas = document.createElement('canvas');
  const studio = createStudio(canvas, { mode: s.mode, alpha: true, pixelRatio: 1 });
  studio.renderer.setSize(Math.round(w * ss), Math.round(h * ss), false);
  studio.camera.aspect = w / h;
  const m = materials();
  studio.setSubject(s.build(m, 1), s.view);
  studio.render();
  const url = canvas.toDataURL('image/png');
  studio.dispose();
  return { url, w, h };
};

import manifest from '@/public/renders/manifest.json';
import { withBase } from './base';

type Entry = { w: number; h: number; xl?: boolean };
const M = manifest as Record<string, Entry>;

export const hasRender = (name: string) => !!M[name];

// Responsive sources for a rendered image: -sm (half), base (1600w), -xl (full) when present.
export function renderSrc(name: string) {
  const e = M[name];
  if (!e) return null;
  const set = [`${withBase('/renders/')}${name}-sm.webp ${Math.round(e.w / 2)}w`, `${withBase('/renders/')}${name}.webp ${e.w}w`];
  if (e.xl) set.push(`${withBase('/renders/')}${name}-xl.webp ${e.w * (e.w >= 1600 ? 1.5 : 1)}w`);
  return { src: `${withBase('/renders/')}${name}.webp`, srcSet: set.join(', '), width: e.w, height: e.h };
}

// Category → hero render.
export const familyRender: Record<string, string> = {
  'vcm-coils': 'family-vcm',
  'air-core-coils': 'family-aircore',
  'bobbin-coils': 'aw-bb-sn0812',
  'wireless-charging-coils': 'aw-wc-rx43',
  'linear-motors': 'aw-lm-z0825',
  'wireless-chargers': 'aw-ch-q2m15',
};
export const shapeFallback: Record<string, string> = {
  racetrack: 'aw-vcm-af0806', octagon: 'aw-vcm-cw0940', ring: 'aw-ac-vc1200', bobbin: 'aw-bb-sn0812', spiral: 'aw-wc-wr20', lra: 'aw-lm-x0835', coin: 'aw-lm-z0825', module: 'aw-ch-q2m15',
};
export function productRenderName(p: { slug: string; dims?: any; shape?: string }) {
  if (hasRender(p.slug)) return p.slug;
  return shapeFallback[p.dims?.shape || p.shape || ''] || 'aw-vcm-af0806';
}

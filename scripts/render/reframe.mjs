// Re-crops transparent studio renders so every product sits at the same visual scale.
// Finds the subject by alpha (ignoring the faint shadow), then crops to a fixed aspect with even margins.
// Usage: node scripts/render/reframe.mjs            (all light renders)
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'public', 'renders');
const manifestPath = path.join(dir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
// name → [aspect w/h, fill of the limiting dimension]
const special = { 'hero-af': [1.25, 0.86], exploded: [0.86, 0.9], 'family-vcm': [4 / 3, 0.84] };
const skip = new Set(['macro-turns', 'tray', 'winding', 'section', 'spool']);

for (const name of Object.keys(manifest)) {
  if (skip.has(name)) continue;
  const master = path.join(process.cwd(), '.render-cache', `${name}.png`);
  const srcFile = fs.existsSync(master) ? master : path.join(dir, manifest[name].xl ? `${name}-xl.webp` : `${name}.webp`);
  const img = sharp(srcFile);
  const { width: W, height: H } = await img.metadata();
  const { data } = await img.clone().ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[y * W + x] > 160) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 <= x0) continue;
  const [aspect, fill] = special[name] || [4 / 3, 0.74];
  const bw = x1 - x0, bh = y1 - y0;
  let cw = Math.max(bw / fill, (bh / fill) * aspect);
  let ch = cw / aspect;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + bh * 0.04; // leave a little more room below for the shadow
  const left = Math.round(cx - cw / 2), top = Math.round(cy - ch / 2);
  cw = Math.round(cw); ch = Math.round(ch);
  // extend with transparency where the crop runs past the image edge
  const ext = { top: Math.max(0, -top), left: Math.max(0, -left), bottom: Math.max(0, top + ch - H), right: Math.max(0, left + cw - W), background: { r: 0, g: 0, b: 0, alpha: 0 } };
  const ew = W + ext.left + ext.right, eh = H + ext.top + ext.bottom;
  const ex = Math.max(0, left + ext.left), ey = Math.max(0, top + ext.top);
  cw = Math.min(cw, ew - ex); ch = Math.min(ch, eh - ey);
  const extended = await sharp(srcFile).extend(ext).png().toBuffer();
  const base = await sharp(extended).extract({ left: ex, top: ey, width: cw, height: ch }).png().toBuffer();
  const outW = Math.min(1600, cw);
  const outH = Math.round((outW * ch) / cw);
  await sharp(base).resize(outW, outH, { kernel: 'lanczos3' }).webp({ quality: 88, alphaQuality: 92 }).toFile(path.join(dir, `${name}.webp`));
  await sharp(base).resize(Math.round(outW / 2), Math.round(outH / 2), { kernel: 'lanczos3' }).webp({ quality: 86, alphaQuality: 90 }).toFile(path.join(dir, `${name}-sm.webp`));
  if (manifest[name].xl) fs.rmSync(path.join(dir, `${name}-xl.webp`), { force: true });
  manifest[name] = { w: outW, h: outH, xl: false };
  console.log(name, `${outW}x${outH}`);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));

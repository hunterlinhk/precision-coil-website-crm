// Renders 3D product and scene images to public/renders/*.webp
// Usage: node scripts/render/run.mjs [shot ...]   (no args = all)
import { build } from 'esbuild';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

// Playwright is not a project dependency; use a local install if present, otherwise the global one.
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const { chromium } = pw;

const root = process.cwd();
const out = path.join(root, 'public', 'renders');
fs.mkdirSync(out, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'render-'));
await build({ entryPoints: [path.join(root, 'scripts/render/entry.ts')], bundle: true, format: 'iife', outfile: path.join(tmp, 'bundle.js'), logLevel: 'warning', target: 'es2020' });
fs.writeFileSync(path.join(tmp, 'index.html'), '<!doctype html><html><body style="margin:0;background:#000"><script src="bundle.js"></script></body></html>');

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto('file://' + path.join(tmp, 'index.html'));
const args = process.argv.slice(2);
const names = args.length ? args : await page.evaluate(() => window.shotNames);
for (const name of names) {
  const t0 = Date.now();
  const [nm, tm, ex] = name.split(':');
  const { url, w, h } = await page.evaluate(([n, t, e]) => window.renderShot(n, 1, t, e ? +e : undefined), [nm, tm, ex]);
  const buf = Buffer.from(url.split(',')[1], 'base64');
  const cache = path.join(root, '.render-cache'); fs.mkdirSync(cache, { recursive: true });
  fs.writeFileSync(path.join(cache, `${name.replace(/:/g, '_')}.png`), buf); // full-resolution master for reframing
  const big = Math.min(w, 1600);
  const bh = Math.round((h * big) / w);
  await sharp(buf).resize(big, bh, { kernel: 'lanczos3' }).webp({ quality: 88, alphaQuality: 92, effort: 5 }).toFile(path.join(out, `${name.replace(/:/g, '_')}.webp`));
  await sharp(buf).resize(Math.round(big / 2), Math.round(bh / 2), { kernel: 'lanczos3' }).webp({ quality: 86, alphaQuality: 90, effort: 5 }).toFile(path.join(out, `${name.replace(/:/g, '_')}-sm.webp`));
  if (w > 1600) await sharp(buf).resize(w, h, { kernel: 'lanczos3' }).webp({ quality: 86, alphaQuality: 92, effort: 5 }).toFile(path.join(out, `${name.replace(/:/g, '_')}-xl.webp`));
  console.log(`${name}: ${w}x${h} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
// Manifest of rendered images and their intrinsic sizes, used by the site to pick files and reserve space.
const manifest = {};
for (const f of fs.readdirSync(out)) {
  const m = f.match(/^(.*?)(-sm|-xl)?\.webp$/);
  if (!m || m[2]) continue;
  const meta = await sharp(path.join(out, f)).metadata();
  manifest[m[1]] = { w: meta.width, h: meta.height, xl: fs.existsSync(path.join(out, `${m[1]}-xl.webp`)) };
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });

// Builds a static, read-only copy of the public website (for GitHub Pages or any static host).
//
//   NEXT_PUBLIC_BASE_PATH=/precision-coil-website-crm npm run preview:static
//
// 1. builds Next with the base path, trailing slashes and the quote form in preview mode
// 2. starts the production server, crawls every public page in both languages
// 3. writes HTML + /_next/static + /public into ./preview-out
// The CRM/CMS admin is not part of the static copy: it needs the Node server and database.
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
const PORT = process.env.PREVIEW_PORT || '3210';
const OUT = path.resolve('preview-out');
const origin = `http://localhost:${PORT}`;
const env = { ...process.env, NEXT_PUBLIC_STATIC_PREVIEW: '1', NEXT_PUBLIC_BASE_PATH: BASE, NEXT_DIST_DIR: '.next-preview', DATA_DIR: path.resolve('.preview-data') };

fs.rmSync(env.DATA_DIR, { recursive: true, force: true }); // fresh demo content
if (!process.argv.includes('--no-build')) execSync('npx next build', { stdio: 'inherit', env });
const server = spawn('npx', ['next', 'start', '-p', PORT], { env, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid); } catch { /* already gone */ } };
process.on('exit', stop);

const wait = async () => {
  for (let i = 0; i < 90; i++) {
    try { const r = await fetch(`${origin}${BASE}/en/`); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('server did not start');
};
await wait();

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const seen = new Set();
const queue = [`${BASE}/en/`, `${BASE}/zh/`];
const linkRe = /href="([^"#?]+)(?:[?#][^"]*)?"/g;
while (queue.length) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);
  const res = await fetch(origin + url, { redirect: 'manual' });
  if (res.status !== 200 || !(res.headers.get('content-type') || '').includes('text/html')) continue;
  const html = await res.text();
  const rel = decodeURIComponent(url.slice(BASE.length)).replace(/^\//, '');
  const file = path.join(OUT, rel, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  for (const [, href] of html.matchAll(linkRe)) {
    if (!href.startsWith(`${BASE}/en/`) && !href.startsWith(`${BASE}/zh/`)) continue;
    const u = href.endsWith('/') ? href : href + '/';
    if (!seen.has(u)) queue.push(u);
  }
}

// 404 page, and a root page that sends visitors to their language.
const nf = await fetch(`${origin}${BASE}/en/this-page-does-not-exist/`);
fs.writeFileSync(path.join(OUT, '404.html'), await nf.text());
fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Arcwind</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>location.replace('${BASE}/' + (/^zh/i.test(navigator.language || '') ? 'zh' : 'en') + '/' + location.search)</script>
<meta http-equiv="refresh" content="0; url=${BASE}/en/"><a href="${BASE}/en/">Arcwind</a>`);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

fs.cpSync('.next-preview/static', path.join(OUT, '_next/static'), { recursive: true });
fs.cpSync('public', OUT, { recursive: true });
stop();
console.log(`${seen.size} URLs crawled, ${fs.readdirSync(OUT).length} top-level entries in ${OUT}`);
process.exit(0);

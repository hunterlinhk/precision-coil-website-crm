import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Secrets at rest (mail passwords, API credentials) are encrypted with AES-256-GCM.
// The key comes from APP_SECRET, or is generated once and kept in the data directory.
let key: Buffer | null = null;
function getKey() {
  if (key) return key;
  if (process.env.APP_SECRET && process.env.APP_SECRET.length >= 16) {
    key = crypto.createHash('sha256').update(process.env.APP_SECRET).digest();
    return key;
  }
  const dir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const file = path.join(dir, '.secret');
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, crypto.randomBytes(32).toString('base64'), { mode: 0o600 });
  key = Buffer.from(fs.readFileSync(file, 'utf8').trim(), 'base64');
  return key;
}

export function seal(plain: string): string {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
}

export function unseal(sealed: string | null | undefined): string {
  if (!sealed) return '';
  const [v, iv, tag, ct] = sealed.split(':');
  if (v !== 'v1') return '';
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([d.update(Buffer.from(ct, 'base64')), d.final()]).toString('utf8');
  } catch { return ''; }
}

// Small key/value settings table.
import { db } from './db';
export function getSetting<T = string>(k: string, fallback: T): T {
  const r = db().prepare('SELECT value FROM settings WHERE key = ?').get(k) as { value: string } | undefined;
  if (!r) return fallback;
  try { return JSON.parse(r.value) as T; } catch { return fallback; }
}
export function setSetting(k: string, v: unknown) {
  db().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, JSON.stringify(v));
}

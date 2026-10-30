import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR } from './db';

export type Stored = { id: string; name: string; size: number };
const ALLOWED = /\.(pdf|step|stp|dwg|dxf|igs|iges|png|jpe?g|webp|gif|svg|zip|xlsx|docx)$/i;
export const MAX_UPLOAD = 20 * 1024 * 1024;

export async function saveUpload(file: File, visibility: 'public' | 'private'): Promise<Stored | null> {
  if (!file || !file.name || file.size === 0 || file.size > MAX_UPLOAD || !ALLOWED.test(file.name)) return null;
  const ext = path.extname(file.name).toLowerCase();
  const id = crypto.randomBytes(12).toString('hex') + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, visibility, id), Buffer.from(await file.arrayBuffer()));
  return { id, name: path.basename(file.name).slice(0, 140), size: file.size };
}

const TYPES: Record<string, string> = {
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.zip': 'application/zip', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function readUpload(id: string, visibility: 'public' | 'private') {
  if (!/^[a-f0-9]{24}\.[a-z0-9]+$/.test(id)) return null;
  const p = path.join(UPLOAD_DIR, visibility, id);
  if (!fs.existsSync(p)) return null;
  return { body: fs.readFileSync(p), type: TYPES[path.extname(id)] || 'application/octet-stream' };
}

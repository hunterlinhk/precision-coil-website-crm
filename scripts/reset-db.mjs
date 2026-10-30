// Deletes the local database so the next start re-creates it with seed data.
import fs from 'node:fs';
import path from 'node:path';
const dir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
for (const f of ['arcwind.db', 'arcwind.db-wal', 'arcwind.db-shm']) {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) { fs.rmSync(p); console.log('removed', p); }
}
console.log('Database will be re-seeded on next start.');

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, username TEXT,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'sales',
  regions TEXT DEFAULT '', active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, sort INTEGER DEFAULT 0,
  name_en TEXT, name_zh TEXT, short_en TEXT, short_zh TEXT, summary_en TEXT, summary_zh TEXT, shape TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, category_id INTEGER NOT NULL,
  model TEXT NOT NULL, name_en TEXT, name_zh TEXT, summary_en TEXT, summary_zh TEXT,
  body_en TEXT, body_zh TEXT, custom_en TEXT, custom_zh TEXT,
  specs TEXT DEFAULT '[]', params TEXT DEFAULT '{}', dims TEXT DEFAULT '{}',
  applications TEXT DEFAULT '[]', images TEXT DEFAULT '[]', files TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft', featured INTEGER DEFAULT 0, sort INTEGER DEFAULT 0,
  seo_title_en TEXT, seo_title_zh TEXT, seo_desc_en TEXT, seo_desc_zh TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, type TEXT NOT NULL DEFAULT 'news',
  title_en TEXT, title_zh TEXT, excerpt_en TEXT, excerpt_zh TEXT, body_en TEXT, body_zh TEXT,
  products TEXT DEFAULT '[]', applications TEXT DEFAULT '[]', reading_min INTEGER DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'draft',
  seo_title_en TEXT, seo_title_zh TEXT, seo_desc_en TEXT, seo_desc_zh TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, domain TEXT, country TEXT, industry TEXT,
  stage TEXT NOT NULL DEFAULT 'prospect', source TEXT, owner_id INTEGER, website TEXT,
  annual_volume TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY, account_id INTEGER, name TEXT NOT NULL, title TEXT, email TEXT,
  phone TEXT, messenger TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY, type TEXT NOT NULL DEFAULT 'quote', status TEXT NOT NULL DEFAULT 'new',
  name TEXT, email TEXT, company TEXT, country TEXT, phone TEXT, role TEXT, message TEXT,
  items TEXT DEFAULT '[]', annual_volume TEXT, target_date TEXT, files TEXT DEFAULT '[]', nda INTEGER DEFAULT 0,
  source TEXT, referrer TEXT, landing TEXT, utm TEXT, locale TEXT,
  owner_id INTEGER, account_id INTEGER, contact_id INTEGER, opportunity_id INTEGER,
  first_response_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL, title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'qualifying', value REAL DEFAULT 0, products TEXT DEFAULT '[]',
  owner_id INTEGER, expected_close TEXT, lost_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY, number TEXT UNIQUE, account_id INTEGER NOT NULL, opportunity_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft', items TEXT DEFAULT '[]', total REAL DEFAULT 0, currency TEXT DEFAULT 'USD',
  incoterm TEXT DEFAULT 'FOB Shenzhen', valid_until TEXT, owner_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS samples (
  id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL, opportunity_id INTEGER, model TEXT, qty INTEGER DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'requested', courier TEXT, tracking TEXT, feedback TEXT, owner_id INTEGER,
  requested_at TEXT NOT NULL DEFAULT (datetime('now')), shipped_at TEXT
);
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY, account_id INTEGER, inquiry_id INTEGER, opportunity_id INTEGER,
  user_id INTEGER, kind TEXT NOT NULL DEFAULT 'note', body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, due_at TEXT, done INTEGER DEFAULT 0, user_id INTEGER,
  account_id INTEGER, opportunity_id INTEGER, inquiry_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS logos (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, image TEXT, url TEXT, sort INTEGER DEFAULT 0, visible INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS mail_accounts (
  id INTEGER PRIMARY KEY, label TEXT, email TEXT NOT NULL, from_name TEXT,
  smtp_host TEXT, smtp_port INTEGER DEFAULT 465, smtp_secure INTEGER DEFAULT 1, smtp_user TEXT, smtp_pass TEXT,
  imap_host TEXT, imap_port INTEGER DEFAULT 993, imap_secure INTEGER DEFAULT 1, imap_user TEXT, imap_pass TEXT,
  owner_id INTEGER, active INTEGER NOT NULL DEFAULT 1, last_uid INTEGER DEFAULT 0, last_sync TEXT, last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY, mail_account_id INTEGER, direction TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'sent',
  message_id TEXT, in_reply_to TEXT, refs TEXT, from_addr TEXT, from_name TEXT, to_addrs TEXT, cc_addrs TEXT,
  subject TEXT, body_text TEXT, attachments TEXT DEFAULT '[]', error TEXT, imap_uid INTEGER,
  account_id INTEGER, contact_id INTEGER, inquiry_id INTEGER, user_id INTEGER, read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY, ts TEXT NOT NULL DEFAULT (datetime('now')), path TEXT, locale TEXT,
  visitor TEXT, ref_host TEXT, channel TEXT, utm_source TEXT, utm_campaign TEXT,
  country TEXT, device TEXT, browser TEXT, os TEXT
);
CREATE INDEX IF NOT EXISTS idx_pv_ts ON pageviews(ts);
CREATE INDEX IF NOT EXISTS idx_mail_msgid ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_mail_account ON emails(account_id);
CREATE INDEX IF NOT EXISTS idx_inq_created ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_act_account ON activities(account_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id, done);
`;

declare global {
  // eslint-disable-next-line no-var
  var __arcwindDb: Database.Database | undefined;
}

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'public'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'private'), { recursive: true });
  const db = new Database(path.join(DATA_DIR, 'arcwind.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  // Older databases: add columns introduced later.
  const ensure = (table: string, col: string, def: string) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  };
  ensure('users', 'username', 'TEXT');
  ensure('users', 'lang', "TEXT DEFAULT 'en'");
  ensure('articles', 'takeaways_en', 'TEXT');
  ensure('articles', 'takeaways_zh', 'TEXT');
  ensure('articles', 'faq', "TEXT DEFAULT '[]'");
  ensure('articles', 'cover', 'TEXT');
  ensure('articles', 'author', 'TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_username ON users(username COLLATE NOCASE)');
  const count = db.prepare('SELECT COUNT(*) c FROM users').get() as { c: number };
  if (count.c === 0) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { seed } = require('./seed');
    seed(db);
  }
  // The primary administrator signs in as HunterLin.
  if (!db.prepare('SELECT 1 FROM users WHERE username IS NOT NULL LIMIT 1').get()) {
    db.prepare("UPDATE users SET username = 'HunterLin' WHERE id = (SELECT MIN(id) FROM users WHERE role = 'admin')").run();
  }
  return db;
}

export function db(): Database.Database {
  if (!globalThis.__arcwindDb) globalThis.__arcwindDb = open();
  return globalThis.__arcwindDb;
}

export const j = <T = any>(s: string | null | undefined, fallback: T): T => {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
};

export const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

import 'server-only';
import { db, now } from './db';

// Turn a referrer / UTM string into a marketing channel. AI assistants are tracked
// separately so the team can see what GEO work is bringing in.
export function classifySource(referrer: string, utm: string): string {
  const r = (referrer || '').toLowerCase();
  const u = (utm || '').toLowerCase();
  if (/utm_medium=email|newsletter/.test(u)) return 'Email campaign';
  if (/utm_source=(tradeshow|expo|event)/.test(u)) return 'Trade show';
  if (/chatgpt|openai|perplexity|gemini\.google|copilot|claude\.ai|you\.com|kimi|doubao|deepseek/.test(r) || /utm_source=(chatgpt|perplexity|ai)/.test(u)) return 'AI search';
  if (/linkedin|lnkd/.test(r)) return 'LinkedIn';
  if (/baidu/.test(r)) return 'Baidu';
  if (/google|bing|duckduckgo|yahoo|yandex|ecosia/.test(r)) return 'Google organic';
  if (u.includes('utm_source')) return 'Paid / campaign';
  if (r && !r.includes(process.env.SITE_HOST || 'arcwind')) return 'Referral';
  return 'Direct';
}

// Pick the rep whose regions include this country; otherwise the manager.
export function ownerForCountry(country: string): number | null {
  const reps = db().prepare(`SELECT id, regions FROM users WHERE active = 1 AND role = 'sales'`).all() as { id: number; regions: string }[];
  const hit = reps.find((r) => (r.regions || '').split(',').map((s) => s.trim()).includes(country));
  if (hit) return hit.id;
  const mgr = db().prepare(`SELECT id FROM users WHERE active = 1 AND role IN ('manager','admin') ORDER BY role = 'manager' DESC LIMIT 1`).get() as { id: number } | undefined;
  return mgr?.id ?? null;
}

const FREEMAIL = /@(gmail|outlook|hotmail|yahoo|icloud|qq|163|126|foxmail|proton|live|aol|mail)\./i;

export function matchAccount(email: string, company: string): number | null {
  const domain = (email.split('@')[1] || '').toLowerCase();
  if (domain && !FREEMAIL.test('@' + domain)) {
    const a = db().prepare('SELECT id FROM accounts WHERE lower(domain) = ?').get(domain) as { id: number } | undefined;
    if (a) return a.id;
  }
  if (company) {
    const a = db().prepare('SELECT id FROM accounts WHERE lower(name) = lower(?)').get(company.trim()) as { id: number } | undefined;
    if (a) return a.id;
  }
  return null;
}

export const inquiryRef = (id: number) => `INQ-${String(id).padStart(6, '0')}`;

// Add N working days (Mon–Fri) to a date.
export function addWorkingDays(d: Date, n: number) {
  const x = new Date(d);
  while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0 && x.getDay() !== 6) n--; }
  return x;
}

export function logActivity(a: { account_id?: number | null; inquiry_id?: number | null; opportunity_id?: number | null; user_id?: number | null; kind: string; body: string }) {
  db().prepare('INSERT INTO activities (account_id,inquiry_id,opportunity_id,user_id,kind,body,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(a.account_id ?? null, a.inquiry_id ?? null, a.opportunity_id ?? null, a.user_id ?? null, a.kind, a.body, now());
}

import 'server-only';
import { db } from './db';
import { can, type User } from './auth';

export const STAGES = ['qualifying', 'sampling', 'quoted', 'negotiation', 'won', 'lost'] as const;
export const STAGE_LABEL: Record<string, string> = { qualifying: 'Qualifying', sampling: 'Sampling', quoted: 'Quoted', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' };
export const STAGE_PROB: Record<string, number> = { qualifying: 0.1, sampling: 0.25, quoted: 0.45, negotiation: 0.7, won: 1, lost: 0 };
export const INQ_STATUS = ['new', 'qualified', 'converted', 'closed', 'spam'];
export const INQ_TYPE: Record<string, string> = { quote: 'Quotation', sample: 'Samples', drawing: 'Drawing review', general: 'Question' };
export const SAMPLE_STATUS = ['requested', 'in_production', 'shipped', 'delivered', 'feedback'];
export const QUOTE_STATUS = ['draft', 'sent', 'accepted', 'rejected'];

// SQL fragment restricting rows to what this user may see.
export const scope = (u: User, col = 'owner_id', allowUnassigned = false) =>
  can.seeAll(u) ? '1=1' : `(${col} = ${Number(u.id)}${allowUnassigned ? ` OR ${col} IS NULL` : ''})`;

export function users(): { id: number; name: string; role: string; regions: string; active: number; email: string; username: string | null }[] {
  return db().prepare('SELECT id, name, role, regions, active, email, username FROM users ORDER BY active DESC, name').all() as any;
}
export const salesUsers = () => users().filter((u) => u.active && u.role !== 'editor');

export const money = (v: number, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: v >= 1000 ? 0 : 2 }).format(v || 0);
export const compactMoney = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(v >= 1e7 ? 0 : 2)}M` : v >= 1e3 ? `$${Math.round(v / 1e3)}k` : `$${Math.round(v)}`);

const toDate = (s: string) => new Date(s.includes('T') ? s : s.replace(' ', 'T') + (s.length > 10 ? 'Z' : 'T00:00:00Z'));
export const date = (s?: string | null) => (s ? toDate(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const dateTime = (s?: string | null) => (s ? toDate(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export function ago(s?: string | null) {
  if (!s) return '—';
  const diff = (Date.now() - toDate(s).getTime()) / 1000;
  const fut = diff < 0;
  const a = Math.abs(diff);
  const v = a < 3600 ? `${Math.max(1, Math.round(a / 60))} min` : a < 86400 ? `${Math.round(a / 3600)} h` : `${Math.round(a / 86400)} d`;
  return fut ? `in ${v}` : `${v} ago`;
}

export const hoursBetween = (a: string, b: string) => (toDate(b).getTime() - toDate(a).getTime()) / 3600000;

export const countryName = (c: string) => {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(c) || c; } catch { return c || '—'; }
};

export function median(xs: number[]) {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

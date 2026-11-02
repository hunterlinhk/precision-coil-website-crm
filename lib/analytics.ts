import 'server-only';
import crypto from 'node:crypto';
import UAParser from 'ua-parser-js';
import { db, now } from './db';
import { classifySource } from './crm';
import { getSetting, setSetting } from './secrets';

// First-party, cookie-less visitor analytics (the approach used by Plausible and Umami):
// a visitor is a hash of a daily rotating salt + IP + user agent, so people cannot be
// followed from one day to the next and nothing is stored in the browser.

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|monitor|preview|facebookexternalhit|curl|wget|python|axios|node-fetch/i;

function dailySalt() {
  const today = new Date().toISOString().slice(0, 10);
  const cur = getSetting<{ day: string; salt: string } | null>('analytics_salt', null);
  if (cur && cur.day === today) return cur.salt;
  const salt = crypto.randomBytes(16).toString('hex');
  setSetting('analytics_salt', { day: today, salt });
  return salt;
}

export function track(input: { path: string; referrer: string; locale: string; utm: string; ip: string; ua: string; country: string | null; host: string }) {
  if (!input.ua || BOT.test(input.ua)) return;
  const path = (input.path || '/').split('?')[0].slice(0, 300);
  if (!/^\/(en|zh)(\/|$)/.test(path)) return;
  const ua = new UAParser(input.ua).getResult();
  const visitor = crypto.createHash('sha256').update(`${dailySalt()}|${input.ip}|${input.ua}|${input.host}`).digest('hex').slice(0, 16);
  let refHost = '';
  try { refHost = input.referrer ? new URL(input.referrer).hostname.replace(/^www\./, '') : ''; } catch { /* ignore */ }
  if (refHost && input.host && refHost === input.host.replace(/^www\./, '')) refHost = '';
  const q = new URLSearchParams(input.utm || '');
  const device = ua.device.type === 'mobile' ? 'mobile' : ua.device.type === 'tablet' ? 'tablet' : 'desktop';
  db().prepare(`INSERT INTO pageviews (ts,path,locale,visitor,ref_host,channel,utm_source,utm_campaign,country,device,browser,os) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(now(), path, input.locale === 'zh' ? 'zh' : 'en', visitor, refHost || null, refHost || input.utm ? classifySource(input.referrer, input.utm) : 'Direct',
      q.get('utm_source'), q.get('utm_campaign'), input.country, device, ua.browser.name || null, ua.os.name || null);
}

const since = (days: number) => `datetime('now', '-${Math.max(1, Math.min(400, Math.round(days)))} days')`;

export function webStats(days = 30) {
  const d = db();
  const w = `ts > ${since(days)}`;
  const totals = d.prepare(`SELECT COUNT(*) views, COUNT(DISTINCT visitor || substr(ts,1,10)) visitors FROM pageviews WHERE ${w}`).get() as { views: number; visitors: number };
  const prev = d.prepare(`SELECT COUNT(DISTINCT visitor || substr(ts,1,10)) visitors FROM pageviews WHERE ts > ${since(days * 2)} AND ts <= ${since(days)}`).get() as { visitors: number };
  const daily = d.prepare(`SELECT substr(ts,1,10) day, COUNT(DISTINCT visitor) visitors, COUNT(*) views FROM pageviews WHERE ${w} GROUP BY day ORDER BY day`).all() as { day: string; visitors: number; views: number }[];
  const by = (col: string, limit = 10) => d.prepare(`SELECT coalesce(${col}, '') k, COUNT(DISTINCT visitor || substr(ts,1,10)) v FROM pageviews WHERE ${w} GROUP BY k ORDER BY v DESC LIMIT ${limit}`).all() as { k: string; v: number }[];
  return {
    ...totals, prevVisitors: prev.visitors, daily,
    pages: by('path', 12), channels: by('channel'), referrers: by('ref_host', 10), countries: by('country', 10),
    devices: by('device', 3), browsers: by('browser', 6), locales: by('locale', 2),
  };
}

// Fill missing days so charts have a bar for every day.
export function fillDays(rows: { day: string; visitors: number }[], days: number) {
  const m = new Map(rows.map((r) => [r.day, r.visitors]));
  const out: { day: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    out.push({ day, value: m.get(day) || 0 });
  }
  return out;
}

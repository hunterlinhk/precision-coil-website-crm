import 'server-only';
import crypto from 'node:crypto';
import { getSetting, setSetting, seal, unseal } from './secrets';

// Google Search Console: clicks, impressions, CTR and average position for the site,
// read with a Google Cloud service account that has been added as a user on the property.
// API: POST https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query
// Scope: https://www.googleapis.com/auth/webmasters.readonly

type Creds = { client_email: string; private_key: string; token_uri?: string };
export type GscConfig = { property: string; email: string } | null;

export function gscConfig(): GscConfig {
  const c = getSetting<{ property: string; creds: string } | null>('gsc', null);
  if (!c?.property || !c.creds) return null;
  try { return { property: c.property, email: (JSON.parse(unseal(c.creds)) as Creds).client_email }; } catch { return null; }
}

export function saveGscConfig(property: string, json: string | null) {
  const cur = getSetting<{ property: string; creds: string } | null>('gsc', null);
  let creds = cur?.creds || '';
  if (json) {
    const parsed = JSON.parse(json) as Creds;
    if (!parsed.client_email || !parsed.private_key) throw new Error('This is not a service-account key file (client_email / private_key missing).');
    creds = seal(JSON.stringify({ client_email: parsed.client_email, private_key: parsed.private_key, token_uri: parsed.token_uri }));
  }
  setSetting('gsc', { property: property.trim(), creds });
  setSetting('gsc_cache', null);
}
export const clearGscConfig = () => { setSetting('gsc', null); setSetting('gsc_cache', null); };

const b64 = (o: object | Buffer) => (Buffer.isBuffer(o) ? o : Buffer.from(JSON.stringify(o))).toString('base64url');

async function accessToken(c: Creds) {
  const iat = Math.floor(Date.now() / 1000);
  const aud = c.token_uri || 'https://oauth2.googleapis.com/token';
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: c.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud, iat, exp: iat + 3600 })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(c.private_key);
  const res = await fetch(aud, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${b64(sig)}` }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error_description || j.error || `Token request failed (${res.status})`);
  return j.access_token as string;
}

type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function query(token: string, property: string, body: object): Promise<Row[]> {
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error?.message || `Search Console request failed (${res.status})`);
  return (j.rows || []) as Row[];
}

export type GscReport = {
  range: [string, string]; fetchedAt: string;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  daily: { day: string; clicks: number; impressions: number; position: number }[];
  queries: Row[]; pages: Row[]; countries: Row[];
};

// Last 28 days, ending 2 days ago (Search Console data lags). Cached for 6 hours.
export async function gscReport(force = false): Promise<{ report?: GscReport; error?: string }> {
  const c = getSetting<{ property: string; creds: string } | null>('gsc', null);
  if (!c?.property || !c.creds) return {};
  const cache = getSetting<GscReport | null>('gsc_cache', null);
  if (!force && cache && Date.now() - new Date(cache.fetchedAt).getTime() < 6 * 3600000) return { report: cache };
  try {
    const creds = JSON.parse(unseal(c.creds)) as Creds;
    const token = await accessToken(creds);
    const end = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    const start = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const base = { startDate: start, endDate: end };
    const [byDate, queries, pages, countries] = await Promise.all([
      query(token, c.property, { ...base, dimensions: ['date'], rowLimit: 100 }),
      query(token, c.property, { ...base, dimensions: ['query'], rowLimit: 50 }),
      query(token, c.property, { ...base, dimensions: ['page'], rowLimit: 20 }),
      query(token, c.property, { ...base, dimensions: ['country'], rowLimit: 10 }),
    ]);
    const clicks = byDate.reduce((s, r) => s + r.clicks, 0), impressions = byDate.reduce((s, r) => s + r.impressions, 0);
    const position = impressions ? byDate.reduce((s, r) => s + r.position * r.impressions, 0) / impressions : 0;
    const report: GscReport = {
      range: [start, end], fetchedAt: new Date().toISOString(),
      totals: { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position },
      daily: byDate.map((r) => ({ day: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
      queries, pages, countries,
    };
    setSetting('gsc_cache', report);
    return { report };
  } catch (e: any) {
    const msg = e?.message === 'fetch failed' ? 'Could not reach Google from the server (fetch failed). Check the server’s internet access.' : e?.message || String(e);
    return { report: cache || undefined, error: msg };
  }
}

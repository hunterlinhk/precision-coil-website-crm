import { track } from '@/lib/analytics';

// Page-view beacon from the public site. No cookies; see lib/analytics.ts.
export async function POST(req: Request) {
  try {
    const body = JSON.parse((await req.text()).slice(0, 4000) || '{}');
    const h = req.headers;
    track({
      path: String(body.p || ''), referrer: String(body.r || ''), locale: String(body.l || ''), utm: String(body.u || ''),
      ip: (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || '',
      ua: h.get('user-agent') || '',
      country: h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || h.get('x-country-code') || null,
      host: h.get('host') || '',
    });
  } catch { /* never fail the page */ }
  return new Response(null, { status: 204 });
}

import { NextRequest, NextResponse } from 'next/server';
import { db, now } from '@/lib/db';
import { saveUpload } from '@/lib/uploads';
import { classifySource, ownerForCountry, matchAccount, inquiryRef, addWorkingDays, logActivity } from '@/lib/crm';

export const runtime = 'nodejs';

const str = (v: FormDataEntryValue | null, max = 2000) => String(v ?? '').trim().slice(0, max);

export async function POST(req: NextRequest) {
  let fd: FormData;
  try { fd = await req.formData(); } catch { return NextResponse.json({ error: 'Invalid form' }, { status: 400 }); }

  // Honeypot: silently accept and drop.
  if (str(fd.get('website'))) return NextResponse.json({ ref: inquiryRef(0) });

  const data = {
    type: ['quote', 'sample', 'drawing', 'general'].includes(str(fd.get('type'))) ? str(fd.get('type')) : 'general',
    name: str(fd.get('name'), 120), email: str(fd.get('email'), 160).toLowerCase(), company: str(fd.get('company'), 160),
    country: str(fd.get('country'), 8).toUpperCase(), phone: str(fd.get('phone'), 60), role: str(fd.get('role'), 60),
    message: str(fd.get('message'), 5000), annual_volume: str(fd.get('annual_volume'), 40), target_date: str(fd.get('target_date'), 60),
    nda: fd.get('nda') ? 1 : 0, locale: str(fd.get('locale'), 4) === 'zh' ? 'zh' : 'en',
  };
  const fields = ['name', 'email', 'company', 'country', 'message'].filter((k) => !(data as any)[k]);
  if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) fields.push('email');
  if (fields.length) return NextResponse.json({ error: 'Missing fields', fields }, { status: 422 });

  let items: { model: string; qty: string }[] = [];
  try { items = (JSON.parse(str(fd.get('items'), 8000) || '[]') as any[]).slice(0, 30).map((i) => ({ model: String(i.model).slice(0, 40), qty: String(i.qty ?? '').slice(0, 20) })); } catch { /* ignore */ }

  let src = { referrer: '', landing: '', utm: '' };
  try { src = { ...src, ...JSON.parse(str(fd.get('src'), 2000) || '{}') }; } catch { /* ignore */ }

  const files = [];
  for (const f of fd.getAll('files').slice(0, 8)) {
    if (f instanceof File) { const s = await saveUpload(f, 'private'); if (s) files.push(s); }
  }

  const owner = ownerForCountry(data.country);
  const account = matchAccount(data.email, data.company);
  const created = now();
  const info = db().prepare(`INSERT INTO inquiries (type,status,name,email,company,country,phone,role,message,items,annual_volume,target_date,files,nda,source,referrer,landing,utm,locale,owner_id,account_id,created_at)
    VALUES (@type,'new',@name,@email,@company,@country,@phone,@role,@message,@items,@annual_volume,@target_date,@files,@nda,@source,@referrer,@landing,@utm,@locale,@owner,@account,@created)`).run({
    ...data, items: JSON.stringify(items), files: JSON.stringify(files), source: classifySource(src.referrer, src.utm),
    referrer: String(src.referrer).slice(0, 500), landing: String(src.landing).slice(0, 300), utm: String(src.utm).slice(0, 300), owner, account, created,
  });
  const id = Number(info.lastInsertRowid);
  const ref = inquiryRef(id);

  // Follow-up task: first response due within one working day.
  const due = addWorkingDays(new Date(), 1).toISOString().slice(0, 19).replace('T', ' ');
  const label = { quote: 'quote request', sample: 'sample request', drawing: 'drawing review', general: 'question' }[data.type];
  db().prepare('INSERT INTO tasks (title,due_at,user_id,account_id,inquiry_id,created_at) VALUES (?,?,?,?,?,?)')
    .run(`Respond to ${label} from ${data.company} (${ref})`, due, owner, account, id, created);
  logActivity({ account_id: account, inquiry_id: id, kind: 'inquiry', body: `Website ${label} received${items.length ? `: ${items.map((i) => i.model).join(', ')}` : ''}.` });

  return NextResponse.json({ ref });
}

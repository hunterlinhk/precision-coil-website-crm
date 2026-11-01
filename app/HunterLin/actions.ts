'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db, j, now } from '@/lib/db';
import { login, logout, requireUser, can, type User } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { logActivity, inquiryRef } from '@/lib/crm';
import { saveUpload } from '@/lib/uploads';

const s = (fd: FormData, k: string, max = 5000) => String(fd.get(k) ?? '').trim().slice(0, max);
const n = (fd: FormData, k: string) => { const v = parseFloat(String(fd.get(k) ?? '').replace(/,/g, '')); return Number.isFinite(v) ? v : 0; };
const id = (fd: FormData, k = 'id') => parseInt(String(fd.get(k) ?? ''), 10) || 0;
const nullable = (v: string) => (v === '' ? null : v);
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

function ownsOrAll(u: User, ownerId: number | null) {
  if (can.seeAll(u)) return true;
  return ownerId === null || ownerId === u.id;
}
function guard(u: User, table: string, rowId: number) {
  const row = db().prepare(`SELECT owner_id FROM ${table} WHERE id = ?`).get(rowId) as { owner_id: number | null } | undefined;
  if (!row || !ownsOrAll(u, row.owner_id)) redirect('/HunterLin?denied=1');
  return row;
}

// ---------------- Auth ----------------
export async function loginAction(fd: FormData) {
  const ok = await login(s(fd, 'username') || s(fd, 'email'), String(fd.get('password') ?? ''));
  redirect(ok ? '/HunterLin' : '/HunterLin/login?error=1');
}
export async function logoutAction() {
  await logout();
  redirect('/HunterLin/login');
}

// ---------------- Inquiries ----------------
export async function updateInquiry(fd: FormData) {
  const u = await requireUser(can.crm);
  const iid = id(fd);
  const before = guard(u, 'inquiries', iid) as any;
  const cur = db().prepare('SELECT status, owner_id, account_id FROM inquiries WHERE id = ?').get(iid) as any;
  const status = s(fd, 'status') || cur.status;
  let owner = cur.owner_id;
  if (fd.has('owner_id') && can.assign(u)) owner = parseInt(s(fd, 'owner_id'), 10) || null;
  else if (fd.has('claim')) owner = u.id;
  db().prepare('UPDATE inquiries SET status = ?, owner_id = ? WHERE id = ?').run(status, owner, iid);
  if (status !== cur.status) logActivity({ inquiry_id: iid, account_id: cur.account_id, user_id: u.id, kind: 'status', body: `Inquiry marked ${status}.` });
  if (owner !== cur.owner_id && owner) {
    const name = (db().prepare('SELECT name FROM users WHERE id = ?').get(owner) as any)?.name;
    logActivity({ inquiry_id: iid, account_id: cur.account_id, user_id: u.id, kind: 'status', body: `Assigned to ${name}.` });
    db().prepare('UPDATE tasks SET user_id = ? WHERE inquiry_id = ? AND done = 0').run(owner, iid);
  }
  void before;
  revalidatePath('/HunterLin/inquiries');
  redirect(`/HunterLin/inquiries/${iid}`);
}

export async function markResponded(fd: FormData) {
  const u = await requireUser(can.crm);
  const iid = id(fd);
  guard(u, 'inquiries', iid);
  const cur = db().prepare('SELECT * FROM inquiries WHERE id = ?').get(iid) as any;
  db().prepare(`UPDATE inquiries SET first_response_at = COALESCE(first_response_at, ?), status = CASE WHEN status = 'new' THEN 'qualified' ELSE status END, owner_id = COALESCE(owner_id, ?) WHERE id = ?`).run(now(), u.id, iid);
  db().prepare('UPDATE tasks SET done = 1 WHERE inquiry_id = ? AND done = 0').run(iid);
  logActivity({ inquiry_id: iid, account_id: cur.account_id, user_id: u.id, kind: 'email', body: s(fd, 'note') || 'First response sent.' });
  redirect(`/HunterLin/inquiries/${iid}`);
}

export async function convertInquiry(fd: FormData) {
  const u = await requireUser(can.crm);
  const iid = id(fd);
  guard(u, 'inquiries', iid);
  const q = db().prepare('SELECT * FROM inquiries WHERE id = ?').get(iid) as any;
  const owner = q.owner_id || u.id;
  let accountId = q.account_id as number | null;
  const tx = db().transaction(() => {
    if (!accountId) {
      const domain = (q.email.split('@')[1] || '').toLowerCase();
      accountId = Number(db().prepare('INSERT INTO accounts (name,domain,country,stage,source,owner_id,annual_volume,created_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(q.company || q.name, domain, q.country, 'prospect', q.source, owner, q.annual_volume, now()).lastInsertRowid);
    }
    let contactId = (db().prepare('SELECT id FROM contacts WHERE account_id = ? AND lower(email) = lower(?)').get(accountId, q.email) as any)?.id;
    if (!contactId) contactId = Number(db().prepare('INSERT INTO contacts (account_id,name,title,email,phone,created_at) VALUES (?,?,?,?,?,?)').run(accountId, q.name, q.role, q.email, q.phone, now()).lastInsertRowid);
    const items = j<any[]>(q.items, []);
    const title = s(fd, 'title') || `${items.map((i) => i.model).join(', ') || 'Custom coil'} for ${q.company}`;
    const oppId = Number(db().prepare('INSERT INTO opportunities (account_id,title,stage,value,products,owner_id,expected_close,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(accountId, title, q.type === 'sample' ? 'sampling' : 'qualifying', n(fd, 'value'), JSON.stringify(items.map((i) => i.model)), owner, nullable(s(fd, 'expected_close')), now(), now()).lastInsertRowid);
    db().prepare(`UPDATE inquiries SET status = 'converted', account_id = ?, contact_id = ?, opportunity_id = ?, owner_id = ? WHERE id = ?`).run(accountId, contactId, oppId, owner, iid);
    if (q.type === 'sample' && items[0]) {
      db().prepare('INSERT INTO samples (account_id,opportunity_id,model,qty,status,owner_id,requested_at) VALUES (?,?,?,?,?,?,?)').run(accountId, oppId, items[0].model, parseInt(items[0].qty, 10) || 10, 'requested', owner, now());
    }
    logActivity({ inquiry_id: iid, account_id: accountId, opportunity_id: oppId, user_id: u.id, kind: 'status', body: `Converted ${inquiryRef(iid)} into opportunity "${title}".` });
    return oppId;
  });
  const oppId = tx();
  redirect(`/HunterLin/opportunities/${oppId}?converted=1`);
}

// ---------------- Activities & tasks ----------------
export async function addActivity(fd: FormData) {
  const u = await requireUser(can.crm);
  const body = s(fd, 'body');
  const back = s(fd, 'back') || '/HunterLin';
  if (body) logActivity({ account_id: id(fd, 'account_id') || null, inquiry_id: id(fd, 'inquiry_id') || null, opportunity_id: id(fd, 'opportunity_id') || null, user_id: u.id, kind: s(fd, 'kind') || 'note', body });
  const due = s(fd, 'follow_up');
  if (due) {
    db().prepare('INSERT INTO tasks (title,due_at,user_id,account_id,opportunity_id,inquiry_id,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(s(fd, 'task_title') || `Follow up: ${body.slice(0, 60)}`, `${due} 09:00:00`, u.id, id(fd, 'account_id') || null, id(fd, 'opportunity_id') || null, id(fd, 'inquiry_id') || null, now());
  }
  redirect(back);
}

export async function createTask(fd: FormData) {
  const u = await requireUser();
  const assignee = can.assign(u) && id(fd, 'user_id') ? id(fd, 'user_id') : u.id;
  const title = s(fd, 'title', 200);
  if (title) db().prepare('INSERT INTO tasks (title,due_at,user_id,account_id,opportunity_id,created_at) VALUES (?,?,?,?,?,?)')
    .run(title, s(fd, 'due') ? `${s(fd, 'due')} 09:00:00` : null, assignee, id(fd, 'account_id') || null, id(fd, 'opportunity_id') || null, now());
  redirect(s(fd, 'back') || '/HunterLin/tasks');
}

export async function toggleTask(fd: FormData) {
  const u = await requireUser();
  const t = db().prepare('SELECT user_id, done FROM tasks WHERE id = ?').get(id(fd)) as any;
  if (t && (t.user_id === u.id || can.seeAll(u))) db().prepare('UPDATE tasks SET done = ? WHERE id = ?').run(t.done ? 0 : 1, id(fd));
  redirect(s(fd, 'back') || '/HunterLin/tasks');
}

// ---------------- Accounts & contacts ----------------
export async function saveAccount(fd: FormData) {
  const u = await requireUser(can.crm);
  const aid = id(fd);
  const owner = can.assign(u) ? (id(fd, 'owner_id') || null) : u.id;
  const vals = [s(fd, 'name', 160), s(fd, 'domain', 120).toLowerCase(), s(fd, 'country', 8).toUpperCase(), s(fd, 'industry', 80), s(fd, 'stage') || 'prospect', s(fd, 'source', 60), s(fd, 'website', 200), s(fd, 'annual_volume', 60), s(fd, 'notes')];
  if (!vals[0]) redirect(aid ? `/HunterLin/accounts/${aid}?error=name` : '/HunterLin/accounts/new?error=name');
  if (aid) {
    guard(u, 'accounts', aid);
    const ownerSql = can.assign(u) ? ', owner_id = ?' : '';
    db().prepare(`UPDATE accounts SET name=?, domain=?, country=?, industry=?, stage=?, source=?, website=?, annual_volume=?, notes=?${ownerSql} WHERE id = ?`).run(...vals, ...(can.assign(u) ? [owner] : []), aid);
    redirect(`/HunterLin/accounts/${aid}?saved=1`);
  }
  const newId = Number(db().prepare('INSERT INTO accounts (name,domain,country,industry,stage,source,website,annual_volume,notes,owner_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(...vals, owner, now()).lastInsertRowid);
  redirect(`/HunterLin/accounts/${newId}`);
}

export async function addContact(fd: FormData) {
  const u = await requireUser(can.crm);
  const aid = id(fd, 'account_id');
  guard(u, 'accounts', aid);
  if (s(fd, 'name')) db().prepare('INSERT INTO contacts (account_id,name,title,email,phone,messenger,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(aid, s(fd, 'name', 120), s(fd, 'title', 120), s(fd, 'email', 160), s(fd, 'phone', 60), s(fd, 'messenger', 80), now());
  redirect(`/HunterLin/accounts/${aid}`);
}

export async function deleteContact(fd: FormData) {
  const u = await requireUser(can.crm);
  const aid = id(fd, 'account_id');
  guard(u, 'accounts', aid);
  db().prepare('DELETE FROM contacts WHERE id = ? AND account_id = ?').run(id(fd), aid);
  redirect(`/HunterLin/accounts/${aid}`);
}

// ---------------- Opportunities ----------------
export async function saveOpportunity(fd: FormData) {
  const u = await requireUser(can.crm);
  const oid = id(fd);
  const aid = id(fd, 'account_id');
  const back = s(fd, 'back');
  if (oid) {
    guard(u, 'opportunities', oid);
    const cur = db().prepare('SELECT * FROM opportunities WHERE id = ?').get(oid) as any;
    const stage = s(fd, 'stage') || cur.stage;
    const fields = {
      title: fd.has('title') ? s(fd, 'title', 200) : cur.title,
      value: fd.has('value') ? n(fd, 'value') : cur.value,
      expected_close: fd.has('expected_close') ? nullable(s(fd, 'expected_close')) : cur.expected_close,
      lost_reason: fd.has('lost_reason') ? nullable(s(fd, 'lost_reason')) : cur.lost_reason,
      owner_id: fd.has('owner_id') && can.assign(u) ? (id(fd, 'owner_id') || null) : cur.owner_id,
    };
    db().prepare('UPDATE opportunities SET title=?, stage=?, value=?, expected_close=?, lost_reason=?, owner_id=?, updated_at=? WHERE id = ?')
      .run(fields.title, stage, fields.value, fields.expected_close, fields.lost_reason, fields.owner_id, now(), oid);
    if (stage !== cur.stage) {
      logActivity({ account_id: cur.account_id, opportunity_id: oid, user_id: u.id, kind: 'status', body: `Stage changed from ${cur.stage} to ${stage}.` });
      if (stage === 'won') db().prepare(`UPDATE accounts SET stage = 'customer' WHERE id = ?`).run(cur.account_id);
    }
    redirect(back || `/HunterLin/opportunities/${oid}?saved=1`);
  }
  guard(u, 'accounts', aid);
  const newId = Number(db().prepare('INSERT INTO opportunities (account_id,title,stage,value,owner_id,expected_close,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(aid, s(fd, 'title', 200) || 'New opportunity', s(fd, 'stage') || 'qualifying', n(fd, 'value'), u.role === 'sales' ? u.id : (id(fd, 'owner_id') || u.id), nullable(s(fd, 'expected_close')), now(), now()).lastInsertRowid);
  logActivity({ account_id: aid, opportunity_id: newId, user_id: u.id, kind: 'status', body: 'Opportunity created.' });
  redirect(`/HunterLin/opportunities/${newId}`);
}

// ---------------- Quotes ----------------
export async function createQuote(fd: FormData) {
  const u = await requireUser(can.crm);
  const oid = id(fd, 'opportunity_id');
  const opp = db().prepare('SELECT * FROM opportunities WHERE id = ?').get(oid) as any;
  if (!opp || !ownsOrAll(u, opp.owner_id)) redirect('/HunterLin?denied=1');
  const year = new Date().getFullYear();
  const count = (db().prepare('SELECT COUNT(*) c FROM quotes WHERE number LIKE ?').get(`Q-${year}-%`) as any).c;
  const number = `Q-${year}-${String(count + 1).padStart(4, '0')}`;
  const items = j<string[]>(opp.products, []).map((m) => ({ model: m, qty: 100000, unit: 0 }));
  const valid = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const qid = Number(db().prepare('INSERT INTO quotes (number,account_id,opportunity_id,status,items,total,valid_until,owner_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(number, opp.account_id, oid, 'draft', JSON.stringify(items.length ? items : [{ model: '', qty: 0, unit: 0 }]), 0, valid, opp.owner_id || u.id, now()).lastInsertRowid);
  redirect(`/HunterLin/quotes/${qid}`);
}

export async function saveQuote(fd: FormData) {
  const u = await requireUser(can.crm);
  const qid = id(fd);
  guard(u, 'quotes', qid);
  const cur = db().prepare('SELECT * FROM quotes WHERE id = ?').get(qid) as any;
  let items: { model: string; qty: number; unit: number }[] = [];
  try { items = (JSON.parse(s(fd, 'items', 20000)) as any[]).map((i) => ({ model: String(i.model || '').slice(0, 40), qty: +i.qty || 0, unit: +i.unit || 0 })).filter((i) => i.model || i.qty); } catch { items = j(cur.items, []); }
  const total = items.reduce((a, i) => a + i.qty * i.unit, 0);
  const status = s(fd, 'status') || cur.status;
  db().prepare('UPDATE quotes SET items=?, total=?, status=?, valid_until=?, incoterm=?, currency=? WHERE id = ?')
    .run(JSON.stringify(items), Math.round(total * 100) / 100, status, nullable(s(fd, 'valid_until')), s(fd, 'incoterm', 40) || cur.incoterm, s(fd, 'currency', 6) || cur.currency, qid);
  if (status !== cur.status) {
    logActivity({ account_id: cur.account_id, opportunity_id: cur.opportunity_id, user_id: u.id, kind: 'status', body: `Quote ${cur.number} marked ${status}.` });
    if (status === 'sent' && cur.opportunity_id) db().prepare(`UPDATE opportunities SET stage = 'quoted', updated_at = ? WHERE id = ? AND stage IN ('qualifying','sampling')`).run(now(), cur.opportunity_id);
    if (status === 'sent' && cur.opportunity_id && total > 0) db().prepare('UPDATE opportunities SET value = ? WHERE id = ? AND (value IS NULL OR value = 0)').run(total, cur.opportunity_id);
  }
  redirect(`/HunterLin/quotes/${qid}?saved=1`);
}

// ---------------- Samples ----------------
export async function createSample(fd: FormData) {
  const u = await requireUser(can.crm);
  const oid = id(fd, 'opportunity_id');
  const opp = db().prepare('SELECT * FROM opportunities WHERE id = ?').get(oid) as any;
  if (!opp || !ownsOrAll(u, opp.owner_id)) redirect('/HunterLin?denied=1');
  db().prepare('INSERT INTO samples (account_id,opportunity_id,model,qty,status,owner_id,requested_at) VALUES (?,?,?,?,?,?,?)')
    .run(opp.account_id, oid, s(fd, 'model', 40), parseInt(s(fd, 'qty'), 10) || 10, 'requested', opp.owner_id || u.id, now());
  if (['qualifying'].includes(opp.stage)) db().prepare(`UPDATE opportunities SET stage = 'sampling', updated_at = ? WHERE id = ?`).run(now(), oid);
  logActivity({ account_id: opp.account_id, opportunity_id: oid, user_id: u.id, kind: 'status', body: `Sample request logged: ${s(fd, 'qty')} × ${s(fd, 'model')}.` });
  redirect(`/HunterLin/opportunities/${oid}`);
}

export async function updateSample(fd: FormData) {
  const u = await requireUser(can.crm);
  const sid = id(fd);
  guard(u, 'samples', sid);
  const cur = db().prepare('SELECT * FROM samples WHERE id = ?').get(sid) as any;
  const status = s(fd, 'status') || cur.status;
  db().prepare('UPDATE samples SET status=?, courier=?, tracking=?, feedback=?, shipped_at = CASE WHEN ? = ? AND shipped_at IS NULL THEN ? ELSE shipped_at END WHERE id = ?')
    .run(status, fd.has('courier') ? s(fd, 'courier', 40) : cur.courier, fd.has('tracking') ? s(fd, 'tracking', 60) : cur.tracking, fd.has('feedback') ? s(fd, 'feedback', 2000) : cur.feedback, status, 'shipped', now(), sid);
  if (status !== cur.status) logActivity({ account_id: cur.account_id, opportunity_id: cur.opportunity_id, user_id: u.id, kind: 'status', body: `Sample ${cur.model} marked ${status.replace('_', ' ')}.` });
  redirect(s(fd, 'back') || '/HunterLin/samples');
}

// ---------------- CMS: products ----------------
export async function saveProduct(fd: FormData) {
  const u = await requireUser(can.cms);
  const pid = id(fd);
  const intent = s(fd, 'intent'); // save | publish | unpublish
  const cur = pid ? (db().prepare('SELECT * FROM products WHERE id = ?').get(pid) as any) : null;
  const model = s(fd, 'model', 40);
  const slug = slugify(s(fd, 'slug') || model);
  if (!model || !slug) redirect(pid ? `/HunterLin/products/${pid}?error=model` : '/HunterLin/products/new?error=model');
  const clash = db().prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(slug, pid || 0);
  if (clash) redirect(pid ? `/HunterLin/products/${pid}?error=slug` : '/HunterLin/products/new?error=slug');

  let specs: any[] = [];
  try { specs = (JSON.parse(s(fd, 'specs', 20000)) as any[]).filter((r) => r.en || r.v).map((r, i) => ({ k: r.k || slugify(r.en || `spec-${i}`), en: r.en || '', zh: r.zh || '', v: r.v || '', u: r.u || '' })); } catch { specs = j(cur?.specs, []); }
  const params: Record<string, number> = {};
  for (const k of ['od', 'h', 'wire', 'r', 'l', 'turns']) { const v = s(fd, `p_${k}`); if (v !== '' && !Number.isNaN(+v)) params[k] = +v; }
  let dims = j(cur?.dims, {});
  try { dims = JSON.parse(s(fd, 'dims', 4000) || '{}'); } catch { /* keep */ }

  const images = j<any[]>(cur?.images, []).filter((f) => !fd.getAll('remove_file').includes(f.id));
  const files = j<any[]>(cur?.files, []).filter((f) => !fd.getAll('remove_file').includes(f.id));
  for (const f of fd.getAll('new_images')) if (f instanceof File && f.size) { const st = await saveUpload(f, 'public'); if (st) images.push(st); }
  for (const f of fd.getAll('new_files')) if (f instanceof File && f.size) { const st = await saveUpload(f, 'public'); if (st) files.push(st); }

  let status = cur?.status || 'draft';
  if (intent === 'publish') status = 'published';
  if (intent === 'unpublish') status = 'draft';
  const publishedAt = status === 'published' ? (cur?.published_at || now()) : cur?.published_at || null;

  const row = {
    slug, model, category_id: id(fd, 'category_id'), name_en: s(fd, 'name_en', 200), name_zh: s(fd, 'name_zh', 200),
    summary_en: s(fd, 'summary_en', 600), summary_zh: s(fd, 'summary_zh', 600), body_en: s(fd, 'body_en', 20000), body_zh: s(fd, 'body_zh', 20000),
    custom_en: s(fd, 'custom_en', 1000), custom_zh: s(fd, 'custom_zh', 1000), specs: JSON.stringify(specs), params: JSON.stringify(params), dims: JSON.stringify(dims),
    applications: JSON.stringify(fd.getAll('applications').map(String)), images: JSON.stringify(images), files: JSON.stringify(files),
    status, featured: fd.get('featured') ? 1 : 0, seo_title_en: s(fd, 'seo_title_en', 200), seo_title_zh: s(fd, 'seo_title_zh', 200),
    seo_desc_en: s(fd, 'seo_desc_en', 400), seo_desc_zh: s(fd, 'seo_desc_zh', 400), updated_at: now(), published_at: publishedAt,
  };
  let out = pid;
  if (pid) {
    db().prepare(`UPDATE products SET slug=@slug, model=@model, category_id=@category_id, name_en=@name_en, name_zh=@name_zh, summary_en=@summary_en, summary_zh=@summary_zh,
      body_en=@body_en, body_zh=@body_zh, custom_en=@custom_en, custom_zh=@custom_zh, specs=@specs, params=@params, dims=@dims, applications=@applications, images=@images, files=@files,
      status=@status, featured=@featured, seo_title_en=@seo_title_en, seo_title_zh=@seo_title_zh, seo_desc_en=@seo_desc_en, seo_desc_zh=@seo_desc_zh, updated_at=@updated_at, published_at=@published_at WHERE id = @id`).run({ ...row, id: pid });
  } else {
    out = Number(db().prepare(`INSERT INTO products (slug,model,category_id,name_en,name_zh,summary_en,summary_zh,body_en,body_zh,custom_en,custom_zh,specs,params,dims,applications,images,files,status,featured,seo_title_en,seo_title_zh,seo_desc_en,seo_desc_zh,updated_at,published_at,sort)
      VALUES (@slug,@model,@category_id,@name_en,@name_zh,@summary_en,@summary_zh,@body_en,@body_zh,@custom_en,@custom_zh,@specs,@params,@dims,@applications,@images,@files,@status,@featured,@seo_title_en,@seo_title_zh,@seo_desc_en,@seo_desc_zh,@updated_at,@published_at,999)`).run(row).lastInsertRowid);
  }
  void u;
  revalidatePath('/', 'layout');
  redirect(`/HunterLin/products/${out}?saved=${intent || 'save'}`);
}

export async function deleteProduct(fd: FormData) {
  await requireUser(can.cms);
  db().prepare('DELETE FROM products WHERE id = ?').run(id(fd));
  redirect('/HunterLin/products?deleted=1');
}

// ---------------- CMS: articles ----------------
export async function saveArticle(fd: FormData) {
  await requireUser(can.cms);
  const aid = id(fd);
  const intent = s(fd, 'intent');
  const cur = aid ? (db().prepare('SELECT * FROM articles WHERE id = ?').get(aid) as any) : null;
  const slug = slugify(s(fd, 'slug') || s(fd, 'title_en'));
  if (!slug) redirect(aid ? `/HunterLin/articles/${aid}?error=title` : '/HunterLin/articles/new?error=title');
  if (db().prepare('SELECT id FROM articles WHERE slug = ? AND id != ?').get(slug, aid || 0)) redirect(aid ? `/HunterLin/articles/${aid}?error=slug` : '/HunterLin/articles/new?error=slug');
  let status = cur?.status || 'draft';
  if (intent === 'publish') status = 'published';
  if (intent === 'unpublish') status = 'draft';
  const words = (s(fd, 'body_en', 40000).split(/\s+/).length) || 200;
  const row = {
    slug, type: ['news', 'tech', 'case'].includes(s(fd, 'type')) ? s(fd, 'type') : 'news',
    title_en: s(fd, 'title_en', 240), title_zh: s(fd, 'title_zh', 240), excerpt_en: s(fd, 'excerpt_en', 600), excerpt_zh: s(fd, 'excerpt_zh', 600),
    body_en: s(fd, 'body_en', 40000), body_zh: s(fd, 'body_zh', 40000), products: JSON.stringify(fd.getAll('products').map(String)),
    applications: JSON.stringify(fd.getAll('applications').map(String)), reading_min: Math.max(1, Math.round(words / 220)), status,
    seo_title_en: s(fd, 'seo_title_en', 200), seo_title_zh: s(fd, 'seo_title_zh', 200), seo_desc_en: s(fd, 'seo_desc_en', 400), seo_desc_zh: s(fd, 'seo_desc_zh', 400),
    updated_at: now(), published_at: status === 'published' ? (cur?.published_at || now()) : cur?.published_at || null,
  };
  let out = aid;
  if (aid) {
    db().prepare(`UPDATE articles SET slug=@slug, type=@type, title_en=@title_en, title_zh=@title_zh, excerpt_en=@excerpt_en, excerpt_zh=@excerpt_zh, body_en=@body_en, body_zh=@body_zh,
      products=@products, applications=@applications, reading_min=@reading_min, status=@status, seo_title_en=@seo_title_en, seo_title_zh=@seo_title_zh, seo_desc_en=@seo_desc_en, seo_desc_zh=@seo_desc_zh,
      updated_at=@updated_at, published_at=@published_at WHERE id = @id`).run({ ...row, id: aid });
  } else {
    out = Number(db().prepare(`INSERT INTO articles (slug,type,title_en,title_zh,excerpt_en,excerpt_zh,body_en,body_zh,products,applications,reading_min,status,seo_title_en,seo_title_zh,seo_desc_en,seo_desc_zh,updated_at,published_at)
      VALUES (@slug,@type,@title_en,@title_zh,@excerpt_en,@excerpt_zh,@body_en,@body_zh,@products,@applications,@reading_min,@status,@seo_title_en,@seo_title_zh,@seo_desc_en,@seo_desc_zh,@updated_at,@published_at)`).run(row).lastInsertRowid);
  }
  revalidatePath('/', 'layout');
  redirect(`/HunterLin/articles/${out}?saved=${intent || 'save'}`);
}

export async function deleteArticle(fd: FormData) {
  await requireUser(can.cms);
  db().prepare('DELETE FROM articles WHERE id = ?').run(id(fd));
  redirect('/HunterLin/articles?deleted=1');
}

// ---------------- Users ----------------
// Usernames: letters, digits, dot, dash, underscore. Empty means "sign in with email only".
function username(fd: FormData) {
  const v = s(fd, 'username', 40).replace(/[^A-Za-z0-9._-]/g, '');
  return v || null;
}
export async function saveUser(fd: FormData) {
  await requireUser(can.users);
  const uid = id(fd);
  const role = ['admin', 'manager', 'sales', 'editor'].includes(s(fd, 'role')) ? s(fd, 'role') : 'sales';
  const regions = s(fd, 'regions', 400).toUpperCase().replace(/\s+/g, '');
  if (uid) {
    const uname = username(fd);
    if (uname && db().prepare('SELECT id FROM users WHERE lower(username) = lower(?) AND id <> ?').get(uname, uid)) redirect('/HunterLin/users?error=username');
    db().prepare('UPDATE users SET name=?, username=?, role=?, regions=?, active=? WHERE id = ?').run(s(fd, 'name', 120), uname, role, regions, fd.get('active') ? 1 : 0, uid);
    if (!fd.get('active')) db().prepare('DELETE FROM sessions WHERE user_id = ?').run(uid);
    const pw = String(fd.get('password') ?? '');
    if (pw.length >= 10) { db().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(pw), uid); db().prepare('DELETE FROM sessions WHERE user_id = ?').run(uid); }
    redirect('/HunterLin/users?saved=1');
  }
  const email = s(fd, 'email', 160).toLowerCase();
  const pw = String(fd.get('password') ?? '');
  if (!email || pw.length < 10) redirect('/HunterLin/users?error=new');
  if (db().prepare('SELECT id FROM users WHERE email = ?').get(email)) redirect('/HunterLin/users?error=exists');
  const uname = username(fd);
  if (uname && db().prepare('SELECT id FROM users WHERE lower(username) = lower(?)').get(uname)) redirect('/HunterLin/users?error=username');
  db().prepare('INSERT INTO users (name,email,username,password_hash,role,regions) VALUES (?,?,?,?,?,?)').run(s(fd, 'name', 120) || email, email, uname, hashPassword(pw), role, regions);
  redirect('/HunterLin/users?saved=1');
}

// Publish / unpublish buttons get their own actions so the intent never depends on the submitter's value.
export async function publishProduct(fd: FormData) { fd.set('intent', 'publish'); return saveProduct(fd); }
export async function unpublishProduct(fd: FormData) { fd.set('intent', 'unpublish'); return saveProduct(fd); }
export async function publishArticle(fd: FormData) { fd.set('intent', 'publish'); return saveArticle(fd); }
export async function unpublishArticle(fd: FormData) { fd.set('intent', 'unpublish'); return saveArticle(fd); }

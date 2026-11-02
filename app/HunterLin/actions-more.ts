'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser, can, type User } from '@/lib/auth';
import { saveUpload } from '@/lib/uploads';
import { mailAccounts, saveMailAccount, testMailAccount, sendEmail, syncMailbox, type MailAccount } from '@/lib/mail';
import { saveGscConfig, clearGscConfig, gscReport } from '@/lib/gsc';

const s = (fd: FormData, k: string, max = 5000) => String(fd.get(k) ?? '').trim().slice(0, max);
const id = (fd: FormData, k = 'id') => parseInt(String(fd.get(k) ?? ''), 10) || 0;
const withParam = (url: string, k: string, v: string) => {
  const [base, hash] = url.split('#');
  return `${base}${base.includes('?') ? '&' : '?'}${k}=${encodeURIComponent(v)}${hash ? `#${hash}` : ''}`;
};
const canUseAccount = (u: User, a: MailAccount | undefined) => !!a && (can.seeAll(u) || a.owner_id === null || a.owner_id === u.id);

// ---------------- Email ----------------
export async function sendEmailAction(fd: FormData) {
  const u = await requireUser(can.crm);
  const back = s(fd, 'back') || '/HunterLin/inbox?tab=email';
  const accountId = id(fd, 'mail_account_id');
  if (!mailAccounts(u).some((a) => a.id === accountId)) redirect(withParam(back, 'mailerror', 'no-account'));
  const files = fd.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  const r = await sendEmail({
    accountId, to: s(fd, 'to', 1000), cc: s(fd, 'cc', 1000), subject: s(fd, 'subject', 300) || '(no subject)', text: s(fd, 'body', 100000),
    inReplyTo: s(fd, 'in_reply_to', 400) || null, references: s(fd, 'references', 4000) || null, files,
    link: { account_id: id(fd, 'account_id') || null, contact_id: id(fd, 'contact_id') || null, inquiry_id: id(fd, 'inquiry_id') || null },
    user: u,
  });
  revalidatePath('/HunterLin', 'layout');
  redirect(r.ok ? withParam(back, 'sent', '1') : withParam(back, 'mailerror', r.error || 'failed'));
}

export async function checkMailNow(fd: FormData) {
  const u = await requireUser(can.crm);
  let added = 0; const errors: string[] = [];
  for (const a of mailAccounts(u)) {
    if (!a.imap_host) continue;
    const r = await syncMailbox(a.id);
    added += r.added;
    if (r.error) errors.push(`${a.email}: ${r.error}`);
  }
  const back = s(fd, 'back') || '/HunterLin/inbox?tab=email';
  redirect(errors.length ? withParam(back, 'syncerror', errors.join(' | ').slice(0, 300)) : withParam(back, 'synced', String(added)));
}

// File an email under a customer (and optionally add the sender as a contact).
export async function linkEmail(fd: FormData) {
  const u = await requireUser(can.crm);
  const eid = id(fd);
  const aid = id(fd, 'account_id') || null;
  const e = db().prepare('SELECT * FROM emails WHERE id = ?').get(eid) as any;
  if (!e) redirect('/HunterLin/inbox?tab=email');
  if (aid) {
    const acc = db().prepare('SELECT owner_id FROM accounts WHERE id = ?').get(aid) as any;
    if (!acc || !(can.seeAll(u) || acc.owner_id === u.id || acc.owner_id === null)) redirect('/HunterLin?denied=1');
  }
  db().prepare('UPDATE emails SET account_id = ? WHERE id = ?').run(aid, eid);
  if (aid && fd.get('add_contact') && e.direction === 'in' && e.from_addr) {
    const exists = db().prepare('SELECT 1 FROM contacts WHERE account_id = ? AND lower(email) = lower(?)').get(aid, e.from_addr);
    if (!exists) db().prepare('INSERT INTO contacts (account_id,name,email,created_at) VALUES (?,?,?,datetime(\'now\'))').run(aid, e.from_name || e.from_addr, e.from_addr);
  }
  redirect(`/HunterLin/inbox/email/${eid}?linked=1`);
}

export async function markEmail(fd: FormData) {
  await requireUser(can.crm);
  db().prepare('UPDATE emails SET read = ? WHERE id = ?').run(fd.get('read') === '1' ? 1 : 0, id(fd));
  redirect(s(fd, 'back') || '/HunterLin/inbox?tab=email');
}

// ---------------- Email accounts (settings) ----------------
const MAIL_FIELDS = ['label', 'email', 'from_name', 'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'imap_host', 'imap_port', 'imap_secure', 'imap_user', 'imap_pass', 'owner_id'];

export async function saveMailAccountAction(fd: FormData) {
  const u = await requireUser(can.crm);
  const mid = id(fd);
  const existing = mid ? (db().prepare('SELECT * FROM mail_accounts WHERE id = ?').get(mid) as MailAccount | undefined) : undefined;
  if (existing && !can.users(u) && existing.owner_id !== u.id) redirect('/HunterLin?denied=1');
  const v: Record<string, string> = {};
  for (const k of MAIL_FIELDS) v[k] = s(fd, k, 400);
  if (!can.users(u)) v.owner_id = String(u.id); // non-admins can only add their own mailbox
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email) || !v.smtp_host) redirect(`/HunterLin/settings/email?${mid ? `edit=${mid}&` : ''}error=fields`);
  if (!existing && !v.smtp_pass) redirect('/HunterLin/settings/email?new=1&error=password');
  const saved = saveMailAccount(v, existing);
  const a = db().prepare('SELECT * FROM mail_accounts WHERE id = ?').get(saved) as MailAccount;
  const t = await testMailAccount(a);
  redirect(`/HunterLin/settings/email?tested=${saved}&smtp=${encodeURIComponent(t.smtp)}&imap=${encodeURIComponent(t.imap)}`);
}

export async function testMailAccountAction(fd: FormData) {
  const u = await requireUser(can.crm);
  const a = db().prepare('SELECT * FROM mail_accounts WHERE id = ?').get(id(fd)) as MailAccount | undefined;
  if (!canUseAccount(u, a)) redirect('/HunterLin?denied=1');
  const t = await testMailAccount(a!);
  redirect(`/HunterLin/settings/email?tested=${a!.id}&smtp=${encodeURIComponent(t.smtp)}&imap=${encodeURIComponent(t.imap)}`);
}

export async function removeMailAccount(fd: FormData) {
  const u = await requireUser(can.crm);
  const a = db().prepare('SELECT * FROM mail_accounts WHERE id = ?').get(id(fd)) as MailAccount | undefined;
  if (!a || !(can.users(u) || a.owner_id === u.id)) redirect('/HunterLin?denied=1');
  // Keep the stored emails; just stop using the mailbox and forget its passwords.
  db().prepare(`UPDATE mail_accounts SET active = 0, smtp_pass = '', imap_pass = '' WHERE id = ?`).run(a.id);
  redirect('/HunterLin/settings/email?removed=1');
}

// ---------------- Google Search Console ----------------
export async function saveGsc(fd: FormData) {
  await requireUser(can.users);
  const property = s(fd, 'property', 300);
  let json = s(fd, 'key_json', 20000);
  const f = fd.get('key_file');
  if (f instanceof File && f.size && f.size < 20000) json = (await f.text()).trim();
  if (!property) redirect('/HunterLin/settings/integrations?error=property');
  try { saveGscConfig(property, json || null); } catch (e: any) { redirect(`/HunterLin/settings/integrations?error=${encodeURIComponent(e?.message || 'key')}`); }
  const r = await gscReport(true);
  redirect(r.error ? `/HunterLin/settings/integrations?error=${encodeURIComponent(r.error)}` : '/HunterLin/settings/integrations?ok=1');
}
export async function refreshGsc() {
  await requireUser((x) => can.crm(x) || can.cms(x));
  const r = await gscReport(true);
  redirect(r.error ? `/HunterLin/analytics?tab=search&error=${encodeURIComponent(r.error)}` : '/HunterLin/analytics?tab=search&refreshed=1');
}
export async function disconnectGsc() {
  await requireUser(can.users);
  clearGscConfig();
  redirect('/HunterLin/settings/integrations?removed=1');
}

// ---------------- Customer logos ----------------
export async function saveLogo(fd: FormData) {
  await requireUser(can.cms);
  const lid = id(fd);
  const name = s(fd, 'name', 80);
  const url = s(fd, 'url', 300);
  const safeUrl = /^https?:\/\//.test(url) ? url : '';
  const cur = lid ? (db().prepare('SELECT * FROM logos WHERE id = ?').get(lid) as any) : null;
  let image: string | null = cur?.image || null;
  if (fd.get('image_remove')) image = null;
  const f = fd.get('image');
  if (f instanceof File && f.size) {
    const st = await saveUpload(f, 'public');
    if (!st || !/\.(png|jpe?g|webp|svg|gif)$/i.test(st.id)) redirect('/HunterLin/logos?error=image');
    image = st.id;
  }
  if (!name) redirect('/HunterLin/logos?error=name');
  if (cur) db().prepare('UPDATE logos SET name = ?, url = ?, image = ?, visible = ? WHERE id = ?').run(name, safeUrl || null, image, fd.get('visible') ? 1 : 0, lid);
  else {
    const max = (db().prepare('SELECT coalesce(max(sort), -1) m FROM logos').get() as any).m;
    db().prepare('INSERT INTO logos (name, url, image, sort, visible) VALUES (?,?,?,?,1)').run(name, safeUrl || null, image, max + 1);
  }
  revalidatePath('/', 'layout');
  redirect('/HunterLin/logos?saved=1');
}

export async function moveLogo(fd: FormData) {
  await requireUser(can.cms);
  const rows = db().prepare('SELECT id FROM logos ORDER BY sort, id').all() as { id: number }[];
  const i = rows.findIndex((r) => r.id === id(fd));
  const j = i + (s(fd, 'dir') === 'up' ? -1 : 1);
  if (i >= 0 && j >= 0 && j < rows.length) {
    [rows[i], rows[j]] = [rows[j], rows[i]];
    const upd = db().prepare('UPDATE logos SET sort = ? WHERE id = ?');
    db().transaction(() => rows.forEach((r, k) => upd.run(k, r.id)))();
  }
  revalidatePath('/', 'layout');
  redirect('/HunterLin/logos');
}

export async function deleteLogo(fd: FormData) {
  await requireUser(can.cms);
  db().prepare('DELETE FROM logos WHERE id = ?').run(id(fd));
  revalidatePath('/', 'layout');
  redirect('/HunterLin/logos?deleted=1');
}

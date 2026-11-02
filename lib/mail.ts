import 'server-only';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail, type AddressObject } from 'mailparser';
import { db, now } from './db';
import { seal, unseal } from './secrets';
import { saveBuffer, saveUpload, type Stored } from './uploads';
import { logActivity } from './crm';
import type { User } from './auth';

// Company mailboxes. Outgoing mail goes through each account's SMTP server; replies are
// fetched from its IMAP inbox and filed against the matching customer, contact or inquiry.

export type MailAccount = {
  id: number; label: string; email: string; from_name: string;
  smtp_host: string; smtp_port: number; smtp_secure: number; smtp_user: string; smtp_pass: string;
  imap_host: string; imap_port: number; imap_secure: number; imap_user: string; imap_pass: string;
  owner_id: number | null; active: number; last_uid: number; last_sync: string | null; last_error: string | null;
};

export function mailAccounts(u?: User): MailAccount[] {
  const rows = db().prepare('SELECT * FROM mail_accounts WHERE active = 1 ORDER BY owner_id IS NOT NULL, label, email').all() as MailAccount[];
  if (!u || u.role === 'admin' || u.role === 'manager') return rows;
  return rows.filter((a) => a.owner_id === null || a.owner_id === u.id);
}

export function saveMailAccount(fd: Record<string, string>, existing?: MailAccount) {
  const row = {
    label: fd.label || fd.email, email: fd.email.trim().toLowerCase(), from_name: fd.from_name || '',
    smtp_host: fd.smtp_host, smtp_port: Number(fd.smtp_port) || 465, smtp_secure: fd.smtp_secure === '1' ? 1 : 0, smtp_user: fd.smtp_user || fd.email,
    smtp_pass: fd.smtp_pass ? seal(fd.smtp_pass) : existing?.smtp_pass || '',
    imap_host: fd.imap_host || '', imap_port: Number(fd.imap_port) || 993, imap_secure: fd.imap_secure === '0' ? 0 : 1, imap_user: fd.imap_user || fd.smtp_user || fd.email,
    imap_pass: fd.imap_pass ? seal(fd.imap_pass) : fd.smtp_pass && !existing?.imap_pass ? seal(fd.smtp_pass) : existing?.imap_pass || '',
    owner_id: fd.owner_id ? Number(fd.owner_id) : null,
  };
  if (existing) {
    db().prepare(`UPDATE mail_accounts SET label=@label, email=@email, from_name=@from_name, smtp_host=@smtp_host, smtp_port=@smtp_port, smtp_secure=@smtp_secure, smtp_user=@smtp_user, smtp_pass=@smtp_pass,
      imap_host=@imap_host, imap_port=@imap_port, imap_secure=@imap_secure, imap_user=@imap_user, imap_pass=@imap_pass, owner_id=@owner_id WHERE id=@id`).run({ ...row, id: existing.id });
    return existing.id;
  }
  return Number(db().prepare(`INSERT INTO mail_accounts (label,email,from_name,smtp_host,smtp_port,smtp_secure,smtp_user,smtp_pass,imap_host,imap_port,imap_secure,imap_user,imap_pass,owner_id)
    VALUES (@label,@email,@from_name,@smtp_host,@smtp_port,@smtp_secure,@smtp_user,@smtp_pass,@imap_host,@imap_port,@imap_secure,@imap_user,@imap_pass,@owner_id)`).run(row).lastInsertRowid);
}

const transport = (a: MailAccount) => nodemailer.createTransport({
  host: a.smtp_host, port: a.smtp_port, secure: !!a.smtp_secure,
  auth: a.smtp_user ? { user: a.smtp_user, pass: unseal(a.smtp_pass) } : undefined,
  connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
  // Local test servers only: allow self-signed certificates when explicitly enabled.
  tls: process.env.MAIL_ALLOW_SELF_SIGNED === '1' ? { rejectUnauthorized: false } : undefined,
});
const imap = (a: MailAccount) => new ImapFlow({
  host: a.imap_host, port: a.imap_port, secure: !!a.imap_secure,
  auth: { user: a.imap_user || a.email, pass: unseal(a.imap_pass) },
  logger: false, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 60000,
  tls: process.env.MAIL_ALLOW_SELF_SIGNED === '1' ? { rejectUnauthorized: false } : undefined,
});

// Check that both servers accept the credentials.
export async function testMailAccount(a: MailAccount): Promise<{ smtp: string; imap: string }> {
  const out = { smtp: 'ok', imap: a.imap_host ? 'ok' : 'not configured' };
  try { await transport(a).verify(); } catch (e: any) { out.smtp = e?.message || String(e); }
  if (a.imap_host) {
    const c = imap(a);
    try { await c.connect(); await c.logout(); } catch (e: any) { out.imap = e?.message || String(e); }
  }
  return out;
}

const addrList = (v: string) => v.split(/[,;\s]+/).map((x) => x.trim()).filter((x) => /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(x));

export type SendInput = {
  accountId: number; to: string; cc?: string; subject: string; text: string;
  inReplyTo?: string | null; references?: string | null; files?: File[];
  link: { account_id?: number | null; contact_id?: number | null; inquiry_id?: number | null };
  user: User;
};

export async function sendEmail(i: SendInput): Promise<{ ok: boolean; error?: string; id?: number }> {
  const a = db().prepare('SELECT * FROM mail_accounts WHERE id = ? AND active = 1').get(i.accountId) as MailAccount | undefined;
  if (!a) return { ok: false, error: 'no-account' };
  const to = addrList(i.to), cc = addrList(i.cc || '');
  if (!to.length) return { ok: false, error: 'no-recipient' };
  // File mail to a known contact under their customer even when written from the general inbox.
  if (!i.link.account_id) {
    const c = db().prepare('SELECT id, account_id FROM contacts WHERE lower(email) = lower(?) LIMIT 1').get(to[0]) as any;
    if (c) i.link = { ...i.link, account_id: c.account_id, contact_id: i.link.contact_id ?? c.id };
  }
  const stored: Stored[] = [];
  for (const f of i.files || []) { const st = await saveUpload(f, 'private'); if (st) stored.push(st); }
  const domain = a.email.split('@')[1] || 'localhost';
  const messageId = `<${crypto.randomBytes(12).toString('hex')}@${domain}>`;
  const refs = [i.references, i.inReplyTo].filter(Boolean).join(' ').trim() || undefined;
  const msg = {
    from: a.from_name ? { name: a.from_name, address: a.email } : a.email,
    to, cc: cc.length ? cc : undefined, subject: i.subject, text: i.text, messageId,
    inReplyTo: i.inReplyTo || undefined, references: refs,
    attachments: await Promise.all((i.files || []).filter((f) => f.size).map(async (f) => ({ filename: f.name, content: Buffer.from(await f.arrayBuffer()) }))),
  };
  let status = 'sent', error: string | null = null;
  try {
    const info = await transport(a).sendMail(msg);
    if (info.rejected?.length) { status = 'failed'; error = `Rejected: ${info.rejected.join(', ')}`; }
  } catch (e: any) { status = 'failed'; error = e?.message || String(e); }
  const id = Number(db().prepare(`INSERT INTO emails (mail_account_id,direction,status,message_id,in_reply_to,refs,from_addr,from_name,to_addrs,cc_addrs,subject,body_text,attachments,error,account_id,contact_id,inquiry_id,user_id,read,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`).run(a.id, 'out', status, messageId, i.inReplyTo || null, refs || null, a.email, a.from_name, to.join(', '), cc.join(', '), i.subject, i.text, JSON.stringify(stored), error,
    i.link.account_id ?? null, i.link.contact_id ?? null, i.link.inquiry_id ?? null, i.user.id, now()).lastInsertRowid);
  if (status === 'sent') {
    logActivity({ account_id: i.link.account_id, inquiry_id: i.link.inquiry_id, user_id: i.user.id, kind: 'email', body: `Email sent to ${to.join(', ')}: ${i.subject}` });
    if (i.link.inquiry_id) db().prepare(`UPDATE inquiries SET first_response_at = coalesce(first_response_at, ?), status = CASE WHEN status = 'new' THEN 'qualified' ELSE status END WHERE id = ?`).run(now(), i.link.inquiry_id);
    // keep a copy in the mailbox's Sent folder when IMAP is set up (best effort)
    if (a.imap_host) appendSent(a, msg).catch(() => {});
  }
  return status === 'sent' ? { ok: true, id } : { ok: false, error: error || 'failed', id };
}

async function appendSent(a: MailAccount, msg: any) {
  const raw: Buffer = await new Promise((res, rej) => {
    const t = nodemailer.createTransport({ streamTransport: true, buffer: true });
    t.sendMail(msg, (err, info: any) => (err ? rej(err) : res(info.message as Buffer)));
  });
  const c = imap(a);
  await c.connect();
  try {
    const boxes = await c.list();
    const sent = boxes.find((b: any) => b.specialUse === '\\Sent')?.path || boxes.find((b: any) => /^(sent|sent items|sent messages|已发送)/i.test(b.name))?.path;
    if (sent) await c.append(sent, raw, ['\\Seen']);
  } finally { await c.logout().catch(() => {}); }
}

// File an incoming message against what we know: an earlier email in the thread, a contact, or an inquiry.
function linkFor(fromAddr: string, inReplyTo: string | null, refs: string | null) {
  const ids = [inReplyTo, ...(refs || '').split(/\s+/)].filter(Boolean) as string[];
  for (const mid of ids) {
    const e = db().prepare('SELECT account_id, contact_id, inquiry_id FROM emails WHERE message_id = ? LIMIT 1').get(mid) as any;
    if (e && (e.account_id || e.inquiry_id)) return e;
  }
  const c = db().prepare('SELECT id, account_id FROM contacts WHERE lower(email) = lower(?) LIMIT 1').get(fromAddr) as any;
  const inq = db().prepare('SELECT id, account_id FROM inquiries WHERE lower(email) = lower(?) ORDER BY created_at DESC LIMIT 1').get(fromAddr) as any;
  if (c || inq) return { account_id: c?.account_id ?? inq?.account_id ?? null, contact_id: c?.id ?? null, inquiry_id: inq?.id ?? null };
  return { account_id: null, contact_id: null, inquiry_id: null };
}

const first = (a?: AddressObject | AddressObject[]) => (Array.isArray(a) ? a[0] : a)?.value?.[0];
const list = (a?: AddressObject | AddressObject[]) => (Array.isArray(a) ? a : a ? [a] : []).flatMap((x) => x.value.map((v) => v.address)).filter(Boolean).join(', ');

// Store one raw RFC 822 message. Returns the email id, or null if it was already stored.
export async function ingestRaw(a: Pick<MailAccount, 'id' | 'email'>, raw: Buffer, uid: number | null): Promise<number | null> {
  const m: ParsedMail = await simpleParser(raw);
  const messageId = m.messageId || `<uid-${a.id}-${uid}@local>`;
  if (db().prepare('SELECT 1 FROM emails WHERE message_id = ? AND mail_account_id = ?').get(messageId, a.id)) return null;
  const from = first(m.from);
  const fromAddr = (from?.address || '').toLowerCase();
  if (fromAddr === a.email.toLowerCase()) return null; // our own message
  const inReplyTo = (m.inReplyTo as string) || null;
  const refs = Array.isArray(m.references) ? m.references.join(' ') : (m.references as string) || null;
  const link = linkFor(fromAddr, inReplyTo, refs);
  const atts = (m.attachments || []).filter((x) => x.contentDisposition !== 'inline' || !x.contentId).slice(0, 10)
    .map((x) => saveBuffer(x.filename || 'attachment', x.content, 'private')).filter(Boolean);
  const text = (m.text || (m.html ? String(m.html).replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : '')).slice(0, 100000);
  const at = (m.date || new Date()).toISOString().slice(0, 19).replace('T', ' ');
  const id = Number(db().prepare(`INSERT INTO emails (mail_account_id,direction,status,message_id,in_reply_to,refs,from_addr,from_name,to_addrs,cc_addrs,subject,body_text,attachments,imap_uid,account_id,contact_id,inquiry_id,read,created_at)
    VALUES (?,'in','received',?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?)`).run(a.id, messageId, inReplyTo, refs, fromAddr, from?.name || '', list(m.to), list(m.cc), m.subject || '', text,
    JSON.stringify(atts), uid, link.account_id, link.contact_id, link.inquiry_id, at).lastInsertRowid);
  if (link.account_id || link.inquiry_id) logActivity({ account_id: link.account_id, inquiry_id: link.inquiry_id, kind: 'email', body: `Email received from ${fromAddr}: ${m.subject || ''}` });
  return id;
}

// Fetch new messages from the inbox. First run looks back 30 days (max 200 messages).
export async function syncMailbox(accountId: number): Promise<{ added: number; error?: string }> {
  const a = db().prepare('SELECT * FROM mail_accounts WHERE id = ?').get(accountId) as MailAccount | undefined;
  if (!a || !a.imap_host) return { added: 0, error: 'imap-not-configured' };
  const c = imap(a);
  let added = 0, maxUid = a.last_uid || 0;
  try {
    await c.connect();
    const lock = await c.getMailboxLock('INBOX');
    try {
      const range = a.last_uid ? { uid: `${a.last_uid + 1}:*` } : { since: new Date(Date.now() - 30 * 86400000) };
      const uids = ((await c.search(range as any, { uid: true })) || []).filter((u: number) => u > (a.last_uid || 0)).slice(-200);
      for (const uid of uids) {
        const msg = await c.fetchOne(String(uid), { source: true, uid: true }, { uid: true });
        if (msg && (msg as any).source && (await ingestRaw(a, (msg as any).source, uid))) added++;
        if (uid > maxUid) maxUid = uid;
      }
    } finally { lock.release(); }
    await c.logout();
    db().prepare('UPDATE mail_accounts SET last_uid = ?, last_sync = ?, last_error = NULL WHERE id = ?').run(maxUid, now(), a.id);
    return { added };
  } catch (e: any) {
    const error = e?.responseText || e?.message || String(e);
    db().prepare('UPDATE mail_accounts SET last_sync = ?, last_error = ? WHERE id = ?').run(now(), error, a.id);
    try { await c.logout(); } catch { /* already closed */ }
    return { added, error };
  }
}

// Sync every mailbox the user can see if it hasn't been checked for a few minutes.
const running = new Set<number>();
export function syncIfStale(u: User, minutes = 5) {
  for (const a of mailAccounts(u)) {
    if (!a.imap_host || running.has(a.id)) continue;
    const last = a.last_sync ? new Date(a.last_sync.replace(' ', 'T') + 'Z').getTime() : 0;
    if (Date.now() - last < minutes * 60000) continue;
    running.add(a.id);
    syncMailbox(a.id).finally(() => running.delete(a.id));
  }
}

export const quoteText = (e: { created_at: string; from_name?: string; from_addr: string; body_text: string }) =>
  `\n\n\nOn ${e.created_at} UTC, ${e.from_name ? `${e.from_name} <${e.from_addr}>` : e.from_addr} wrote:\n` + (e.body_text || '').split('\n').slice(0, 60).map((l) => `> ${l}`).join('\n');

import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { verifyPassword } from './password';

export const SESSION_COOKIE = 'aw_session';

export type Role = 'admin' | 'manager' | 'sales' | 'editor';
export type User = { id: number; name: string; email: string; username?: string | null; role: Role; regions: string };

// What each role may do. Sales reps only see records they own (or unassigned inquiries).
export const can = {
  crm: (u: User) => u.role !== 'editor',
  cms: (u: User) => u.role === 'admin' || u.role === 'editor' || u.role === 'manager',
  seeAll: (u: User) => u.role === 'admin' || u.role === 'manager',
  users: (u: User) => u.role === 'admin',
  assign: (u: User) => u.role === 'admin' || u.role === 'manager',
};

export const roleLabel: Record<Role, string> = {
  admin: 'Administrator', manager: 'Sales manager', sales: 'Sales rep', editor: 'Content editor',
};

// Sign in with either the username (case-insensitive) or the work email.
export async function login(identifier: string, password: string) {
  const id = identifier.trim().toLowerCase();
  const row = db().prepare('SELECT * FROM users WHERE (lower(email) = ? OR lower(username) = ?) AND active = 1').get(id, id) as any;
  if (!row || !verifyPassword(password, row.password_hash)) return false;
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 14 * 86400000);
  db().prepare('INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)').run(token, row.id, expires.toISOString());
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1', path: '/', expires });
  return true;
}

export async function logout() {
  const c = await cookies();
  const t = c.get(SESSION_COOKIE)?.value;
  if (t) db().prepare('DELETE FROM sessions WHERE token = ?').run(t);
  c.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const t = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const row = db().prepare(`SELECT u.id,u.name,u.email,u.username,u.role,u.regions FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ? AND u.active = 1`).get(t, new Date().toISOString()) as User | undefined;
  return row || null;
}

export async function requireUser(check?: (u: User) => boolean): Promise<User> {
  const u = await currentUser();
  if (!u) redirect('/HunterLin/login');
  if (check && !check(u)) redirect('/HunterLin?denied=1');
  return u;
}

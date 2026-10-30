import Link from 'next/link';
import { site } from '@/lib/site';
import { can, roleLabel, type User } from '@/lib/auth';
import { db } from '@/lib/db';
import { logoutAction } from '@/app/admin/actions';
import { SideLink, MobileToggle } from './client';

export function Shell({ user, children }: { user: User; children: React.ReactNode }) {
  const scope = can.seeAll(user) ? '' : `AND (owner_id = ${user.id} OR owner_id IS NULL)`;
  const newInq = can.crm(user) ? (db().prepare(`SELECT COUNT(*) c FROM inquiries WHERE status = 'new' ${scope}`).get() as any).c : 0;
  const overdue = (db().prepare(`SELECT COUNT(*) c FROM tasks WHERE done = 0 AND user_id = ? AND due_at < datetime('now')`).get(user.id) as any).c;
  return (
    <div className="shell" id="shell">
      <div className="mobile-bar"><strong>{site.brand} Admin</strong><MobileToggle /></div>
      <aside className="side">
        <Link href="/admin" className="side-brand">
          <svg viewBox="0 0 30 26" aria-hidden="true"><circle cx="8" cy="18" r="6.6" fill="#d17a3f" /><circle cx="22" cy="18" r="6.6" fill="#d17a3f" /><circle cx="15" cy="6.6" r="6.6" fill="currentColor" /></svg>
          <div><b>{site.brand}</b><span>Website &amp; CRM</span></div>
        </Link>
        <nav className="side-group" aria-label="Overview">
          <SideLink href="/admin" exact>Dashboard</SideLink>
          <SideLink href="/admin/tasks" badge={overdue || undefined}>My follow-ups</SideLink>
        </nav>
        {can.crm(user) && (
          <nav className="side-group" aria-label="Sales">
            <h2>Sales</h2>
            <SideLink href="/admin/inquiries" badge={newInq || undefined}>Inquiries</SideLink>
            <SideLink href="/admin/accounts">Customers</SideLink>
            <SideLink href="/admin/pipeline">Pipeline</SideLink>
            <SideLink href="/admin/quotes">Quotes</SideLink>
            <SideLink href="/admin/samples">Samples</SideLink>
            <SideLink href="/admin/analytics">Analytics</SideLink>
          </nav>
        )}
        {can.cms(user) && (
          <nav className="side-group" aria-label="Website">
            <h2>Website</h2>
            <SideLink href="/admin/products">Products</SideLink>
            <SideLink href="/admin/articles">News &amp; articles</SideLink>
            <a href="/en" target="_blank" rel="noreferrer">View site ↗</a>
          </nav>
        )}
        {can.users(user) && (
          <nav className="side-group" aria-label="Settings">
            <h2>Settings</h2>
            <SideLink href="/admin/users">Team &amp; permissions</SideLink>
          </nav>
        )}
        <div className="side-foot">
          <strong>{user.name}</strong>
          <span>{roleLabel[user.role]}</span>
          <form action={logoutAction}><button type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

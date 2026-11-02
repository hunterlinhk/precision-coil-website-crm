import Link from 'next/link';
import { site } from '@/lib/site';
import { can, type User } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminLang, label } from '@/lib/admin-lang';
import { logoutAction } from '@/app/HunterLin/actions';
import { SideLink, MobileToggle, LangToggle } from './client';

// Navigation: one overview, three sales screens, the website, and settings.
export async function Shell({ user, children }: { user: User; children: React.ReactNode }) {
  const l = await adminLang();
  const tr = (en: string, zh: string) => (l === 'zh' ? zh : en);
  const scope = can.seeAll(user) ? '' : `AND (owner_id = ${user.id} OR owner_id IS NULL)`;
  const newInq = can.crm(user) ? (db().prepare(`SELECT COUNT(*) c FROM inquiries WHERE status = 'new' ${scope}`).get() as any).c : 0;
  const unreadMail = can.crm(user) ? (db().prepare(`SELECT COUNT(*) c FROM emails WHERE direction = 'in' AND read = 0`).get() as any).c : 0;
  return (
    <div className="shell" id="shell">
      <div className="mobile-bar"><strong>{site.brand}</strong><MobileToggle label={tr('Menu', '菜单')} /></div>
      <aside className="side">
        <Link href="/HunterLin" className="side-brand">
          <svg viewBox="0 0 30 26" aria-hidden="true"><circle cx="8" cy="18.4" r="6.2" fill="currentColor" /><circle cx="22" cy="18.4" r="6.2" fill="currentColor" /><circle cx="15" cy="6.4" r="6.2" fill="#c4652c" /></svg>
          <div><b>{site.brand}</b><span>{tr('Website & CRM', '官网与客户管理')}</span></div>
        </Link>
        <nav className="side-group" aria-label={tr('Overview', '概览')}>
          <SideLink href="/HunterLin" exact>{tr('Dashboard', '工作台')}</SideLink>
        </nav>
        {can.crm(user) && (
          <nav className="side-group" aria-label={tr('Sales', '销售')}>
            <h2>{tr('Sales', '销售')}</h2>
            <SideLink href="/HunterLin/inbox" also={['/HunterLin/inquiries']} badge={newInq + unreadMail || undefined}>{tr('Inbox', '收件箱')}</SideLink>
            <SideLink href="/HunterLin/accounts" also={['/HunterLin/quotes']}>{tr('Customers', '客户')}</SideLink>
            <SideLink href="/HunterLin/pipeline" also={['/HunterLin/opportunities']}>{tr('Deals', '商机')}</SideLink>
          </nav>
        )}
        {(can.cms(user) || can.crm(user)) && (
          <nav className="side-group" aria-label={tr('Website', '网站')}>
            <h2>{tr('Website', '网站')}</h2>
            {can.cms(user) && <SideLink href="/HunterLin/products">{tr('Products', '产品')}</SideLink>}
            {can.cms(user) && <SideLink href="/HunterLin/articles">{tr('News & articles', '新闻与文章')}</SideLink>}
            {can.cms(user) && <SideLink href="/HunterLin/logos">{tr('Customer logos', '客户标志')}</SideLink>}
            <SideLink href="/HunterLin/analytics">{tr('Analytics', '数据分析')}</SideLink>
            <a href={`/${l === 'zh' ? 'zh' : 'en'}`} target="_blank" rel="noreferrer">{tr('View site ↗', '查看网站 ↗')}</a>
          </nav>
        )}
        {(can.crm(user) || can.users(user)) && <nav className="side-group" aria-label={tr('Settings', '设置')}>
          <h2>{tr('Settings', '设置')}</h2>
          {can.crm(user) && <SideLink href="/HunterLin/settings/email">{tr('Email accounts', '邮箱账户')}</SideLink>}
          {can.users(user) && <SideLink href="/HunterLin/settings/integrations">{tr('Google Search Console', '谷歌搜索数据')}</SideLink>}
          {can.users(user) && <SideLink href="/HunterLin/users">{tr('Team & permissions', '团队与权限')}</SideLink>}
        </nav>}
        <div className="side-foot">
          <LangToggle current={l} />
          <strong>{user.name}</strong>
          <span>{label(user.role, l)}</span>
          <form action={logoutAction}><button type="submit">{tr('Sign out', '退出登录')}</button></form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

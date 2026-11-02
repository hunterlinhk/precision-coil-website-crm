import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { site } from '@/lib/site';
import { translator } from '@/lib/admin-lang';
import { LangToggle } from '@/components/admin/client';
import { loginAction } from '@/app/HunterLin/actions';

export const metadata = { title: 'Sign in' };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect('/HunterLin');
  const { l, tr } = await translator();
  const { error } = await searchParams;
  return (
    <div className="login">
      <div className="login-art">
        <svg viewBox="0 0 30 26" width="40" aria-hidden="true"><circle cx="8" cy="18.4" r="6.2" fill="#ecece8" /><circle cx="22" cy="18.4" r="6.2" fill="#ecece8" /><circle cx="15" cy="6.4" r="6.2" fill="#c4652c" /></svg>
        <div>
          <h2 style={{ fontSize: '2.6rem', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.05, color: '#fff' }}>{tr(`${site.brand} website & CRM`, `${site.brand} 官网与客户管理`)}</h2>
          <p style={{ marginTop: 12 }}>{tr('Website inquiries, customer email, deals and website content, all in one place.', '网站询盘、客户邮件、商机和网站内容，都在这里统一管理。')}</p>
        </div>
        <p style={{ fontSize: '0.85rem' }}>{site.legalName}</p>
      </div>
      <div className="login-form">
        <form action={loginAction} className="form">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><h1>{tr('Sign in', '登录')}</h1><span className="login-lang"><LangToggle current={l} /></span></div>
          {error && <p className="notice bad">{tr('That username and password don’t match an active account.', '用户名或密码不正确，或账号已停用。')}</p>}
          <div className="f"><label htmlFor="username">{tr('Username or work email', '用户名或工作邮箱')}</label><input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required defaultValue={process.env.NODE_ENV !== 'production' ? 'HunterLin' : ''} /></div>
          <div className="f"><label htmlFor="password">{tr('Password', '密码')}</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
          <button className="btn btn-primary" style={{ height: 40 }} type="submit">{tr('Sign in', '登录')}</button>
          {process.env.NODE_ENV !== 'production' && <p className="muted" style={{ fontSize: '0.85rem' }}>{tr('Development: administrator ', '开发环境：管理员 ')}<code>HunterLin</code>{tr(', password from ADMIN_PASSWORD (default ', '，密码为 ADMIN_PASSWORD（默认 ')}<code>arcwind-demo</code>{tr(').', '）。')}</p>}
        </form>
      </div>
    </div>
  );
}

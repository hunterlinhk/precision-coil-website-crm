import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { site } from '@/lib/site';
import { loginAction } from '@/app/admin/actions';

export const metadata = { title: 'Sign in' };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect('/admin');
  const { error } = await searchParams;
  return (
    <div className="login">
      <div className="login-art">
        <svg viewBox="0 0 30 26" width="40" aria-hidden="true"><circle cx="8" cy="18" r="6.6" fill="#d17a3f" /><circle cx="22" cy="18" r="6.6" fill="#d17a3f" /><circle cx="15" cy="6.6" r="6.6" fill="#e3ece8" /></svg>
        <div>
          <h2 style={{ fontSize: '2rem', fontStretch: '118%', color: '#fff' }}>{site.brand} website &amp; CRM</h2>
          <p style={{ marginTop: 12 }}>Every website inquiry lands here with its source, drawings and an owner. Product pages and articles are edited and published from the same place.</p>
        </div>
        <p style={{ fontSize: '0.85rem' }}>{site.legalName}</p>
      </div>
      <div className="login-form">
        <form action={loginAction} className="form">
          <h1>Sign in</h1>
          {error && <p className="notice bad">That email and password don&apos;t match an active account.</p>}
          <div className="f"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="username" required defaultValue={process.env.NODE_ENV !== 'production' ? 'admin@arcwind.example' : ''} /></div>
          <div className="f"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
          <button className="btn btn-primary" style={{ height: 40 }} type="submit">Sign in</button>
          <p className="muted" style={{ fontSize: '0.85rem' }}>Demo accounts use the password set in ADMIN_PASSWORD (default <code>arcwind-demo</code>). See README.</p>
        </form>
      </div>
    </div>
  );
}

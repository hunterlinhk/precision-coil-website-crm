'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { setAdminLang } from '@/app/HunterLin/actions';

export function SideLink({ href, children, badge, exact, also = [] }: { href: string; children: React.ReactNode; badge?: number; exact?: boolean; also?: string[] }) {
  const path = usePathname() || '';
  const active = exact ? path === href : [href, ...also].some((h) => path === h || path.startsWith(h + '/'));
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}>
      <span>{children}</span>
      {badge ? <span className="badge">{badge}</span> : null}
    </Link>
  );
}

export function MobileToggle({ label = 'Menu' }: { label?: string }) {
  const path = usePathname();
  useEffect(() => { document.getElementById('shell')?.removeAttribute('data-open'); }, [path]);
  return <button type="button" onClick={() => document.getElementById('shell')?.toggleAttribute('data-open')}>{label}</button>;
}

// 中文 / EN switch for the admin. Saved per browser and per user.
export function LangToggle({ current }: { current: 'en' | 'zh' }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (l: 'en' | 'zh') => start(async () => { await setAdminLang(l); router.refresh(); });
  return (
    <div className="lang-toggle" role="group" aria-label="Language / 语言">
      <button type="button" aria-pressed={current === 'zh'} disabled={pending} onClick={() => set('zh')}>中文</button>
      <button type="button" aria-pressed={current === 'en'} disabled={pending} onClick={() => set('en')}>EN</button>
    </div>
  );
}

// Submit button that asks for confirmation (used for destructive actions).
export function ConfirmButton({ children, message, className, formAction }: { children: React.ReactNode; message: string; className?: string; formAction?: (fd: FormData) => void | Promise<void> }) {
  return <button type="submit" formAction={formAction} formNoValidate={!!formAction} className={className || 'btn btn-danger'} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>{children}</button>;
}

// Auto-submit a select inside a server-action form.
export function AutoSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

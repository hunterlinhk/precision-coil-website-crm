'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function SideLink({ href, children, badge, exact }: { href: string; children: React.ReactNode; badge?: number; exact?: boolean }) {
  const path = usePathname() || '';
  const active = exact ? path === href : path === href || path.startsWith(href + '/');
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}>
      <span>{children}</span>
      {badge ? <span className="badge">{badge}</span> : null}
    </Link>
  );
}

export function MobileToggle() {
  const path = usePathname();
  useEffect(() => { document.getElementById('shell')?.removeAttribute('data-open'); }, [path]);
  return <button type="button" onClick={() => document.getElementById('shell')?.toggleAttribute('data-open')}>Menu</button>;
}

// Submit button that asks for confirmation (used for destructive actions).
export function ConfirmButton({ children, message, className, formAction }: { children: React.ReactNode; message: string; className?: string; formAction?: (fd: FormData) => void | Promise<void> }) {
  return <button type="submit" formAction={formAction} formNoValidate={!!formAction} className={className || 'btn btn-danger'} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>{children}</button>;
}

// Auto-submit a select inside a server-action form.
export function AutoSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

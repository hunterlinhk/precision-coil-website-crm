'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { flyToQuote } from './motion';
import { withBase } from '@/lib/base';

// ---------- Quote list (RFQ basket), stored per browser ----------
export type RfqItem = { model: string; slug: string; category: string; name_en: string; name_zh: string; qty: string };
type Ctx = { items: RfqItem[]; add: (i: RfqItem) => void; remove: (model: string) => void; setQty: (model: string, qty: string) => void; clear: () => void; ready: boolean };
const RfqCtx = createContext<Ctx>({ items: [], add: () => {}, remove: () => {}, setQty: () => {}, clear: () => {}, ready: false });
const KEY = 'aw_rfq';

export function RfqProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<RfqItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { /* storage unavailable */ }
    setReady(true);
  }, []);
  const save = useCallback((next: RfqItem[]) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);
  const ctx: Ctx = {
    items, ready,
    add: (i) => save(items.some((x) => x.model === i.model) ? items : [...items, i]),
    remove: (m) => save(items.filter((x) => x.model !== m)),
    setQty: (m, q) => save(items.map((x) => (x.model === m ? { ...x, qty: q } : x))),
    clear: () => save([]),
  };
  return <RfqCtx.Provider value={ctx}>{children}</RfqCtx.Provider>;
}
export const useRfq = () => useContext(RfqCtx);

export function RfqCount({ locale, label }: { locale: string; label: string }) {
  const { items } = useRfq();
  return (
    <Link href={`/${locale}/contact`} className="rfq-count" aria-label={`${label}: ${items.length}`}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3h12v14H4z M7 7h6 M7 10h6 M7 13h4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      <span className="rfq-label">{label}</span>
      <span className="rfq-n" data-empty={items.length === 0}>{items.length}</span>
    </Link>
  );
}

export function AddToRfq({ item, labels, size, variant }: { item: Omit<RfqItem, 'qty'>; labels: { add: string; added: string }; size?: 'sm'; variant?: 'icon' }) {
  const { items, add, remove, ready } = useRfq();
  const inList = items.some((x) => x.model === item.model);
  if (variant === 'icon') {
    return (
      <button type="button" className="icon-btn" aria-pressed={inList} disabled={!ready} title={inList ? labels.added : labels.add}
        aria-label={`${inList ? labels.added : labels.add}: ${item.model}`} onClick={(e) => { if (inList) remove(item.model); else { flyToQuote(e.currentTarget); add({ ...item, qty: '' }); } }}>
        {inList
          ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
          : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v11M2.5 8h11" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`btn ${inList ? 'btn-done' : 'btn-solid'} ${size === 'sm' ? 'btn-sm' : ''}`}
      aria-pressed={inList}
      disabled={!ready}
      onClick={(e) => { if (inList) remove(item.model); else { flyToQuote(e.currentTarget); add({ ...item, qty: '' }); } }}
    >
      {inList ? (
        <><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>{labels.added}</>
      ) : (
        <><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>{labels.add}</>
      )}
    </button>
  );
}

// ---------- Language switch: keeps the visitor on the same page ----------
export function LangSwitch({ locale, label, name }: { locale: string; label: string; name: string }) {
  const path = usePathname() || `/${locale}`;
  const other = locale === 'en' ? 'zh' : 'en';
  const href = path.replace(/^\/(en|zh)(?=\/|$)/, `/${other}`);
  return (
    <a href={withBase(href) + (process.env.NEXT_PUBLIC_STATIC_PREVIEW === '1' && !href.endsWith('/') ? '/' : '')} className="lang" hrefLang={other === 'zh' ? 'zh-CN' : 'en'} aria-label={label}
      onClick={() => { document.cookie = `aw_locale=${other}; path=/; max-age=31536000; samesite=lax`; }}>
      {name}
    </a>
  );
}

// ---------- Mobile navigation ----------
export function NavToggle({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { document.documentElement.toggleAttribute('data-nav-open', open); }, [open]);
  return (
    <button type="button" className="nav-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
      <span className="sr-only">{label}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" /> : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" />}</svg>
    </button>
  );
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname() || '';
  const active = path === href || path.startsWith(href + '/');
  return <Link href={href} aria-current={active ? 'page' : undefined}>{children}</Link>;
}

// ---------- First-touch attribution: where did this visitor come from? ----------
export function SourceTracker() {
  useEffect(() => {
    try {
      if (localStorage.getItem('aw_src')) return;
      const u = new URL(location.href);
      const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => (u.searchParams.get(k) ? `${k}=${u.searchParams.get(k)}` : '')).filter(Boolean).join('&');
      localStorage.setItem('aw_src', JSON.stringify({ referrer: document.referrer || '', landing: u.pathname, utm, at: Date.now() }));
    } catch { /* storage unavailable */ }
  }, []);
  return null;
}

// Adds a hairline under the sticky header once the page has scrolled.
export function HeaderScroll() {
  useEffect(() => {
    const h = document.querySelector('.site-header');
    const on = () => h?.toggleAttribute('data-scrolled', window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return null;
}

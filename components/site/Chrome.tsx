import Link from 'next/link';
import { site, type Locale } from '@/lib/site';
import { t } from '@/lib/i18n';
import { getCategories } from '@/lib/content';
import { applications } from '@/lib/applications';
import { RfqCount, LangSwitch, NavToggle, NavLink, HeaderScroll } from './client';
import { LocalClock } from './motion';

export function BrandMark({ className }: { className?: string }) {
  // Three turns in orthocyclic packing; the copper one is the turn being laid.
  return (
    <svg viewBox="0 0 30 26" className={className} aria-hidden="true">
      <circle cx="8" cy="18.4" r="6.2" fill="currentColor" />
      <circle cx="22" cy="18.4" r="6.2" fill="currentColor" />
      <circle cx="15" cy="6.4" r="6.2" fill="#c4652c" />
    </svg>
  );
}

export function Header({ locale }: { locale: Locale }) {
  const d = t(locale);
  const base = `/${locale}`;
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <Link href={base} className="brand" aria-label={`${site.brand}, home`}>
          <BrandMark className="brand-mark" />
          <span className="brand-word">{site.brand}</span>
        </Link>
        <nav id="site-nav" className="site-nav" aria-label="Main">
          <NavLink href={`${base}/products`}>{d.nav.products}</NavLink>
          <NavLink href={`${base}/applications`}>{d.nav.applications}</NavLink>
          <NavLink href={`${base}/engineering`}>{d.nav.engineering}</NavLink>
          <NavLink href={`${base}/manufacturing`}>{d.nav.manufacturing}</NavLink>
          <NavLink href={`${base}/resources`}>{d.nav.resources}</NavLink>
          <Link href={`${base}/contact`} className="nav-cta-mobile">{d.nav.requestQuote}</Link>
        </nav>
        <div className="header-tools">
          <LangSwitch locale={locale} label={d.langLabel} name={d.langName} />
          <RfqCount locale={locale} label={d.nav.rfq} />
          <Link href={`${base}/contact`} className="btn btn-solid btn-sm header-cta">{d.nav.requestQuote}</Link>
          <NavToggle label={locale === 'zh' ? '菜单' : 'Menu'} />
        </div>
      </div>
      <HeaderScroll />
      <span className="scroll-line" aria-hidden="true" />
    </header>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const d = t(locale);
  const base = `/${locale}`;
  const cats = getCategories();
  const zh = locale === 'zh';
  return (
    <footer className="site-footer">
      <div className="wrap footer-top">
        <div className="footer-claim">
          <Link href={base} className="brand brand-light"><BrandMark className="brand-mark" /><span className="brand-word">{site.brand}</span></Link>
          <p>{d.footer.tagline} {zh ? `${site.founded} 年成立，五十余台日特绕线机，月产能两千万颗。` : `Founded ${site.founded}. More than 50 Nittoku winding machines, 20 million coils a month.`}</p>
        </div>
        <div className="footer-cols">
          <div>
            <h2>{d.nav.products}</h2>
            <ul>{cats.map((c) => <li key={c.slug}><Link href={`${base}/products/${c.slug}`}>{zh ? c.name_zh : c.name_en}</Link></li>)}</ul>
          </div>
          <div>
            <h2>{d.nav.applications}</h2>
            <ul>{applications.map((a) => <li key={a.slug}><Link href={`${base}/applications/${a.slug}`}>{zh ? a.name_zh : a.name_en}</Link></li>)}</ul>
          </div>
          <div>
            <h2>{d.footer.company}</h2>
            <ul>
              <li><Link href={`${base}/engineering`}>{d.nav.engineering}</Link></li>
              <li><Link href={`${base}/manufacturing`}>{d.nav.manufacturing}</Link></li>
              <li><Link href={`${base}/resources`}>{d.nav.resources}</Link></li>
              <li><Link href={`${base}/contact`}>{d.nav.contact}</Link></li>
              <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="wrap footer-mega-wrap">
        <p className="footer-live"><LocalClock label={zh ? '东莞' : 'Dongguan'} running={zh ? '五十余台绕线机' : '50+ winding machines'} /></p>
        <div className="footer-mega" data-spot aria-hidden="true">{site.brand}</div>
      </div>
      <div className="wrap footer-base">
        <span>© {new Date().getFullYear()} {(zh ? site.legalNameZh : site.legalName).replace(/\.$/, '')}{zh ? '。' : '. '}{d.footer.rights}</span>
        <address>{site.address[locale]}, {site.phone}</address>
        <span>{d.footer.privacy}</span>
      </div>
    </footer>
  );
}

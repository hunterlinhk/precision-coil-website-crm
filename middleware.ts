import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'zh'];
const ADMIN = '/HunterLin';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin lives at /HunterLin. Any other capitalisation (/hunterlin, /HUNTERLIN…) goes to the canonical path.
  const head = pathname.split('/')[1] || '';
  if (head.toLowerCase() === ADMIN.slice(1).toLowerCase() && head !== ADMIN.slice(1)) {
    const url = req.nextUrl.clone();
    url.pathname = ADMIN + pathname.slice(head.length + 1);
    return NextResponse.redirect(url);
  }

  // Admin: bounce to login when there is no session cookie at all (real check happens server-side).
  if (head === ADMIN.slice(1)) {
    if (pathname !== '/HunterLin/login' && !req.cookies.get('aw_session')) {
      const url = req.nextUrl.clone();
      url.pathname = '/HunterLin/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const first = pathname.split('/')[1];
  if (LOCALES.includes(first)) {
    const res = NextResponse.next();
    res.headers.set('x-locale', first);
    return res;
  }

  // No locale prefix: pick from cookie, then Accept-Language.
  const cookie = req.cookies.get('aw_locale')?.value;
  const accept = req.headers.get('accept-language') || '';
  const locale = cookie && LOCALES.includes(cookie) ? cookie : /^zh|,\s*zh/i.test(accept) ? 'zh' : 'en';
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next|files|favicon|icon|robots.txt|sitemap.xml|llms.txt|.*\\..*).*)'],
};

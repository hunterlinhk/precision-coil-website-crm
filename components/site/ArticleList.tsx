import Link from 'next/link';
import type { Locale } from '@/lib/site';
import type { Article } from '@/lib/content';
import { t, L } from '@/lib/i18n';

export const fmtDate = (s: string, locale: Locale) =>
  new Date((s || '').replace(' ', 'T') + 'Z').toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

export function ArticleList({ articles, locale, variant }: { articles: Article[]; locale: Locale; variant?: 'rows' }) {
  const d = t(locale);
  return (
    <ul className={variant === 'rows' ? 'article-rows' : 'articles'}>
      {articles.map((a) => (
        <li key={a.slug}>
          <Link href={`/${locale}/resources/${a.slug}`} className="article-card">
            <span className={`kind kind-${a.type}`}>{d.res[a.type]}</span>
            <h3>{L(a, 'title', locale)}</h3>
            <p>{L(a, 'excerpt', locale)}</p>
            <span className="article-meta">
              <time dateTime={a.published_at}>{fmtDate(a.published_at, locale)}</time>
              <span>{a.reading_min} {d.res.read}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Breadcrumbs({ items }: { items: [string, string?][] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {items.map(([label, href], i) => (
          <li key={i}>{href && i < items.length - 1 ? <Link href={href}>{label}</Link> : <span aria-current="page">{label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

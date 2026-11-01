import Link from 'next/link';
import type { Locale } from '@/lib/site';
import type { Article } from '@/lib/content';
import { t, L } from '@/lib/i18n';
import { hasRender } from '@/lib/renders';
import { Render } from './Render';

export const fmtDate = (s: string, locale: Locale) =>
  new Date((s || '').replace(' ', 'T') + 'Z').toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

// Every article gets a cover: the first product it covers, on a backdrop that says what kind of piece it is.
function Cover({ a, label }: { a: Article; label: string }) {
  const pick = (list: string[]) => list[[...a.slug].reduce((n, c) => n + c.charCodeAt(0), 0) % list.length];
  const name = a.products.find(hasRender) || (a.type === 'news' ? pick(['tray', 'spool', 'exploded']) : a.type === 'case' ? 'family-vcm' : pick(['section', 'spool']));
  const scene = ['tray', 'macro-turns'].includes(name);
  return (
    <span className={`cover cover-${a.type}${scene ? ' cover-scene' : ''}`} aria-hidden="true">
      <Render name={name} alt="" sizes="(max-width: 900px) 100vw, 40vw" />
      <span className="cover-kind">{label}</span>
    </span>
  );
}

export function ArticleList({ articles, locale, variant }: { articles: Article[]; locale: Locale; variant?: 'rows' | 'feature' }) {
  const d = t(locale);
  return (
    <ul className={variant === 'rows' ? 'article-rows' : variant === 'feature' ? 'articles articles-feature' : 'articles'} data-stagger>
      {articles.map((a) => (
        <li key={a.slug} data-type={a.type}>
          <Link href={`/${locale}/resources/${a.slug}`} className="article-card">
            {variant !== 'rows' && <Cover a={a} label={d.res[a.type]} />}
            <span className="article-text">
              <span className={`kind kind-${a.type}`}>{d.res[a.type]}</span>
              <h3>{L(a, 'title', locale)}</h3>
              <p>{L(a, 'excerpt', locale)}</p>
              <span className="article-meta">
                <time dateTime={a.published_at}>{fmtDate(a.published_at, locale)}</time>
                <span>{a.reading_min} {d.res.read}</span>
              </span>
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

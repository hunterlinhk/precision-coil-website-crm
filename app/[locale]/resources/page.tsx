import Link from 'next/link';
import type { Metadata } from 'next';
import type { Locale } from '@/lib/site';
import { t } from '@/lib/i18n';
import { getArticles } from '@/lib/content';
import { alternates } from '@/lib/seo';
import { ArticleList, Breadcrumbs } from '@/components/site/ArticleList';

type P = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ type?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  const d = t(locale);
  return { title: d.res.title, description: d.res.lead, alternates: alternates(locale, '/resources') };
}

export default async function Page({ params, searchParams }: P) {
  const { locale } = await params;
  const { type } = await searchParams;
  const d = t(locale);
  const base = `/${locale}`;
  const kind = ['news', 'tech', 'case'].includes(type || '') ? type : undefined;
  const articles = getArticles({ type: kind });
  const tabs: [string | undefined, string][] = [[undefined, d.res.all], ['tech', d.res.tech], ['case', d.res.case], ['news', d.res.news]];
  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.res.title]]} />
        <h1 className="h1">{d.res.title}</h1>
        <p className="lead">{d.res.lead}</p>
        <nav className="cat-tabs" aria-label={d.res.title}>
          {tabs.map(([k, label]) => (
            <Link key={label} href={k ? `${base}/resources?type=${k}` : `${base}/resources`} aria-current={kind === k ? 'page' : undefined}>{label}</Link>
          ))}
        </nav>
      </div>
      <div className="wrap" style={{ paddingBottom: 96, paddingTop: 16 }}>
        <ArticleList articles={articles} locale={locale} variant="rows" />
      </div>
    </>
  );
}

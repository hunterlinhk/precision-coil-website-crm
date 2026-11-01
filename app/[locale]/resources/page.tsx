import type { Metadata } from 'next';
import type { Locale } from '@/lib/site';
import { t } from '@/lib/i18n';
import { getArticles } from '@/lib/content';
import { alternates } from '@/lib/seo';
import { ArticleList, Breadcrumbs } from '@/components/site/ArticleList';
import { SplitTitle } from '@/components/site/Flair';
import { TypeFilter } from '@/components/site/motion';

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
  const articles = getArticles();
  const tabs: [string, string][] = [['all', d.res.all], ['tech', d.res.tech], ['case', d.res.case], ['news', d.res.news]];
  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.res.title]]} />
        <SplitTitle text={d.res.title} className="h1" />
        <p className="lead" data-reveal>{d.res.lead}</p>
      </div>
      <div className="wrap" style={{ paddingBottom: 'var(--section)' }}>
        <TypeFilter tabs={tabs} initial={kind || 'all'} label={d.res.title}>
          <div style={{ marginTop: 32 }}><ArticleList articles={articles} locale={locale} variant="feature" /></div>
        </TypeFilter>
      </div>
    </>
  );
}

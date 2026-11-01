import type { Metadata } from 'next';
import { site, type Locale } from '@/lib/site';
import { t } from '@/lib/i18n';
import { alternates } from '@/lib/seo';
import { Breadcrumbs } from '@/components/site/ArticleList';
import { InquiryForm } from '@/components/site/InquiryForm';
import { SplitTitle } from '@/components/site/Flair';

type P = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ type?: string; model?: string; topic?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  const d = t(locale);
  return { title: d.contact.title, description: d.contact.lead, alternates: alternates(locale, '/contact') };
}

export default async function Page({ params, searchParams }: P) {
  const { locale } = await params;
  const sp = await searchParams;
  const d = t(locale);
  const zh = locale === 'zh';
  const type = (['quote', 'sample', 'drawing', 'general'].includes(sp.type || '') ? sp.type : 'quote') as any;
  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, `/${locale}`], [d.nav.contact]]} />
        <SplitTitle text={d.contact.title} className="h1" />
        <p className="lead">{d.contact.lead}</p>
      </div>
      <div className="wrap contact-layout">
        <InquiryForm locale={locale} d={d.contact} initialType={type} model={sp.model} topic={sp.topic} />
        <aside className="contact-aside">
          <div className="box">
            <h2>{d.contact.response}</h2>
            <p className="big">{d.contact.responseValue}</p>
          </div>
          <div className="box">
            <h2>{d.contact.direct}</h2>
            <p>
              <a href={`mailto:${site.email}`}>{site.email}</a><br />
              <a href={`mailto:${site.engineeringEmail}`}>{site.engineeringEmail}</a><br />
              {site.phone}<br />
              WhatsApp / WeChat {site.whatsapp}
            </p>
          </div>
          <div className="box">
            <h2>{zh ? '工厂' : 'Plants'}</h2>
            <address>{site.plants.map((p) => <span key={p.en} style={{ display: 'block', marginBottom: 10 }}>{p[locale]}</span>)}</address>
          </div>
          <p className="muted" style={{ fontSize: 'var(--t-small)' }}>{d.footer.privacy}</p>
        </aside>
      </div>
    </>
  );
}

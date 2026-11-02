import type { Metadata } from 'next';
import { site, type Locale } from './site';
import type { Product, Article } from './content';
import { L } from './i18n';

// hreflang alternates + canonical for a locale-relative path like "/products/vcm-coils".
export function alternates(locale: Locale, path: string): Metadata['alternates'] {
  return {
    canonical: `/${locale}${path}`,
    languages: { en: `/en${path}`, 'zh-CN': `/zh${path}`, 'x-default': `/en${path}` },
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export function orgJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#org`,
    name: site.legalName,
    alternateName: [site.brand, site.brandZh, site.legalNameZh],
    url: site.url,
    logo: `${site.url}/icon.svg`,
    email: site.email,
    telephone: site.phone,
    foundingDate: String(site.founded),
    address: { '@type': 'PostalAddress', streetAddress: site.address[locale], addressCountry: 'CN' },
    description: locale === 'zh'
      ? `精密线圈制造商：VCM 线圈（约占全球出货量 ${site.facts.vcmShare}）、空心线圈、骨架线圈、无线充电线圈、线性马达与无线充电器。`
      : `Precision coil manufacturer: VCM coils (${site.facts.vcmShare} of global shipments), air-core coils, bobbin coils, wireless charging coils, linear motors and wireless chargers.`,
    hasCertification: [{ '@type': 'Certification', name: 'ISO 9001', about: 'Quality management system' }],
    numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 90 },
    knowsAbout: ['VCM coil', 'voice coil motor', 'autofocus coil', 'optical image stabilization coil', 'air-core coil', 'bobbin coil', 'wireless charging coil', 'nanocrystalline magnetic sheet', 'Qi2', 'linear motor', 'precision coil winding', 'Nittoku winding machine', 'OEM', 'ODM'],
  };
}

export function productJsonLd(p: Product, locale: Locale, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${p.model} ${L(p, 'name', locale)}`,
    sku: p.model, mpn: p.model,
    description: L(p, 'summary', locale),
    url,
    brand: { '@type': 'Brand', name: site.brand },
    manufacturer: { '@id': `${site.url}/#org` },
    category: p.category_slug,
    additionalProperty: p.specs.map((s) => ({ '@type': 'PropertyValue', name: locale === 'zh' ? s.zh : s.en, value: s.v, unitText: s.u || undefined })),
  };
}

export function articleJsonLd(a: Article, locale: Locale, url: string, image?: string) {
  const zh = locale === 'zh';
  return {
    '@context': 'https://schema.org',
    '@type': a.type === 'news' ? 'NewsArticle' : 'TechArticle',
    headline: L(a, 'title', locale),
    description: L(a, 'excerpt', locale),
    ...(L(a, 'takeaways', locale) ? { abstract: L(a, 'takeaways', locale) } : {}),
    ...(image ? { image: image.startsWith('http') ? image : `${site.url}${image}` } : {}),
    datePublished: (a.published_at || a.updated_at)?.replace(' ', 'T') + 'Z',
    dateModified: a.updated_at?.replace(' ', 'T') + 'Z',
    inLanguage: zh ? 'zh-CN' : 'en',
    url,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: a.author || site.brand, url: site.url },
    publisher: { '@id': `${site.url}/#org` },
    ...(a.products.length ? { mentions: a.products.map((s) => ({ '@type': 'Product', name: s.toUpperCase() })) } : {}),
  };
}

export function faqJsonLd(items: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

export function breadcrumbJsonLd(items: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${site.url}${path}` })),
  };
}

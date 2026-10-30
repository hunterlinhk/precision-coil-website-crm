import Link from 'next/link';
import type { Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getCategories, getProducts, type Category } from '@/lib/content';
import { ProductArt, familyDims } from './ProductArt';
import { ProductFinder, type FinderRow } from './ProductFinder';
import { Breadcrumbs } from './ArticleList';

export function ProductsView({ locale, category }: { locale: Locale; category?: Category }) {
  const d = t(locale);
  const base = `/${locale}`;
  const cats = getCategories();
  const products = getProducts({ category: category?.slug });
  const catName = Object.fromEntries(cats.map((c) => [c.slug, L(c, 'name', locale)]));
  const rows: FinderRow[] = products.map((p) => ({
    slug: p.slug, model: p.model, name: L(p, 'name', locale), name_en: p.name_en, name_zh: p.name_zh,
    category: p.category_slug, categoryName: catName[p.category_slug], params: p.params,
    thumb: <ProductArt dims={p.dims} title={p.model} />,
  }));

  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.nav.products, `${base}/products`], ...(category ? [[L(category, 'name', locale)] as [string]] : [])]} />
        {category ? (
          <div className="cat-intro">
            <div>
              <h1 className="h1">{L(category, 'name', locale)}</h1>
              <p className="lead">{L(category, 'summary', locale)}</p>
            </div>
            <div className="cat-intro-art"><ProductArt dims={familyDims[category.shape]} title={L(category, 'name', locale)} /></div>
          </div>
        ) : (
          <>
            <h1 className="h1">{d.products.title}</h1>
            <p className="lead">{d.products.lead}</p>
          </>
        )}
        <nav className="cat-tabs" aria-label={d.products.family}>
          <Link href={`${base}/products`} aria-current={!category ? 'page' : undefined}>{d.products.all}</Link>
          {cats.map((c) => (
            <Link key={c.slug} href={`${base}/products/${c.slug}`} aria-current={category?.slug === c.slug ? 'page' : undefined}>
              {L(c, 'name', locale)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="wrap" style={{ paddingBottom: 96 }}>
        <ProductFinder rows={rows} locale={locale} labels={{
          finder: d.products.finder, od: d.products.od, height: d.products.height, wire: d.products.wire, resistance: d.products.resistance,
          reset: d.products.reset, results: d.products.results, noResults: d.products.noResults, model: d.products.model, family: d.products.family,
          add: d.products.addRfq, added: d.products.inRfq, search: locale === 'zh' ? '型号或名称' : 'Model or name',
          sendDrawing: d.home.ctaDrawing, toDrawing: d.products.toDrawing,
        }} />
      </div>
    </>
  );
}

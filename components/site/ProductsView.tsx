import type { Locale } from '@/lib/site';
import { t, L } from '@/lib/i18n';
import { getCategories, getProducts, type Category } from '@/lib/content';
import { familyRender, productRenderName } from '@/lib/renders';
import { Render } from './Render';
import { ProductFinder, type FinderRow } from './ProductFinder';
import { Breadcrumbs } from './ArticleList';

export function ProductsView({ locale, category }: { locale: Locale; category?: Category }) {
  const d = t(locale);
  const zh = locale === 'zh';
  const base = `/${locale}`;
  const cats = getCategories();
  const products = getProducts({ category: category?.slug });
  const catName = Object.fromEntries(cats.map((c) => [c.slug, L(c, 'name', locale)]));
  const rows: FinderRow[] = products.map((p) => ({
    slug: p.slug, model: p.model, name: L(p, 'name', locale), name_en: p.name_en, name_zh: p.name_zh,
    category: p.category_slug, categoryName: catName[p.category_slug], params: p.params,
    thumb: p.images[0]
      ? <img key={p.slug} src={`/api/media/${p.images[0].id}`} alt={p.model} loading="lazy" />
      : <Render key={p.slug} name={productRenderName(p)} alt={`${p.model} ${L(p, 'name', locale)}`} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw" />,
  }));
  const pills = [
    { href: `${base}/products`, label: d.products.all, current: !category },
    ...cats.map((c) => ({ href: `${base}/products/${c.slug}`, label: L(c, 'name', locale), current: category?.slug === c.slug })),
  ];
  const pillsLabel = d.products.family;

  return (
    <>
      <div className="wrap page-head">
        <Breadcrumbs items={[[d.common.home, base], [d.nav.products, `${base}/products`], ...(category ? [[L(category, 'name', locale)] as [string]] : [])]} />
        {category ? (
          <div className="cat-hero">
            <div className="cat-hero-copy">
              <h1 className="h1">{L(category, 'name', locale)}</h1>
              <p className="lead">{L(category, 'summary', locale)}</p>
            </div>
            <div className="cat-hero-art"><Render name={familyRender[category.slug] || 'aw-vcm-af0806'} alt={L(category, 'name', locale)} sizes="(max-width: 900px) 100vw, 50vw" priority /></div>
          </div>
        ) : (
          <>
            <h1 className="h1">{d.products.title}</h1>
            <p className="lead">{d.products.lead}</p>
          </>
        )}
      </div>
      <div className="wrap" style={{ paddingBottom: 'var(--section)' }}>
        <ProductFinder rows={rows} locale={locale} pills={pills} pillsLabel={pillsLabel} labels={{
          finder: d.products.finder, od: d.products.od, height: d.products.height, wire: d.products.wire, resistance: d.products.resistance,
          reset: d.products.reset, results: d.products.results, noResults: d.products.noResults, model: d.products.model, family: d.products.family,
          add: d.products.addRfq, added: d.products.inRfq, search: zh ? '型号或名称' : 'Model or name',
          sendDrawing: d.home.ctaDrawing, toDrawing: zh ? '需要其他尺寸？' : 'Need a different size?',
          toDrawingBody: zh ? '我们出货的大多数零件都是按客户图纸绕制的。' : 'Most parts we ship are wound to customer drawings. An engineer replies within two working days.',
          grid: zh ? '图片' : 'Grid', table: zh ? '表格' : 'Table', filters: zh ? '筛选' : 'Filter',
          short: zh ? ['外形', '高度', '线径'] : ['Outline', 'Height', 'Wire'],
        }} />
      </div>
    </>
  );
}

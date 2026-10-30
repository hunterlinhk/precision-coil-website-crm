import 'server-only';
import { db, j } from './db';

export type Category = { id: number; slug: string; name_en: string; name_zh: string; short_en: string; short_zh: string; summary_en: string; summary_zh: string; shape: string; count?: number };
export type Spec = { k: string; en: string; zh: string; v: string; u?: string };
export type FileRef = { name: string; id: string; size?: number };
export type Product = {
  id: number; slug: string; category_id: number; model: string; status: string; featured: number;
  name_en: string; name_zh: string; summary_en: string; summary_zh: string; body_en: string; body_zh: string;
  custom_en: string; custom_zh: string; specs: Spec[]; params: Record<string, number>; dims: any;
  applications: string[]; images: FileRef[]; files: FileRef[]; category_slug: string; shape: string;
  seo_title_en: string; seo_title_zh: string; seo_desc_en: string; seo_desc_zh: string; updated_at: string; published_at: string;
};
export type Article = {
  id: number; slug: string; type: 'news' | 'tech' | 'case'; status: string;
  title_en: string; title_zh: string; excerpt_en: string; excerpt_zh: string; body_en: string; body_zh: string;
  products: string[]; applications: string[]; reading_min: number; published_at: string; updated_at: string;
  seo_title_en: string; seo_title_zh: string; seo_desc_en: string; seo_desc_zh: string;
};

const hydrateProduct = (r: any): Product => r && ({
  ...r, specs: j(r.specs, []), params: j(r.params, {}), dims: j(r.dims, {}), applications: j(r.applications, []), images: j(r.images, []), files: j(r.files, []),
});
const hydrateArticle = (r: any): Article => r && ({ ...r, products: j(r.products, []), applications: j(r.applications, []) });

const PRODUCT_SELECT = `SELECT p.*, c.slug AS category_slug, c.shape AS shape FROM products p JOIN categories c ON c.id = p.category_id`;

export function getCategories(): Category[] {
  return db().prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'published') AS count FROM categories c ORDER BY c.sort`).all() as Category[];
}
export const getCategory = (slug: string) => db().prepare('SELECT * FROM categories WHERE slug = ?').get(slug) as Category | undefined;

export function getProducts(opts: { category?: string; featured?: boolean; includeDrafts?: boolean } = {}): Product[] {
  const where: string[] = [];
  const args: any[] = [];
  if (!opts.includeDrafts) where.push(`p.status = 'published'`);
  if (opts.category) { where.push('c.slug = ?'); args.push(opts.category); }
  if (opts.featured) where.push('p.featured = 1');
  const sql = `${PRODUCT_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY c.sort, p.sort`;
  return (db().prepare(sql).all(...args) as any[]).map(hydrateProduct);
}

export function getProduct(slug: string, includeDrafts = false): Product | undefined {
  const r = db().prepare(`${PRODUCT_SELECT} WHERE p.slug = ? ${includeDrafts ? '' : `AND p.status = 'published'`}`).get(slug);
  return r ? hydrateProduct(r) : undefined;
}

export function getProductsByModels(models: string[]): Product[] {
  if (!models.length) return [];
  const rows = db().prepare(`${PRODUCT_SELECT} WHERE p.status = 'published' AND (p.model IN (${models.map(() => '?').join(',')}) OR p.slug IN (${models.map(() => '?').join(',')}))`).all(...models, ...models);
  return (rows as any[]).map(hydrateProduct);
}

export function getProductsForApplication(app: string): Product[] {
  return getProducts().filter((p) => p.applications.includes(app));
}

export function getArticles(opts: { type?: string; limit?: number; includeDrafts?: boolean } = {}): Article[] {
  const where: string[] = [];
  const args: any[] = [];
  if (!opts.includeDrafts) where.push(`status = 'published'`);
  if (opts.type) { where.push('type = ?'); args.push(opts.type); }
  const sql = `SELECT * FROM articles ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY COALESCE(published_at, updated_at) DESC ${opts.limit ? 'LIMIT ' + Number(opts.limit) : ''}`;
  return (db().prepare(sql).all(...args) as any[]).map(hydrateArticle);
}

export function getArticle(slug: string, includeDrafts = false): Article | undefined {
  const r = db().prepare(`SELECT * FROM articles WHERE slug = ? ${includeDrafts ? '' : `AND status = 'published'`}`).get(slug);
  return r ? hydrateArticle(r) : undefined;
}

export function articlesForProduct(slug: string): Article[] {
  return getArticles().filter((a) => a.products.includes(slug));
}
export function articlesForApplication(app: string): Article[] {
  return getArticles().filter((a) => a.applications.includes(app));
}

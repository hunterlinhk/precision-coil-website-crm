import Link from 'next/link';
import type { Locale } from '@/lib/site';
import { L } from '@/lib/i18n';
import type { Product } from '@/lib/content';
import { ProductArt } from './ProductArt';

export function MiniProducts({ products, locale }: { products: Product[]; locale: Locale }) {
  return (
    <ul className="mini-products">
      {products.map((p) => (
        <li key={p.slug}>
          <Link href={`/${locale}/products/${p.category_slug}/${p.slug}`} className="mini-product">
            <div className="art"><ProductArt dims={p.dims} title={p.model} /></div>
            <div className="txt"><strong>{p.model}</strong><span>{L(p, 'name', locale)}</span></div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

import Link from 'next/link';
import type { Locale } from '@/lib/site';
import { L } from '@/lib/i18n';
import type { Product } from '@/lib/content';
import { productRenderName } from '@/lib/renders';
import { Render } from './Render';

export function MiniProducts({ products, locale }: { products: Product[]; locale: Locale }) {
  return (
    <ul className="mini-products">
      {products.map((p) => (
        <li key={p.slug}>
          <Link href={`/${locale}/products/${p.category_slug}/${p.slug}`} className="mini-product">
            <div className="art">{p.images[0] ? <img src={`/api/media/${p.images[0].id}`} alt={p.model} loading="lazy" /> : <Render name={productRenderName(p)} alt={`${p.model} ${L(p, 'name', locale)}`} sizes="(max-width: 600px) 100vw, 25vw" />}</div>
            <div className="txt"><strong>{p.model}</strong><span>{L(p, 'name', locale)}</span></div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

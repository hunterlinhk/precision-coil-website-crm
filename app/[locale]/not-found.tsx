import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap page-head" style={{ minHeight: '50vh' }}>
      <h1 className="h1">Page not found / 页面不存在</h1>
      <p className="lead">The page may have moved. Try the product catalogue, or send us a drawing and we will find the right part.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
        <Link href="/en/products" className="btn btn-ink">Products</Link>
        <Link href="/zh/products" className="btn btn-line">产品目录</Link>
      </div>
    </div>
  );
}

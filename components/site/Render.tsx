import { renderSrc } from '@/lib/renders';

// A pre-rendered studio image with responsive sources and reserved aspect ratio.
export function Render({ name, alt, sizes = '(max-width: 760px) 100vw, 50vw', className, priority }: { name: string; alt: string; sizes?: string; className?: string; priority?: boolean }) {
  const r = renderSrc(name);
  if (!r) return null;
  return (
    <img
      src={r.src} srcSet={r.srcSet} sizes={sizes} width={r.width} height={r.height} alt={alt}
      className={className} loading={priority ? 'eager' : 'lazy'} decoding="async" {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  );
}

import type { Locale } from '@/lib/site';
import { db } from '@/lib/db';

type Logo = { id: number; name: string; image: string | null; url: string | null };

// Customer logos, managed in the admin (Website → Customer logos). Until a logo file is uploaded,
// the company name is set as a plain wordmark in the site typeface.
export function LogoStrip({ locale }: { locale: Locale }) {
  const logos = db().prepare('SELECT id, name, image, url FROM logos WHERE visible = 1 ORDER BY sort, id').all() as Logo[];
  if (!logos.length) return null;
  const zh = locale === 'zh';
  return (
    <section className="logos" aria-labelledby="logos-title">
      <div className="wrap logos-inner">
        <h2 id="logos-title" className="logos-title" data-reveal>{zh ? '为全球主流手机品牌供货' : 'Coils inside phones from the world’s leading brands'}</h2>
        <ul className="logos-list" data-stagger>
          {logos.map((l) => {
            const mark = l.image
              ? <img src={`/api/media/${l.image}`} alt={l.name} loading="lazy" />
              : <span className="logo-word">{l.name}</span>;
            return <li key={l.id}>{l.url ? <a href={l.url} rel="noopener nofollow" target="_blank">{mark}</a> : mark}</li>;
          })}
        </ul>
      </div>
    </section>
  );
}

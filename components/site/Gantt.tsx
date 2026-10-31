import type { Locale } from '@/lib/site';
import { t } from '@/lib/i18n';

// Development timeline drawn to scale in weeks. Solid bar = typical minimum, hatched = usual range.
export function Gantt({ locale }: { locale: Locale }) {
  const h = t(locale).home;
  const zh = locale === 'zh';
  const total = 15;
  const label = (len: number, range: number) => len < 1
    ? (zh ? `${Math.round(len * 5)}${range ? `–${Math.round((len + range) * 5)}` : ''} 个工作日` : `${Math.round(len * 5)}${range ? `–${Math.round((len + range) * 5)}` : ''} days`)
    : `${len}–${len + range} ${h.weeks}`;
  return (
    <div className="gantt" style={{ ['--weeks' as any]: total }}>
      <div className="gantt-axis" aria-hidden="true">
        <span />
        <div className="ticks">{[0, 2, 4, 6, 8, 10, 12, 14].map((w) => <span key={w} style={{ left: `${(w / total) * 100}%` }}>{zh ? `${w} 周` : w === 0 ? `${h.week} 0` : w}</span>)}</div>
      </div>
      <ol>
        {h.path.map(([name, desc, start, len, range]) => (
          <li className="gantt-row" key={name}>
            <div className="gantt-label"><h3>{name}</h3><p>{desc}</p></div>
            <div className="gantt-track" role="img" aria-label={`${name}: ${label(len, range)}`}>
              <span className={`gantt-bar ${range ? 'has-range' : ''}`} style={{ left: `${(start / total) * 100}%`, width: `${(len / total) * 100}%`, ['--range' as any]: `${(range / len) * 100}%` }}>
                {range > 0 && <span className="range" style={{ width: `${(range / len) * 100}%` }} />}
                <span className="t">{label(len, range)}</span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

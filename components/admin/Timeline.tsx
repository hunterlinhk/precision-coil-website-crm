import { type AL, fmtAgo, fmtDateTime, label } from '@/lib/admin-lang';

const ICON: Record<string, [string, string]> = { note: ['NO', '记'], call: ['CA', '话'], email: ['EM', '邮'], meeting: ['MT', '会'], status: ['ST', '态'], inquiry: ['WEB', '网'] };

export function Timeline({ items, l }: { items: any[]; l: AL }) {
  if (!items.length) return <p className="muted" style={{ padding: '8px 0' }}>{l === 'zh' ? '暂无记录。' : 'No history yet.'}</p>;
  return (
    <ul className="timeline">
      {items.map((a) => (
        <li key={a.id}>
          <span className={`tl-icon ${a.kind}`} aria-hidden="true">{(ICON[a.kind] || [a.kind.slice(0, 2).toUpperCase(), a.kind.slice(0, 1)])[l === 'zh' ? 1 : 0]}</span>
          <div>
            <div className="tl-meta" title={fmtDateTime(a.created_at, l)}>{a.who || (l === 'zh' ? '网站' : 'Website')} · {a.kind === 'status' ? (l === 'zh' ? '状态' : 'update') : label(a.kind, l)} · {fmtAgo(a.created_at, l)}{a.account ? ` · ${a.account}` : ''}</div>
            <div className="tl-body">{a.body}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

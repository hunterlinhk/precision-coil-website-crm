import { ago, dateTime } from '@/lib/admin';

const LABEL: Record<string, string> = { note: 'NO', call: 'CA', email: 'EM', meeting: 'MT', status: 'ST', inquiry: 'WEB' };

export function Timeline({ items }: { items: any[] }) {
  if (!items.length) return <p className="muted" style={{ padding: '8px 0' }}>No history yet.</p>;
  return (
    <ul className="timeline">
      {items.map((a) => (
        <li key={a.id}>
          <span className={`tl-icon ${a.kind}`} aria-hidden="true">{LABEL[a.kind] || a.kind.slice(0, 2).toUpperCase()}</span>
          <div>
            <div className="tl-meta" title={dateTime(a.created_at)}>{a.who || 'Website'}, {a.kind}, {ago(a.created_at)}{a.account ? ` on ${a.account}` : ''}</div>
            <div className="tl-body">{a.body}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

import React from 'react';

// Minimal Markdown for CMS bodies: ## / ### headings, paragraphs, - and 1. lists, **bold**, *italic*, [links](url).
function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={`${key}-${i++}`}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('[')) {
      const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok)!;
      const safe = /^(https?:|\/|#|mailto:)/.test(mm[2]) ? mm[2] : '#';
      out.push(<a key={`${key}-${i++}`} href={safe}>{mm[1]}</a>);
    } else out.push(<em key={`${key}-${i++}`}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = (source || '').replace(/\r/g, '').split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, bi) => {
        const lines = b.split('\n').filter(Boolean);
        if (!lines.length) return null;
        if (lines[0].startsWith('### ')) return <h3 key={bi}>{inline(lines[0].slice(4), `h${bi}`)}</h3>;
        if (lines[0].startsWith('## ')) {
          const rest = lines.slice(1).join(' ');
          return (
            <React.Fragment key={bi}>
              <h2>{inline(lines[0].slice(3), `h${bi}`)}</h2>
              {rest && <p>{inline(rest, `p${bi}`)}</p>}
            </React.Fragment>
          );
        }
        if (lines.every((l) => /^\d+\.\s/.test(l))) return <ol key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.replace(/^\d+\.\s/, ''), `o${bi}${li}`)}</li>)}</ol>;
        if (lines.every((l) => /^[-*]\s/.test(l))) return <ul key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.slice(2), `u${bi}${li}`)}</li>)}</ul>;
        return <p key={bi}>{inline(lines.join(' '), `p${bi}`)}</p>;
      })}
    </>
  );
}

export const plainText = (md: string) => (md || '').replace(/[#*_[\]()`>-]/g, '').replace(/\s+/g, ' ').trim();

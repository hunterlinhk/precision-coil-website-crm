import Link from 'next/link';
import { j } from '@/lib/db';
import type { User } from '@/lib/auth';
import { mailAccounts } from '@/lib/mail';
import { type AL, fmtDateTime, fmtAgo } from '@/lib/admin-lang';
import { sendEmailAction } from '@/app/HunterLin/actions-more';

const ERR: Record<string, [string, string]> = {
  'no-account': ['Choose a mailbox to send from.', '请选择发件邮箱。'],
  'no-recipient': ['Add at least one valid recipient address.', '请填写至少一个有效的收件人地址。'],
};

// Result banner after sending (reads ?sent= / ?mailerror=).
export function MailNotice({ sp, l }: { sp: { sent?: string; mailerror?: string }; l: AL }) {
  if (sp.sent) return <p className="notice">{l === 'zh' ? '邮件已发送。' : 'Email sent.'}</p>;
  if (sp.mailerror) {
    const e = ERR[sp.mailerror];
    return <p className="notice bad">{e ? e[l === 'zh' ? 1 : 0] : `${l === 'zh' ? '发送失败：' : 'Could not send: '}${sp.mailerror}`}</p>;
  }
  return null;
}

type ComposeProps = {
  u: User; l: AL; back: string;
  to?: string; cc?: string; subject?: string; body?: string;
  inReplyTo?: string | null; references?: string | null;
  link?: { account_id?: number | null; contact_id?: number | null; inquiry_id?: number | null };
  contacts?: { name: string; email: string }[];
  compact?: boolean;
};

// Send from one of the company mailboxes. Falls back to a mailto link when none is set up.
export function Composer(p: ComposeProps) {
  const tr = (en: string, zh: string) => (p.l === 'zh' ? zh : en);
  const accounts = p.u ? mailAccounts(p.u) : [];
  if (!accounts.length) {
    return (
      <div className="composer-empty">
        <p>{tr('No company mailbox is connected yet, so replies open in your own email program.', '尚未连接公司邮箱，回复会在你电脑上的邮件程序中打开。')}</p>
        <div className="inline-form">
          <a className="btn" href={`mailto:${p.to || ''}?subject=${encodeURIComponent(p.subject || '')}`}>{tr('Reply in my email program', '用本机邮件程序回复')}</a>
          <Link className="btn btn-ghost" href="/HunterLin/settings/email?new=1">{tr('Connect a mailbox', '连接邮箱')}</Link>
        </div>
      </div>
    );
  }
  const mine = accounts.find((a) => a.owner_id === p.u.id) || accounts[0];
  return (
    <form action={sendEmailAction} className="form composer">
      <input type="hidden" name="back" value={p.back} />
      {p.inReplyTo && <input type="hidden" name="in_reply_to" value={p.inReplyTo} />}
      {p.references && <input type="hidden" name="references" value={p.references} />}
      {p.link?.account_id ? <input type="hidden" name="account_id" value={p.link.account_id} /> : null}
      {p.link?.contact_id ? <input type="hidden" name="contact_id" value={p.link.contact_id} /> : null}
      {p.link?.inquiry_id ? <input type="hidden" name="inquiry_id" value={p.link.inquiry_id} /> : null}
      <div className="fgrid">
        <div className="f"><label htmlFor="c-from">{tr('From', '发件人')}</label>
          <select id="c-from" name="mail_account_id" defaultValue={mine.id}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.from_name ? `${a.from_name} <${a.email}>` : a.email}</option>)}</select></div>
        <div className="f"><label htmlFor="c-to">{tr('To', '收件人')}</label>
          <input id="c-to" name="to" defaultValue={p.to} required list={p.contacts?.length ? 'c-contacts' : undefined} placeholder="name@company.com" />
          {p.contacts?.length ? <datalist id="c-contacts">{p.contacts.map((c) => <option key={c.email} value={c.email}>{c.name}</option>)}</datalist> : null}</div>
        {!p.compact && <div className="f"><label htmlFor="c-cc">{tr('Cc', '抄送')}</label><input id="c-cc" name="cc" defaultValue={p.cc} placeholder={tr('Optional, separate with commas', '可选，多个地址用逗号分隔')} /></div>}
        <div className={`f ${p.compact ? '' : ''}`}><label htmlFor="c-subject">{tr('Subject', '主题')}</label><input id="c-subject" name="subject" defaultValue={p.subject} required /></div>
        <div className="f full"><label htmlFor="c-body">{tr('Message', '正文')}</label><textarea id="c-body" name="body" className="tall" defaultValue={p.body} required /></div>
        <div className="f full"><label htmlFor="c-files">{tr('Attachments', '附件')}</label><input id="c-files" name="files" type="file" multiple accept=".pdf,.step,.stp,.dwg,.dxf,.igs,.iges,.png,.jpg,.jpeg,.webp,.zip,.xlsx,.docx" />
          <div className="hint"><span>{tr('PDF, drawings, images, Office files or ZIP, up to 20 MB each.', '支持 PDF、图纸、图片、Office 文件或 ZIP，每个不超过 20 MB。')}</span></div></div>
      </div>
      <div className="inline-form"><button className="btn btn-primary">{tr('Send', '发送')}</button><span className="muted" style={{ fontSize: '0.82rem' }}>{tr('A copy is saved here and in the mailbox’s Sent folder.', '邮件会保存在这里，同时存入该邮箱的“已发送”文件夹。')}</span></div>
    </form>
  );
}

// A list of emails, newest last, with expandable bodies.
export function Thread({ emails, l, openLast = true }: { emails: any[]; l: AL; openLast?: boolean }) {
  if (!emails.length) return <p className="muted">{l === 'zh' ? '还没有往来邮件。' : 'No emails yet.'}</p>;
  return (
    <ol className="thread">
      {emails.map((e, i) => {
        const atts = j<{ id: string; name: string }[]>(e.attachments, []);
        return (
          <li key={e.id} className={`mail ${e.direction}`}>
            <details open={openLast && i === emails.length - 1}>
              <summary>
                <span className="mail-dir" aria-hidden="true">{e.direction === 'in' ? '↘' : '↗'}</span>
                <span className="mail-who">{e.direction === 'in' ? (e.from_name || e.from_addr) : `${l === 'zh' ? '发给' : 'To'} ${e.to_addrs}`}</span>
                <span className="mail-subj">{e.subject}</span>
                {e.status === 'failed' && <span className="pill overdue">{l === 'zh' ? '发送失败' : 'Failed'}</span>}
                <span className="mail-when" title={fmtDateTime(e.created_at, l)}>{fmtAgo(e.created_at, l)}</span>
              </summary>
              <div className="mail-head muted">
                {e.direction === 'in' ? `${l === 'zh' ? '发件人' : 'From'}: ${e.from_name ? `${e.from_name} <${e.from_addr}>` : e.from_addr}` : `${l === 'zh' ? '发件人' : 'From'}: ${e.from_addr}`}
                {' · '}{l === 'zh' ? '收件人' : 'To'}: {e.to_addrs}{e.cc_addrs ? ` · Cc: ${e.cc_addrs}` : ''} · {fmtDateTime(e.created_at, l)}
              </div>
              {e.error && <p className="notice bad">{e.error}</p>}
              <div className="mail-body">{e.body_text}</div>
              {atts.length > 0 && <div className="mail-atts">{atts.map((a) => <a key={a.id} href={`/api/files/${a.id}?name=${encodeURIComponent(a.name)}`}>📎 {a.name}</a>)}</div>}
              <div className="mail-actions"><Link href={`/HunterLin/inbox/email/${e.id}`}>{l === 'zh' ? '打开 / 回复' : 'Open / reply'}</Link></div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}

// Subject for a reply.
export const reSubject = (subj: string) => (/^(re|回复|答复)\s*[:：]/i.test(subj || '') ? subj : `Re: ${subj || ''}`);

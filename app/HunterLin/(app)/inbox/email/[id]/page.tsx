import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope } from '@/lib/admin';
import { translator } from '@/lib/admin-lang';
import { inquiryRef } from '@/lib/crm';
import { mailAccounts, quoteText } from '@/lib/mail';
import { Topbar, Panel } from '@/components/admin/ui';
import { Composer, MailNotice, Thread, reSubject } from '@/components/admin/Email';
import { linkEmail, markEmail } from '@/app/HunterLin/actions-more';

// Every message connected to this one through Message-ID / In-Reply-To / References.
function threadOf(e: any) {
  const ids = new Set<string>([e.message_id, e.in_reply_to, ...(e.refs || '').split(/\s+/)].filter(Boolean));
  for (let pass = 0; pass < 3; pass++) {
    const list = [...ids];
    if (!list.length) break;
    const ph = list.map(() => '?').join(',');
    const rows = db().prepare(`SELECT message_id, in_reply_to, refs FROM emails WHERE message_id IN (${ph}) OR in_reply_to IN (${ph})`).all(...list, ...list) as any[];
    const before = ids.size;
    rows.forEach((r) => [r.message_id, r.in_reply_to, ...(r.refs || '').split(/\s+/)].filter(Boolean).forEach((x: string) => ids.add(x)));
    if (ids.size === before) break;
  }
  const list = [...ids];
  const ph = list.map(() => '?').join(',');
  return db().prepare(`SELECT * FROM emails WHERE mail_account_id = ? AND (id = ? ${list.length ? `OR message_id IN (${ph})` : ''}) ORDER BY created_at`).all(e.mail_account_id, e.id, ...list) as any[];
}

export default async function EmailView({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; mailerror?: string; linked?: string }> }) {
  const u = await requireUser(can.crm);
  const { l, tr } = await translator();
  const { id } = await params;
  const sp = await searchParams;
  const e = db().prepare('SELECT * FROM emails WHERE id = ?').get(+id) as any;
  if (!e) notFound();
  if (!mailAccounts(u).some((b) => b.id === e.mail_account_id)) redirect('/HunterLin?denied=1');
  if (e.direction === 'in' && !e.read) db().prepare('UPDATE emails SET read = 1 WHERE id = ?').run(e.id);
  const thread = threadOf(e);
  const lastIn = [...thread].reverse().find((x) => x.direction === 'in') || e;
  const account = e.account_id ? (db().prepare('SELECT id, name FROM accounts WHERE id = ?').get(e.account_id) as any) : null;
  const inquiry = e.inquiry_id ? (db().prepare('SELECT id, company FROM inquiries WHERE id = ?').get(e.inquiry_id) as any) : null;
  const accounts = db().prepare(`SELECT id, name FROM accounts WHERE ${scope(u)} ORDER BY name`).all() as any[];
  const counterpart = e.direction === 'in' ? e.from_addr : (e.to_addrs || '').split(',')[0]?.trim();
  const refs = [lastIn.refs, lastIn.message_id].filter(Boolean).join(' ');
  const back = `/HunterLin/inbox/email/${e.id}`;

  return (
    <>
      <Topbar crumbs={[[tr('Inbox', '收件箱'), '/HunterLin/inbox?tab=email'], [tr('Email', '邮件')]]} title={e.subject || tr('(no subject)', '（无主题）')}
        sub={<>{e.direction === 'in' ? `${tr('From', '发件人')} ${e.from_name ? `${e.from_name} <${e.from_addr}>` : e.from_addr}` : `${tr('To', '收件人')} ${e.to_addrs}`}{account && <> · <Link href={`/HunterLin/accounts/${account.id}`}>{account.name}</Link></>}{inquiry && <> · <Link href={`/HunterLin/inquiries/${inquiry.id}`}>{inquiryRef(inquiry.id)}</Link></>}</>}>
        {e.direction === 'in' && <form action={markEmail}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="read" value="0" /><input type="hidden" name="back" value="/HunterLin/inbox?tab=email" /><button className="btn">{tr('Mark unread', '标为未读')}</button></form>}
      </Topbar>
      <MailNotice sp={sp} l={l} />
      {sp.linked && <p className="notice">{tr('Filed under the customer.', '已归档到客户。')}</p>}
      <div className="grid g-main">
        <div className="stack">
          <Panel title={thread.length > 1 ? tr(`Conversation (${thread.length})`, `往来邮件（${thread.length}）`) : tr('Message', '邮件')}>
            <Thread emails={thread} l={l} />
          </Panel>
          <Panel title={tr('Reply', '回复')}>
            <Composer u={u} l={l} back={back} to={counterpart} subject={reSubject(lastIn.subject)} body={lastIn.direction === 'in' ? quoteText(lastIn) : ''}
              inReplyTo={lastIn.message_id} references={refs} link={{ account_id: e.account_id, contact_id: e.contact_id, inquiry_id: e.inquiry_id }} />
          </Panel>
        </div>
        <div className="stack">
          <Panel title={tr('Customer', '客户')}>
            <form action={linkEmail} className="form">
              <input type="hidden" name="id" value={e.id} />
              <div className="f"><label htmlFor="account_id">{tr('File under', '归档到')}</label>
                <select id="account_id" name="account_id" defaultValue={e.account_id || ''}><option value="">{tr('Not filed', '未归档')}</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              {e.direction === 'in' && <label className="check"><input type="checkbox" name="add_contact" defaultChecked={!e.contact_id} /> {tr('Add the sender as a contact', '把发件人添加为联系人')}</label>}
              <div><button className="btn btn-sm">{tr('Save', '保存')}</button></div>
            </form>
            {!account && <p className="muted" style={{ fontSize: '0.82rem', marginTop: 10 }}>{tr('New company? ', '新公司？')}<Link href={`/HunterLin/accounts/new?domain=${encodeURIComponent((counterpart || '').split('@')[1] || '')}`}>{tr('Create the customer first', '先创建客户')}</Link>.</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}

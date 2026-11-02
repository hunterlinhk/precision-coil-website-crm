import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { salesUsers } from '@/lib/admin';
import { translator, fmtAgo } from '@/lib/admin-lang';
import { mailAccounts, type MailAccount } from '@/lib/mail';
import { Topbar, Panel } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/client';
import { MailAccountForm } from '@/components/admin/MailForm';
import { saveMailAccountAction, testMailAccountAction, removeMailAccount } from '../../../actions-more';

export const metadata = { title: 'Email accounts' };

export default async function EmailSettings({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string; error?: string; tested?: string; smtp?: string; imap?: string; removed?: string }> }) {
  const u = await requireUser(can.crm);
  const { l, tr } = await translator();
  const sp = await searchParams;
  const list = mailAccounts(u);
  const users = db().prepare('SELECT id, name FROM users WHERE active = 1 ORDER BY name').all() as any[];
  const editing = sp.edit ? (list.find((a) => a.id === +sp.edit!) as MailAccount | undefined) : undefined;
  const canEdit = (a: MailAccount) => can.users(u) || a.owner_id === u.id;
  const ownerName = (a: MailAccount) => (a.owner_id ? users.find((x) => x.id === a.owner_id)?.name || '—' : tr('Shared', '共用'));
  const ok = (v?: string) => v === 'ok';
  const showForm = sp.new || editing || list.length === 0;

  return (
    <>
      <Topbar title={tr('Email accounts', '邮箱账户')} sub={tr('Connect company mailboxes to send and receive customer email inside the CRM.', '连接公司邮箱后，可以直接在系统里收发客户邮件。')}>
        {!showForm && <Link className="btn btn-primary" href="/HunterLin/settings/email?new=1">{tr('Add mailbox', '添加邮箱')}</Link>}
      </Topbar>
      {sp.removed && <p className="notice">{tr('Mailbox disconnected. Its emails stay on the customer records.', '邮箱已断开，已收发的邮件仍保留在客户记录中。')}</p>}
      {sp.error && <p className="notice bad">{sp.error === 'password' ? tr('Enter the mailbox password.', '请填写邮箱密码。') : tr('Fill in the email address and outgoing server.', '请填写邮箱地址和发件服务器。')}</p>}
      {sp.tested && (
        <p className={`notice ${ok(sp.smtp) && (ok(sp.imap) || sp.imap === 'not configured') ? '' : 'bad'}`}>
          {tr('Connection test', '连接测试')}: {tr('sending', '发信')} {ok(sp.smtp) ? '✓' : `✗ ${sp.smtp}`} · {tr('receiving', '收信')} {ok(sp.imap) ? '✓' : sp.imap === 'not configured' ? tr('not set up', '未设置') : `✗ ${sp.imap}`}
        </p>
      )}

      {list.length > 0 && (
        <Panel title={tr('Connected mailboxes', '已连接的邮箱')} flush>
          <div className="table-wrap"><table className="t">
            <thead><tr><th>{tr('Mailbox', '邮箱')}</th><th>{tr('Used by', '使用者')}</th><th>{tr('Receiving', '收信')}</th><th>{tr('Last checked', '上次收信')}</th><th /></tr></thead>
            <tbody>{list.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.label || a.email}</strong><span className="sub">{a.from_name ? `${a.from_name} <${a.email}>` : a.email}</span></td>
                <td>{ownerName(a)}</td>
                <td>{a.imap_host ? (a.last_error ? <span className="pill overdue" title={a.last_error}>{tr('Error', '出错')}</span> : <span className="pill plain published">{tr('On', '开启')}</span>) : <span className="muted">{tr('Send only', '仅发信')}</span>}{a.last_error && <span className="sub">{a.last_error.slice(0, 90)}</span>}</td>
                <td className="muted">{a.last_sync ? fmtAgo(a.last_sync, l) : '—'}</td>
                <td className="r">
                  <div className="inline-form" style={{ justifyContent: 'flex-end' }}>
                    <form action={testMailAccountAction}><input type="hidden" name="id" value={a.id} /><button className="btn btn-sm">{tr('Test', '测试')}</button></form>
                    {canEdit(a) && <Link className="btn btn-sm" href={`/HunterLin/settings/email?edit=${a.id}`}>{tr('Edit', '编辑')}</Link>}
                    {canEdit(a) && <form action={removeMailAccount}><input type="hidden" name="id" value={a.id} /><ConfirmButton className="btn btn-ghost btn-sm" message={tr('Disconnect this mailbox? Stored emails are kept.', '确定断开这个邮箱？已保存的邮件会保留。')}>{tr('Disconnect', '断开')}</ConfirmButton></form>}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        </Panel>
      )}

      {showForm && (
        <div style={{ maxWidth: 820, marginTop: 16 }}>
          <Panel title={editing ? tr(`Edit ${editing.email}`, `编辑 ${editing.email}`) : tr('Connect a mailbox', '连接邮箱')} aside={list.length > 0 ? <Link className="muted" href="/HunterLin/settings/email">{tr('Cancel', '取消')}</Link> : undefined}>
            <MailAccountForm action={saveMailAccountAction} l={l} isNew={!editing} chooseOwner={can.users(u)} users={salesUsers().map((x) => ({ id: x.id, name: x.name }))}
              initial={editing ? {
                id: String(editing.id), label: editing.label || '', email: editing.email, from_name: editing.from_name || '', owner_id: editing.owner_id ? String(editing.owner_id) : '',
                smtp_host: editing.smtp_host, smtp_port: String(editing.smtp_port), smtp_secure: String(editing.smtp_secure), smtp_user: editing.smtp_user || '',
                imap_host: editing.imap_host || '', imap_port: String(editing.imap_port), imap_secure: String(editing.imap_secure), imap_user: editing.imap_user || '',
              } : { owner_id: can.users(u) ? '' : String(u.id), from_name: u.name }} />
          </Panel>
        </div>
      )}

      <div style={{ maxWidth: 820, marginTop: 16 }}>
        <Panel title={tr('How it works', '工作方式')}>
          <ul className="plain-list">
            <li>{tr('Emails are sent through your own mail server (SMTP), so customers see your normal address and replies come back to your mailbox.', '邮件通过公司自己的邮件服务器 (SMTP) 发出，客户看到的是你们平时的邮箱地址，回信也会回到你们的邮箱。')}</li>
            <li>{tr('Incoming mail is read from the inbox (IMAP) every few minutes. Messages from known contacts or replies to earlier emails are filed under the customer automatically; nothing is deleted from the mailbox.', '系统每隔几分钟读取收件箱 (IMAP)。已知联系人发来的邮件或对之前邮件的回复，会自动归档到对应客户；不会删除邮箱里的任何邮件。')}</li>
            <li>{tr('Sent emails are also copied to the mailbox’s Sent folder, so they show up in Outlook, Foxmail or webmail too.', '发出的邮件也会存入邮箱的“已发送”文件夹，在 Outlook、Foxmail 或网页邮箱里同样能看到。')}</li>
            <li>{tr('Passwords are stored encrypted. A shared mailbox can be used by every sales user; a personal one only by its owner and managers.', '密码加密保存。共用邮箱所有销售都能使用；个人邮箱只有本人和经理可以使用。')}</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}

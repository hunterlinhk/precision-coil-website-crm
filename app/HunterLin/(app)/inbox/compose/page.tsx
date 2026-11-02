import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope } from '@/lib/admin';
import { translator } from '@/lib/admin-lang';
import { Topbar, Panel } from '@/components/admin/ui';
import { Composer, MailNotice } from '@/components/admin/Email';

export const metadata = { title: 'Write email' };

export default async function Compose({ searchParams }: { searchParams: Promise<{ to?: string; account_id?: string; mailerror?: string; sent?: string }> }) {
  const u = await requireUser(can.crm);
  const { l, tr } = await translator();
  const sp = await searchParams;
  const contacts = db().prepare(`SELECT c.name, c.email, a.name AS company FROM contacts c JOIN accounts a ON a.id = c.account_id WHERE c.email <> '' AND ${scope(u, 'a.owner_id')} ORDER BY a.name, c.name`).all() as any[];
  const accountId = +(sp.account_id || 0) || null;
  return (
    <>
      <Topbar crumbs={[[tr('Inbox', '收件箱'), '/HunterLin/inbox?tab=email'], [tr('Write email', '写邮件')]]} title={tr('Write email', '写邮件')} sub={tr('Emails to known contacts are filed under their customer automatically.', '发给已知联系人的邮件会自动归档到对应客户。')} />
      <MailNotice sp={sp} l={l} />
      <Panel>
        <Composer u={u} l={l} back="/HunterLin/inbox?tab=email&box=sent" to={sp.to} link={{ account_id: accountId }} contacts={contacts.map((c) => ({ name: `${c.name} (${c.company})`, email: c.email }))} />
      </Panel>
    </>
  );
}

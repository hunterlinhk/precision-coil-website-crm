import Link from 'next/link';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, INQ_STATUS, INQ_TYPE, salesUsers, countryName } from '@/lib/admin';
import { translator, label, channel, fmtAgo } from '@/lib/admin-lang';
import { inquiryRef } from '@/lib/crm';
import { mailAccounts, syncIfStale } from '@/lib/mail';
import { Topbar, Pill, Tabs } from '@/components/admin/ui';
import { checkMailNow } from '../../actions-more';

export const metadata = { title: 'Inbox' };

type SP = { tab?: string; status?: string; type?: string; owner?: string; source?: string; q?: string; box?: string; synced?: string; syncerror?: string; sent?: string };

export default async function Inbox({ searchParams }: { searchParams: Promise<SP> }) {
  const u = await requireUser(can.crm);
  const { l, tr } = await translator();
  const sp = await searchParams;
  const tab = sp.tab === 'email' ? 'email' : 'inquiries';
  const boxes = mailAccounts(u);
  if (boxes.length) syncIfStale(u);
  const boxIds = [0, ...boxes.map((b) => b.id)].join(',');
  const newCount = (db().prepare(`SELECT COUNT(*) c FROM inquiries i WHERE ${scope(u, 'i.owner_id', true)} AND status = 'new'`).get() as any).c;
  const unreadCount = (db().prepare(`SELECT COUNT(*) c FROM emails WHERE direction = 'in' AND read = 0 AND mail_account_id IN (${boxIds})`).get() as any).c;
  const link = (patch: Partial<SP>) => { const p = new URLSearchParams({ ...sp, ...patch } as any); ['synced', 'syncerror', 'sent'].forEach((k) => p.delete(k)); [...p.keys()].forEach((k) => { if (!p.get(k)) p.delete(k); }); return `/HunterLin/inbox?${p}`; };

  const header = (
    <>
      <Topbar title={tr('Inbox', '收件箱')} sub={tr('Website inquiries and customer email in one place.', '网站询盘和客户邮件集中在这里处理。')}>
        {tab === 'email' && boxes.some((b) => b.imap_host) && <form action={checkMailNow}><input type="hidden" name="back" value="/HunterLin/inbox?tab=email" /><button className="btn">{tr('Check mail now', '立即收信')}</button></form>}
        <Link className="btn btn-primary" href="/HunterLin/inbox/compose">{tr('Write email', '写邮件')}</Link>
      </Topbar>
      <Tabs label={tr('Inbox', '收件箱')} items={[
        { href: '/HunterLin/inbox', label: tr('Website inquiries', '网站询盘'), current: tab === 'inquiries', count: newCount },
        { href: '/HunterLin/inbox?tab=email', label: tr('Email', '邮件'), current: tab === 'email', count: unreadCount },
      ]} />
      {sp.synced && <p className="notice">{Number(sp.synced) ? tr(`${sp.synced} new message(s) fetched.`, `收到 ${sp.synced} 封新邮件。`) : tr('No new messages.', '没有新邮件。')}</p>}
      {sp.syncerror && <p className="notice bad">{tr('Could not check mail: ', '收信失败：')}{sp.syncerror}</p>}
      {sp.sent && <p className="notice">{tr('Email sent.', '邮件已发送。')}</p>}
    </>
  );

  if (tab === 'email') {
    const where = [`e.mail_account_id IN (${boxIds})`];
    const args: any[] = [];
    if (sp.box === 'sent') where.push(`e.direction = 'out'`);
    else if (sp.box === 'all') { /* both */ } else where.push(`e.direction = 'in'`);
    if (sp.box === 'unread') where.push('e.read = 0');
    if (sp.box === 'unlinked') where.push('e.account_id IS NULL');
    if (sp.q) { where.push('(e.subject LIKE ? OR e.from_addr LIKE ? OR e.from_name LIKE ? OR e.to_addrs LIKE ? OR e.body_text LIKE ?)'); const q = `%${sp.q}%`; args.push(q, q, q, q, q); }
    const rows = db().prepare(`SELECT e.id, e.direction, e.status, e.from_addr, e.from_name, e.to_addrs, e.subject, substr(e.body_text, 1, 160) AS snippet, e.read, e.created_at, e.attachments, e.account_id, a.name AS account
      FROM emails e LEFT JOIN accounts a ON a.id = e.account_id WHERE ${where.join(' AND ')} ORDER BY e.created_at DESC LIMIT 200`).all(...args) as any[];
    const boxesTabs: [string, string][] = [['', tr('Received', '收件')], ['unread', tr('Unread', '未读')], ['unlinked', tr('Not filed', '未归档')], ['sent', tr('Sent', '已发送')], ['all', tr('All', '全部')]];
    return (
      <>
        {header}
        {!boxes.length ? (
          <div className="panel"><div className="panel-body">
            <p>{tr('No company mailbox is connected yet. Connect one to read customer replies here and send email from the CRM.', '尚未连接公司邮箱。连接后即可在这里查看客户回信，并直接从系统发送邮件。')}</p>
            <Link className="btn btn-primary" href="/HunterLin/settings/email?new=1">{tr('Connect a mailbox', '连接邮箱')}</Link>
          </div></div>
        ) : (
          <>
            <div className="filters">
              <nav className="seg" aria-label={tr('Folder', '文件夹')}>{boxesTabs.map(([k, v]) => <Link key={k} href={link({ box: k })} aria-current={(sp.box || '') === k ? 'true' : undefined}>{v}</Link>)}</nav>
              <form className="filters" style={{ margin: 0 }}><input type="hidden" name="tab" value="email" />{sp.box && <input type="hidden" name="box" value={sp.box} />}
                <input type="search" name="q" placeholder={tr('Search subject, sender, text…', '搜索主题、发件人、正文……')} defaultValue={sp.q} aria-label={tr('Search email', '搜索邮件')} /><button className="btn">{tr('Search', '搜索')}</button></form>
            </div>
            <div className="panel"><div className="table-wrap"><table className="t mail-list">
              <thead><tr><th>{sp.box === 'sent' ? tr('To', '收件人') : tr('From', '发件人')}</th><th>{tr('Subject', '主题')}</th><th>{tr('Customer', '客户')}</th><th className="r">{tr('Date', '时间')}</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={4} className="empty">{tr('No messages here.', '这里没有邮件。')}</td></tr>}
                {rows.map((e) => (
                  <tr key={e.id} className={e.direction === 'in' && !e.read ? 'unread' : ''}>
                    <td><Link className="row-link" href={`/HunterLin/inbox/email/${e.id}`}>{e.direction === 'in' ? (e.from_name || e.from_addr) : e.to_addrs}</Link>{e.direction === 'in' && e.from_name && <span className="sub">{e.from_addr}</span>}</td>
                    <td><strong style={{ fontWeight: e.direction === 'in' && !e.read ? 650 : 500 }}>{e.subject || tr('(no subject)', '（无主题）')}</strong>{j<any[]>(e.attachments, []).length > 0 && ' 📎'}{e.status === 'failed' && <> <Pill v="overdue" label={label('failed', l)} /></>}<span className="sub">{(e.snippet || '').replace(/\s+/g, ' ')}</span></td>
                    <td>{e.account_id ? <Link href={`/HunterLin/accounts/${e.account_id}`}>{e.account}</Link> : <span className="muted">—</span>}</td>
                    <td className="r muted">{fmtAgo(e.created_at, l)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div></div>
            <p className="muted" style={{ fontSize: '0.82rem', marginTop: 10 }}>{tr('Mail is checked automatically every few minutes while someone has the admin open. Messages from known contacts are filed under their customer.', '有人打开后台时，每隔几分钟自动收信。已知联系人的邮件会自动归到对应客户下。')}</p>
          </>
        )}
      </>
    );
  }

  // Website inquiries
  const where = [scope(u, 'i.owner_id', true)];
  const args: any[] = [];
  if (sp.status && INQ_STATUS.includes(sp.status)) { where.push('i.status = ?'); args.push(sp.status); }
  else where.push(`i.status NOT IN ('spam','closed')`);
  if (sp.type && INQ_TYPE[sp.type]) { where.push('i.type = ?'); args.push(sp.type); }
  if (sp.owner === 'none') where.push('i.owner_id IS NULL');
  else if (sp.owner === 'me') { where.push('i.owner_id = ?'); args.push(u.id); }
  else if (sp.owner) { where.push('i.owner_id = ?'); args.push(+sp.owner); }
  if (sp.source) { where.push('i.source = ?'); args.push(sp.source); }
  if (sp.q) { where.push('(i.company LIKE ? OR i.name LIKE ? OR i.email LIKE ? OR i.message LIKE ? OR i.items LIKE ?)'); const q = `%${sp.q}%`; args.push(q, q, q, q, q); }
  const rows = db().prepare(`SELECT i.*, us.name AS owner FROM inquiries i LEFT JOIN users us ON us.id = i.owner_id WHERE ${where.join(' AND ')} ORDER BY i.created_at DESC LIMIT 300`).all(...args) as any[];
  const counts = Object.fromEntries((db().prepare(`SELECT status, COUNT(*) c FROM inquiries i WHERE ${scope(u, 'i.owner_id', true)} GROUP BY status`).all() as any[]).map((r) => [r.status, r.c]));
  const sources = (db().prepare('SELECT DISTINCT source FROM inquiries WHERE source IS NOT NULL ORDER BY source').all() as any[]).map((r) => r.source);

  return (
    <>
      {header}
      <div className="filters">
        <nav className="seg" aria-label={tr('Status', '状态')}>
          <Link href={link({ status: '' })} aria-current={!sp.status ? 'true' : undefined}>{tr('Open', '处理中')}</Link>
          {INQ_STATUS.map((s) => <Link key={s} href={link({ status: s })} aria-current={sp.status === s ? 'true' : undefined}>{label(s, l)} <span className="muted">{counts[s] || 0}</span></Link>)}
        </nav>
        <form className="filters" style={{ margin: 0 }}>
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input type="search" name="q" placeholder={tr('Search company, email, part number…', '搜索公司、邮箱、型号……')} defaultValue={sp.q} aria-label={tr('Search inquiries', '搜索询盘')} />
          <select name="type" defaultValue={sp.type || ''} aria-label={tr('Request type', '需求类型')}><option value="">{tr('Any request', '全部类型')}</option>{Object.keys(INQ_TYPE).map((k) => <option key={k} value={k}>{label(k, l)}</option>)}</select>
          <select name="owner" defaultValue={sp.owner || ''} aria-label={tr('Owner', '负责人')}><option value="">{tr('Any owner', '全部负责人')}</option><option value="me">{tr('Mine', '我的')}</option><option value="none">{tr('Unassigned', '未分配')}</option>{can.seeAll(u) && salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select name="source" defaultValue={sp.source || ''} aria-label={tr('Source', '来源')}><option value="">{tr('Any source', '全部来源')}</option>{sources.map((s) => <option key={s} value={s}>{channel(s, l)}</option>)}</select>
          <button className="btn">{tr('Apply', '筛选')}</button>
        </form>
      </div>
      <div className="panel"><div className="table-wrap">
        <table className="t">
          <thead><tr><th>{tr('Ref', '编号')}</th><th>{tr('Company', '公司')}</th><th>{tr('Request', '需求')}</th><th>{tr('Parts', '型号')}</th><th>{tr('Source', '来源')}</th><th>{tr('Owner', '负责人')}</th><th>{tr('Status', '状态')}</th><th className="r">{tr('Received', '收到时间')}</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="empty">{tr('No inquiries match these filters.', '没有符合条件的询盘。')}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className={r.status === 'new' ? 'unread' : ''}>
                <td><Link className="row-link" href={`/HunterLin/inquiries/${r.id}`}>{inquiryRef(r.id)}</Link></td>
                <td><strong>{r.company}</strong><span className="sub">{r.name}, {countryName(r.country)}</span></td>
                <td>{label(r.type, l)}{j<any[]>(r.files, []).length > 0 && <span className="sub">{j<any[]>(r.files, []).length} {tr('file(s)', '个附件')}{r.nda ? ', NDA' : ''}</span>}</td>
                <td>{j<any[]>(r.items, []).map((i) => i.model).join(', ') || <span className="muted">—</span>}</td>
                <td>{channel(r.source, l)}</td>
                <td>{r.owner || <span className="muted">{tr('Unassigned', '未分配')}</span>}</td>
                <td><Pill v={r.status} label={label(r.status, l)} /></td>
                <td className="r muted">{fmtAgo(r.created_at, l)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </>
  );
}

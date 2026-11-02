import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { scope, compactMoney, countryName, STAGE_PROB } from '@/lib/admin';
import { translator, label, channel, fmtAgo } from '@/lib/admin-lang';
import { Topbar, Pill } from '@/components/admin/ui';

export const metadata = { title: 'Customers' };

export default async function Accounts({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string }> }) {
  const u = await requireUser(can.crm);
  const { l, tr } = await translator();
  const sp = await searchParams;
  const where = [scope(u, 'a.owner_id')];
  const args: any[] = [];
  if (sp.q) { where.push('(a.name LIKE ? OR a.domain LIKE ? OR a.industry LIKE ? OR EXISTS (SELECT 1 FROM contacts c WHERE c.account_id = a.id AND (c.name LIKE ? OR c.email LIKE ?)))'); const q = `%${sp.q}%`; args.push(q, q, q, q, q); }
  if (sp.stage) { where.push('a.stage = ?'); args.push(sp.stage); }
  const rows = db().prepare(`SELECT a.*, us.name AS owner,
    (SELECT COUNT(*) FROM inquiries i WHERE i.account_id = a.id) AS inq,
    (SELECT COUNT(*) FROM emails e WHERE e.account_id = a.id AND e.direction = 'in' AND e.read = 0) AS unread,
    (SELECT MAX(created_at) FROM activities ac WHERE ac.account_id = a.id) AS last_touch
    FROM accounts a LEFT JOIN users us ON us.id = a.owner_id WHERE ${where.join(' AND ')} ORDER BY last_touch DESC NULLS LAST, a.name`).all(...args) as any[];
  const opps = db().prepare(`SELECT account_id, stage, value FROM opportunities`).all() as any[];
  const pipe = (id: number) => opps.filter((o) => o.account_id === id && !['won', 'lost'].includes(o.stage)).reduce((s, o) => s + o.value * STAGE_PROB[o.stage], 0);
  const openDeals = (id: number) => opps.filter((o) => o.account_id === id && !['won', 'lost'].includes(o.stage)).length;
  return (
    <>
      <Topbar title={tr('Customers', '客户')} sub={tr(`${rows.length} companies${can.seeAll(u) ? '' : ' you own'}. Deals, quotes, samples and email live on each customer’s page.`, `共 ${rows.length} 家公司${can.seeAll(u) ? '' : '（你负责的）'}。商机、报价、样品和邮件都在客户页面里。`)}>
        <Link href="/HunterLin/accounts/new" className="btn btn-primary">{tr('Add customer', '添加客户')}</Link>
      </Topbar>
      <form className="filters">
        <input type="search" name="q" placeholder={tr('Search company, contact, domain…', '搜索公司、联系人、域名……')} defaultValue={sp.q} aria-label={tr('Search customers', '搜索客户')} />
        <select name="stage" defaultValue={sp.stage || ''} aria-label={tr('Relationship', '客户关系')}><option value="">{tr('All relationships', '全部关系')}</option>{['customer', 'prospect', 'partner'].map((s) => <option key={s} value={s}>{label(s, l)}</option>)}</select>
        <button className="btn">{tr('Apply', '筛选')}</button>
      </form>
      <div className="panel"><div className="table-wrap">
        <table className="t">
          <thead><tr><th>{tr('Company', '公司')}</th><th>{tr('Country', '国家')}</th><th>{tr('Relationship', '关系')}</th><th>{tr('Channel', '来源')}</th><th>{tr('Owner', '负责人')}</th><th className="r">{tr('Open deals', '进行中商机')}</th><th className="r">{tr('Weighted value', '加权金额')}</th><th className="r">{tr('Last activity', '最近动态')}</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="empty">{tr('No customers match.', '没有符合条件的客户。')}</td></tr>}
            {rows.map((a) => (
              <tr key={a.id}>
                <td><Link className="row-link" href={`/HunterLin/accounts/${a.id}`}>{a.name}</Link>{a.unread > 0 && <> <span className="badge" title={tr('Unread email', '未读邮件')}>✉ {a.unread}</span></>}<span className="sub">{a.industry}</span></td>
                <td>{countryName(a.country)}</td>
                <td><Pill v={a.stage} label={label(a.stage, l)} /></td>
                <td>{a.source ? channel(a.source, l) : '—'}</td>
                <td>{a.owner || <span className="muted">—</span>}</td>
                <td className="r">{openDeals(a.id) || <span className="muted">—</span>}</td>
                <td className="r">{pipe(a.id) ? compactMoney(pipe(a.id)) : <span className="muted">—</span>}</td>
                <td className="r muted">{fmtAgo(a.last_touch, l)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </>
  );
}

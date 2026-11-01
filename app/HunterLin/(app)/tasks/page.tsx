import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { dateTime, salesUsers } from '@/lib/admin';
import { Topbar, Panel } from '@/components/admin/ui';
import { createTask, toggleTask } from '@/app/HunterLin/actions';

export const metadata = { title: 'Follow-ups' };

export default async function Tasks({ searchParams }: { searchParams: Promise<{ who?: string; done?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const who = can.seeAll(u) && sp.who ? (sp.who === 'all' ? null : +sp.who) : u.id;
  const rows = db().prepare(`SELECT t.*, a.name AS account, us.name AS assignee FROM tasks t LEFT JOIN accounts a ON a.id = t.account_id LEFT JOIN users us ON us.id = t.user_id
    WHERE t.done = ? ${who ? `AND t.user_id = ${who}` : ''} ORDER BY t.due_at IS NULL, t.due_at ${sp.done ? 'DESC' : 'ASC'} LIMIT 200`).all(sp.done ? 1 : 0) as any[];
  const today = new Date().toISOString().slice(0, 10);
  const groups: [string, any[]][] = sp.done ? [['Completed', rows]] : [
    ['Overdue', rows.filter((t) => t.due_at && t.due_at.slice(0, 10) < today)],
    ['Today', rows.filter((t) => t.due_at && t.due_at.slice(0, 10) === today)],
    ['Upcoming', rows.filter((t) => !t.due_at || t.due_at.slice(0, 10) > today)],
  ];
  const back = `/HunterLin/tasks${sp.who ? `?who=${sp.who}` : ''}`;
  return (
    <>
      <Topbar title="Follow-ups" sub="Reminders from inquiries, notes and deals. New website inquiries create one automatically, due within one working day.">
        {can.seeAll(u) && (
          <form className="inline-form"><select name="who" defaultValue={sp.who || ''} aria-label="Whose tasks"><option value="">Mine</option><option value="all">Whole team</option>{salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><button className="btn btn-sm">Show</button></form>
        )}
        <Link className="btn btn-sm" href={sp.done ? '/HunterLin/tasks' : '/HunterLin/tasks?done=1'}>{sp.done ? 'Show open' : 'Show completed'}</Link>
      </Topbar>
      <div className="grid g-main">
        <div className="stack">
          {groups.map(([label, list]) => list.length > 0 && (
            <Panel key={label} title={label} aside={<span className="badge">{list.length}</span>} flush>
              <ul>
                {list.map((t) => (
                  <li key={t.id} style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--rule)', alignItems: 'flex-start' }}>
                    <form action={toggleTask}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="back" value={back + (sp.done ? '' : '')} /><button className="btn btn-sm" aria-label={t.done ? 'Reopen' : 'Mark done'}>{t.done ? '↺' : '✓'}</button></form>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 560, textDecoration: t.done ? 'line-through' : undefined }}>{t.title}</div>
                      <div className="muted" style={{ fontSize: '0.82rem' }}>
                        {t.due_at ? dateTime(t.due_at) : 'No due date'}
                        {t.account && <>, <Link href={`/HunterLin/accounts/${t.account_id}`}>{t.account}</Link></>}
                        {t.inquiry_id && <>, <Link href={`/HunterLin/inquiries/${t.inquiry_id}`}>inquiry</Link></>}
                        {t.opportunity_id && <>, <Link href={`/HunterLin/opportunities/${t.opportunity_id}`}>opportunity</Link></>}
                        {!who && `, ${t.assignee || 'unassigned'}`}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
          {rows.length === 0 && <Panel><p className="empty">Nothing here. New follow-ups appear when inquiries arrive or you set a reminder on a note.</p></Panel>}
        </div>
        <Panel title="Add a follow-up">
          <form action={createTask} className="form">
            <input type="hidden" name="back" value={back} />
            <div className="f"><label htmlFor="title">What needs doing</label><input id="title" name="title" required /></div>
            <div className="f"><label htmlFor="due">Due</label><input id="due" name="due" type="date" /></div>
            {can.assign(u) && <div className="f"><label htmlFor="user_id">Assign to</label><select id="user_id" name="user_id" defaultValue={u.id}>{salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>}
            <div><button className="btn btn-primary">Add</button></div>
          </form>
        </Panel>
      </div>
    </>
  );
}

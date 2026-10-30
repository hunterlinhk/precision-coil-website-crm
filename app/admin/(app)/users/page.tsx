import { Fragment } from 'react';
import { requireUser, can, roleLabel } from '@/lib/auth';
import { users } from '@/lib/admin';
import { Topbar, Panel } from '@/components/admin/ui';
import { saveUser } from '@/app/admin/actions';

export const metadata = { title: 'Team & permissions' };

const ERR: Record<string, string> = { new: 'Email and a password of at least 10 characters are required.', exists: 'A user with that email already exists.' };
const ROLES = [
  ['admin', 'Everything, including users and permissions'],
  ['manager', 'All CRM records, assigns inquiries, edits website content'],
  ['sales', 'Own customers, deals and unassigned inquiries; inquiries from their regions are routed to them'],
  ['editor', 'Products and articles only, no customer data'],
];

export default async function Users({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const me = await requireUser(can.users);
  const sp = await searchParams;
  const list = users();
  return (
    <>
      <Topbar title="Team & permissions" sub="Roles decide what each person sees. Regions decide who receives new website inquiries." />
      {sp.saved && <p className="notice">Saved.</p>}
      {sp.error && <p className="notice bad">{ERR[sp.error]}</p>}
      <div className="grid g-main">
        <Panel title="People" flush>
          <div className="table-wrap"><table className="t">
            <thead><tr><th>Name</th><th>Role</th><th>Regions (country codes)</th><th>Active</th><th>New password</th><th /></tr></thead>
            <tbody>{list.map((u) => (
              <tr key={u.id}>
                <td colSpan={6} style={{ padding: 0 }}>
                  <form action={saveUser} className="inline-form" style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'minmax(160px,1.2fr) 150px minmax(160px,1.4fr) 60px 150px auto', gap: 8, alignItems: 'center' }}>
                    <input type="hidden" name="id" value={u.id} />
                    <span><input name="name" defaultValue={u.name} aria-label="Name" style={{ width: '100%' }} /><span className="sub muted" style={{ fontSize: '0.8rem' }}>{u.email}</span></span>
                    <select name="role" defaultValue={u.role} aria-label="Role" disabled={u.id === me.id}>{ROLES.map(([r]) => <option key={r} value={r}>{roleLabel[r as keyof typeof roleLabel]}</option>)}</select>
                    {u.id === me.id && <input type="hidden" name="role" value={u.role} />}
                    <input name="regions" defaultValue={u.regions} aria-label="Regions" placeholder="e.g. DE,FR,IT" />
                    <input type="checkbox" name="active" defaultChecked={!!u.active} aria-label="Active" disabled={u.id === me.id} />
                    {u.id === me.id && <input type="hidden" name="active" value="1" />}
                    <input name="password" type="password" placeholder="leave empty" aria-label="New password" autoComplete="new-password" />
                    <button className="btn btn-sm">Save</button>
                  </form>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        </Panel>
        <div className="stack">
          <Panel title="Add a person">
            <form action={saveUser} className="form">
              <div className="f"><label htmlFor="n-name">Name</label><input id="n-name" name="name" /></div>
              <div className="f"><label htmlFor="n-email">Work email</label><input id="n-email" name="email" type="email" required /></div>
              <div className="f"><label htmlFor="n-role">Role</label><select id="n-role" name="role" defaultValue="sales">{ROLES.map(([r]) => <option key={r} value={r}>{roleLabel[r as keyof typeof roleLabel]}</option>)}</select></div>
              <div className="f"><label htmlFor="n-regions">Regions</label><input id="n-regions" name="regions" placeholder="US,CA,MX" /></div>
              <div className="f"><label htmlFor="n-pw">Initial password</label><input id="n-pw" name="password" type="password" minLength={10} required autoComplete="new-password" /><div className="hint"><span>At least 10 characters.</span></div></div>
              <div><button className="btn btn-primary">Add person</button></div>
            </form>
          </Panel>
          <Panel title="What each role can do">
            <dl className="dl" style={{ gridTemplateColumns: '110px 1fr' }}>{ROLES.map(([r, d]) => <Fragment key={r}><dt>{roleLabel[r as keyof typeof roleLabel]}</dt><dd>{d}</dd></Fragment>)}</dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

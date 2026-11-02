import { Fragment } from 'react';
import { requireUser, can } from '@/lib/auth';
import { users } from '@/lib/admin';
import { translator, label } from '@/lib/admin-lang';
import { Topbar, Panel } from '@/components/admin/ui';
import { saveUser } from '@/app/HunterLin/actions';

export const metadata = { title: 'Team & permissions' };

export default async function Users({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const me = await requireUser(can.users);
  const { l, tr } = await translator();
  const sp = await searchParams;
  const list = users();
  const ERR: Record<string, string> = { new: tr('Email and a password of at least 10 characters are required.', '请填写邮箱，密码至少 10 位。'), exists: tr('A user with that email already exists.', '该邮箱已有账号。'), username: tr('That username is already taken.', '该用户名已被使用。') };
  const ROLES: [string, string][] = [
    ['admin', tr('Everything, including users, permissions and integrations', '全部权限，包括用户、权限和第三方连接')],
    ['manager', tr('All customers and deals, assigns inquiries, edits website content', '查看全部客户和商机，分配询盘，编辑网站内容')],
    ['sales', tr('Own customers, deals and unassigned inquiries; inquiries from their regions are routed to them', '自己负责的客户、商机和未分配询盘；所负责地区的新询盘自动分给他')],
    ['editor', tr('Products, articles and logos only, no customer data', '只能编辑产品、文章和客户标志，看不到客户数据')],
  ];
  return (
    <>
      <Topbar title={tr('Team & permissions', '团队与权限')} sub={tr('Roles decide what each person sees. Regions decide who receives new website inquiries.', '角色决定每个人能看到什么；地区决定新询盘分给谁。')} />
      {sp.saved && <p className="notice">{tr('Saved.', '已保存。')}</p>}
      {sp.error && <p className="notice bad">{ERR[sp.error]}</p>}
      <div className="grid g-main">
        <Panel title={tr('People', '成员')} flush>
          <div className="table-wrap"><table className="t">
            <thead><tr><th>{tr('Name', '姓名')}</th><th>{tr('Role', '角色')}</th><th>{tr('Regions (country codes)', '负责地区（国家代码）')}</th><th>{tr('Active', '启用')}</th><th>{tr('New password', '新密码')}</th><th /></tr></thead>
            <tbody>{list.map((u) => (
              <tr key={u.id}>
                <td colSpan={6} style={{ padding: 0 }}>
                  <form action={saveUser} className="inline-form user-row">
                    <input type="hidden" name="id" value={u.id} />
                    <span style={{ display: 'grid', gap: 4 }}><input name="name" defaultValue={u.name} aria-label={tr('Name', '姓名')} style={{ width: '100%' }} /><input name="username" defaultValue={u.username || ''} aria-label={tr('Username', '用户名')} placeholder={tr('username (optional)', '用户名（可选）')} style={{ width: '100%', fontSize: '0.8rem' }} /><span className="sub muted" style={{ fontSize: '0.8rem' }}>{u.email}</span></span>
                    <select name="role" defaultValue={u.role} aria-label={tr('Role', '角色')} disabled={u.id === me.id}>{ROLES.map(([r]) => <option key={r} value={r}>{label(r, l)}</option>)}</select>
                    {u.id === me.id && <input type="hidden" name="role" value={u.role} />}
                    <input name="regions" defaultValue={u.regions} aria-label={tr('Regions', '地区')} placeholder={tr('e.g. DE,FR,IT', '例如 DE,FR,IT')} />
                    <input type="checkbox" name="active" defaultChecked={!!u.active} aria-label={tr('Active', '启用')} disabled={u.id === me.id} />
                    {u.id === me.id && <input type="hidden" name="active" value="1" />}
                    <input name="password" type="password" placeholder={tr('leave empty', '不修改请留空')} aria-label={tr('New password', '新密码')} autoComplete="new-password" />
                    <button className="btn btn-sm">{tr('Save', '保存')}</button>
                  </form>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        </Panel>
        <div className="stack">
          <Panel title={tr('Add a person', '添加成员')}>
            <form action={saveUser} className="form">
              <div className="f"><label htmlFor="n-name">{tr('Name', '姓名')}</label><input id="n-name" name="name" /></div>
              <div className="f"><label htmlFor="n-user">{tr('Username', '用户名')}</label><input id="n-user" name="username" placeholder={tr('optional', '可选')} autoCapitalize="none" /><div className="hint"><span>{tr('Signs in with this or the email.', '可用用户名或邮箱登录。')}</span></div></div>
              <div className="f"><label htmlFor="n-email">{tr('Work email', '工作邮箱')}</label><input id="n-email" name="email" type="email" required /></div>
              <div className="f"><label htmlFor="n-role">{tr('Role', '角色')}</label><select id="n-role" name="role" defaultValue="sales">{ROLES.map(([r]) => <option key={r} value={r}>{label(r, l)}</option>)}</select></div>
              <div className="f"><label htmlFor="n-regions">{tr('Regions', '负责地区')}</label><input id="n-regions" name="regions" placeholder="US,CA,MX" /></div>
              <div className="f"><label htmlFor="n-pw">{tr('Initial password', '初始密码')}</label><input id="n-pw" name="password" type="password" minLength={10} required autoComplete="new-password" /><div className="hint"><span>{tr('At least 10 characters.', '至少 10 位。')}</span></div></div>
              <div><button className="btn btn-primary">{tr('Add person', '添加')}</button></div>
            </form>
          </Panel>
          <Panel title={tr('What each role can do', '各角色权限')}>
            <dl className="dl" style={{ gridTemplateColumns: '110px 1fr' }}>{ROLES.map(([r, d]) => <Fragment key={r}><dt>{label(r, l)}</dt><dd>{d}</dd></Fragment>)}</dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

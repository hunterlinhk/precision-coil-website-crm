import { saveAccount } from '@/app/HunterLin/actions';
import { salesUsers } from '@/lib/admin';

export function AccountForm({ a, canAssign }: { a?: any; canAssign: boolean }) {
  return (
    <form action={saveAccount} className="form">
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="fgrid">
        <div className="f full"><label htmlFor="name">Company name</label><input id="name" name="name" required defaultValue={a?.name} /></div>
        <div className="f"><label htmlFor="domain">Email domain</label><input id="domain" name="domain" placeholder="example.com" defaultValue={a?.domain} /><div className="hint">New website inquiries from this domain are linked automatically.</div></div>
        <div className="f"><label htmlFor="country">Country code</label><input id="country" name="country" maxLength={2} placeholder="DE" defaultValue={a?.country} /></div>
        <div className="f"><label htmlFor="industry">Industry</label><input id="industry" name="industry" defaultValue={a?.industry} /></div>
        <div className="f"><label htmlFor="stage">Relationship</label><select id="stage" name="stage" defaultValue={a?.stage || 'prospect'}><option value="prospect">Prospect</option><option value="customer">Customer</option><option value="partner">Partner</option></select></div>
        <div className="f"><label htmlFor="source">Acquisition channel</label><input id="source" name="source" list="sources" defaultValue={a?.source} />
          <datalist id="sources">{['Google organic', 'AI search', 'LinkedIn', 'Trade show', 'Referral', 'Direct', 'Email campaign', 'Baidu'].map((s) => <option key={s} value={s} />)}</datalist></div>
        <div className="f"><label htmlFor="annual_volume">Annual volume</label><input id="annual_volume" name="annual_volume" defaultValue={a?.annual_volume} /></div>
        <div className="f"><label htmlFor="website">Website</label><input id="website" name="website" defaultValue={a?.website} /></div>
        {canAssign && <div className="f"><label htmlFor="owner_id">Account owner</label><select id="owner_id" name="owner_id" defaultValue={a?.owner_id || ''}><option value="">Unassigned</option>{salesUsers().map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
        <div className="f full"><label htmlFor="notes">Requirements and notes</label><textarea id="notes" name="notes" defaultValue={a?.notes} placeholder="Products of interest, quality requirements, approved vendor status…" /></div>
      </div>
      <div><button className="btn btn-primary">{a ? 'Save changes' : 'Create customer'}</button></div>
    </form>
  );
}

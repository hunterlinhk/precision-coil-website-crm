import { saveAccount } from '@/app/HunterLin/actions';
import { salesUsers } from '@/lib/admin';
import { type AL, label } from '@/lib/admin-lang';

export function AccountForm({ a, canAssign, l }: { a?: any; canAssign: boolean; l: AL }) {
  const tr = (en: string, zh: string) => (l === 'zh' ? zh : en);
  return (
    <form action={saveAccount} className="form">
      {a?.id && <input type="hidden" name="id" value={a.id} />}
      <div className="fgrid">
        <div className="f full"><label htmlFor="name">{tr('Company name', '公司名称')}</label><input id="name" name="name" required defaultValue={a?.name} /></div>
        <div className="f"><label htmlFor="domain">{tr('Email domain', '邮箱域名')}</label><input id="domain" name="domain" placeholder="example.com" defaultValue={a?.domain} /><div className="hint">{tr('Inquiries and emails from this domain are linked automatically.', '来自该域名的询盘和邮件会自动关联到这个客户。')}</div></div>
        <div className="f"><label htmlFor="country">{tr('Country code', '国家代码')}</label><input id="country" name="country" maxLength={2} placeholder="DE" defaultValue={a?.country} /></div>
        <div className="f"><label htmlFor="industry">{tr('Industry', '行业')}</label><input id="industry" name="industry" defaultValue={a?.industry} /></div>
        <div className="f"><label htmlFor="stage">{tr('Relationship', '客户关系')}</label><select id="stage" name="stage" defaultValue={a?.stage || 'prospect'}>{['prospect', 'customer', 'partner'].map((s) => <option key={s} value={s}>{label(s, l)}</option>)}</select></div>
        <div className="f"><label htmlFor="source">{tr('How they found us', '来源渠道')}</label><input id="source" name="source" list="sources" defaultValue={a?.source} />
          <datalist id="sources">{['Google organic', 'AI search', 'LinkedIn', 'Trade show', 'Referral', 'Direct', 'Email campaign', 'Baidu'].map((s) => <option key={s} value={s} />)}</datalist></div>
        <div className="f"><label htmlFor="annual_volume">{tr('Annual volume', '年用量')}</label><input id="annual_volume" name="annual_volume" defaultValue={a?.annual_volume} /></div>
        <div className="f"><label htmlFor="website">{tr('Website', '网站')}</label><input id="website" name="website" defaultValue={a?.website} /></div>
        {canAssign && <div className="f"><label htmlFor="owner_id">{tr('Account owner', '负责人')}</label><select id="owner_id" name="owner_id" defaultValue={a?.owner_id || ''}><option value="">{tr('Unassigned', '未分配')}</option>{salesUsers().map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
        <div className="f full"><label htmlFor="notes">{tr('Requirements and notes', '需求与备注')}</label><textarea id="notes" name="notes" defaultValue={a?.notes} placeholder={tr('Products of interest, quality requirements, approved vendor status…', '关注的产品、品质要求、供应商认证情况……')} /></div>
      </div>
      <div><button className="btn btn-primary">{a?.id ? tr('Save changes', '保存修改') : tr('Create customer', '创建客户')}</button></div>
    </form>
  );
}

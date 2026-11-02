'use client';
import { useState } from 'react';

type V = Record<string, string>;
type Preset = { key: string; en: string; zh: string; v: V; note_en?: string; note_zh?: string };

// Server settings for common company mail providers.
const PRESETS: Preset[] = [
  { key: 'exmail', en: 'Tencent Exmail', zh: '腾讯企业邮', v: { smtp_host: 'smtp.exmail.qq.com', smtp_port: '465', smtp_secure: '1', imap_host: 'imap.exmail.qq.com', imap_port: '993', imap_secure: '1' },
    note_en: 'If “secure login” is on for the mailbox, create a client-specific password in Exmail settings and use that here.', note_zh: '如果邮箱开启了“安全登录”，请在企业邮设置里生成“客户端专用密码”，在这里填写该密码。' },
  { key: 'aliyun', en: 'Alibaba Mail', zh: '阿里企业邮', v: { smtp_host: 'smtp.qiye.aliyun.com', smtp_port: '465', smtp_secure: '1', imap_host: 'imap.qiye.aliyun.com', imap_port: '993', imap_secure: '1' } },
  { key: 'netease', en: 'NetEase Qiye Mail', zh: '网易企业邮', v: { smtp_host: 'smtp.qiye.163.com', smtp_port: '465', smtp_secure: '1', imap_host: 'imap.qiye.163.com', imap_port: '993', imap_secure: '1' },
    note_en: 'If client authorization codes are enabled, use the authorization code instead of the login password.', note_zh: '如开启了客户端授权码，请填写授权码而不是登录密码。' },
  { key: 'google', en: 'Google Workspace / Gmail', zh: 'Google Workspace / Gmail', v: { smtp_host: 'smtp.gmail.com', smtp_port: '465', smtp_secure: '1', imap_host: 'imap.gmail.com', imap_port: '993', imap_secure: '1' },
    note_en: 'Google requires an app password: turn on 2-Step Verification, then create one under Google Account → Security → App passwords.', note_zh: '谷歌邮箱需要“应用专用密码”：先开启两步验证，再在 Google 账号 → 安全 → 应用专用密码 中生成。' },
  { key: 'm365', en: 'Microsoft 365', zh: 'Microsoft 365', v: { smtp_host: 'smtp.office365.com', smtp_port: '587', smtp_secure: '0', imap_host: 'outlook.office365.com', imap_port: '993', imap_secure: '1' },
    note_en: 'Microsoft 365 often blocks password sign-in for SMTP and IMAP. If the test fails, ask your IT administrator to allow it for this mailbox.', note_zh: 'Microsoft 365 经常禁止用密码登录 SMTP/IMAP。如果测试失败，请让 IT 管理员为该邮箱开启。' },
];

export function MailAccountForm({ action, initial, users, chooseOwner, l, isNew }: {
  action: (fd: FormData) => void; initial: V; users: { id: number; name: string }[]; chooseOwner: boolean; l: 'en' | 'zh'; isNew: boolean;
}) {
  const tr = (en: string, zh: string) => (l === 'zh' ? zh : en);
  const [v, setV] = useState<V>(() => (isNew && !initial.smtp_host ? { ...initial, ...PRESETS[0].v } : initial));
  const [preset, setPreset] = useState<string>(() => PRESETS.find((p) => p.v.smtp_host === initial.smtp_host)?.key || (isNew ? 'exmail' : 'custom'));
  const [advanced, setAdvanced] = useState(!isNew && preset === 'custom');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  const choose = (key: string) => {
    setPreset(key);
    const p = PRESETS.find((x) => x.key === key);
    if (p) setV((cur) => ({ ...cur, ...p.v }));
    else setAdvanced(true);
  };
  const p = PRESETS.find((x) => x.key === preset);
  return (
    <form action={action} className="form">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {['smtp_host', 'smtp_port', 'smtp_secure', 'imap_host', 'imap_port', 'imap_secure'].map((k) => !advanced && <input key={k} type="hidden" name={k} value={v[k] || ''} />)}
      <div className="f">
        <span className="lbl">{tr('Email provider', '邮箱服务商')}</span>
        <div className="chips" role="radiogroup">
          {PRESETS.map((x) => <button type="button" key={x.key} role="radio" aria-checked={preset === x.key} onClick={() => choose(x.key)}>{l === 'zh' ? x.zh : x.en}</button>)}
          <button type="button" role="radio" aria-checked={preset === 'custom'} onClick={() => choose('custom')}>{tr('Other', '其他')}</button>
        </div>
        {p?.note_en && <div className="hint"><span>{l === 'zh' ? p.note_zh : p.note_en}</span></div>}
      </div>
      <div className="fgrid">
        <div className="f"><label htmlFor="m-email">{tr('Email address', '邮箱地址')}</label><input id="m-email" name="email" type="email" required value={v.email || ''} onChange={set('email')} placeholder="sales@yourcompany.com" /></div>
        <div className="f"><label htmlFor="m-pass">{tr('Password', '密码')}</label><input id="m-pass" name="smtp_pass" type="password" autoComplete="new-password" required={isNew} placeholder={isNew ? '' : tr('Leave empty to keep the saved password', '留空则保留已保存的密码')} /><div className="hint"><span>{tr('Stored encrypted. Used for both sending and receiving.', '加密保存，发信和收信共用。')}</span></div></div>
        <div className="f"><label htmlFor="m-from">{tr('Sender name', '发件人名称')}</label><input id="m-from" name="from_name" value={v.from_name || ''} onChange={set('from_name')} placeholder={tr('e.g. Lin Hao, Arcwind Sales', '例如：林浩 Arcwind 销售部')} /></div>
        <div className="f"><label htmlFor="m-label">{tr('Name in the CRM', '显示名称')}</label><input id="m-label" name="label" value={v.label || ''} onChange={set('label')} placeholder={tr('e.g. Sales inbox', '例如：销售部邮箱')} /></div>
        {chooseOwner && (
          <div className="f full"><label htmlFor="m-owner">{tr('Who uses this mailbox', '谁使用这个邮箱')}</label>
            <select id="m-owner" name="owner_id" value={v.owner_id || ''} onChange={set('owner_id')}><option value="">{tr('Shared by the whole sales team', '整个销售团队共用')}</option>{users.map((u) => <option key={u.id} value={u.id}>{tr('Only', '仅')} {u.name}</option>)}</select></div>
        )}
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>{advanced ? tr('Hide server settings', '收起服务器设置') : tr('Show server settings', '显示服务器设置')}</button>
      {advanced && (
        <div className="fgrid">
          <div className="f"><label htmlFor="m-sh">{tr('Outgoing server (SMTP)', '发件服务器 (SMTP)')}</label><input id="m-sh" name="smtp_host" value={v.smtp_host || ''} onChange={set('smtp_host')} required /></div>
          <div className="f inline2">
            <div><label htmlFor="m-sp">{tr('Port', '端口')}</label><input id="m-sp" name="smtp_port" value={v.smtp_port || ''} onChange={set('smtp_port')} inputMode="numeric" /></div>
            <div><label htmlFor="m-ss">{tr('Security', '加密')}</label><select id="m-ss" name="smtp_secure" value={v.smtp_secure || '1'} onChange={set('smtp_secure')}><option value="1">SSL/TLS</option><option value="0">STARTTLS</option></select></div>
          </div>
          <div className="f"><label htmlFor="m-su">{tr('SMTP user name', 'SMTP 用户名')}</label><input id="m-su" name="smtp_user" value={v.smtp_user || ''} onChange={set('smtp_user')} placeholder={tr('Usually the email address', '通常就是邮箱地址')} /></div>
          <div className="f" />
          <div className="f"><label htmlFor="m-ih">{tr('Incoming server (IMAP)', '收件服务器 (IMAP)')}</label><input id="m-ih" name="imap_host" value={v.imap_host || ''} onChange={set('imap_host')} placeholder={tr('Leave empty to only send', '留空则只发信不收信')} /></div>
          <div className="f inline2">
            <div><label htmlFor="m-ip">{tr('Port', '端口')}</label><input id="m-ip" name="imap_port" value={v.imap_port || ''} onChange={set('imap_port')} inputMode="numeric" /></div>
            <div><label htmlFor="m-is">{tr('Security', '加密')}</label><select id="m-is" name="imap_secure" value={v.imap_secure || '1'} onChange={set('imap_secure')}><option value="1">SSL/TLS</option><option value="0">STARTTLS</option></select></div>
          </div>
          <div className="f"><label htmlFor="m-iu">{tr('IMAP user name', 'IMAP 用户名')}</label><input id="m-iu" name="imap_user" value={v.imap_user || ''} onChange={set('imap_user')} placeholder={tr('Usually the email address', '通常就是邮箱地址')} /></div>
          <div className="f"><label htmlFor="m-ipw">{tr('IMAP password (if different)', 'IMAP 密码（如不同）')}</label><input id="m-ipw" name="imap_pass" type="password" autoComplete="new-password" /></div>
        </div>
      )}
      <div><button className="btn btn-primary">{isNew ? tr('Connect and test', '连接并测试') : tr('Save and test', '保存并测试')}</button></div>
    </form>
  );
}

import Link from 'next/link';
import { requireUser, can } from '@/lib/auth';
import { translator, fmtDateTime } from '@/lib/admin-lang';
import { gscConfig } from '@/lib/gsc';
import { getSetting } from '@/lib/secrets';
import { site } from '@/lib/site';
import { Topbar, Panel } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/client';
import { saveGsc, disconnectGsc } from '../../../actions-more';

export const metadata = { title: 'Google Search Console' };

export default async function Integrations({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; removed?: string }> }) {
  await requireUser(can.users);
  const { l, tr } = await translator();
  const sp = await searchParams;
  const cfg = gscConfig();
  const cache = getSetting<{ fetchedAt: string } | null>('gsc_cache', null);
  let host = 'www.example.com';
  try { host = new URL(site.url).host; } catch { /* keep */ }

  return (
    <>
      <Topbar title={tr('Google Search Console', '谷歌搜索数据 (Search Console)')} sub={tr('See your Google rankings, search terms and clicks in Analytics.', '在“数据分析”里查看谷歌排名、搜索词和点击量。')} />
      {sp.ok && <p className="notice">{tr('Connected. Search data is now in Analytics → Google search.', '已连接，可在“数据分析 → 谷歌搜索”中查看。')} <Link href="/HunterLin/analytics?tab=search">{tr('Open', '打开')}</Link></p>}
      {sp.removed && <p className="notice">{tr('Disconnected.', '已断开。')}</p>}
      {sp.error && <p className="notice bad">{tr('Google said: ', '谷歌返回：')}{sp.error}</p>}
      <div className="grid g-main">
        <div className="stack">
          <Panel title={cfg ? tr('Connection', '连接') : tr('Connect', '连接')}>
            {cfg && (
              <dl className="dl" style={{ marginBottom: 16 }}>
                <dt>{tr('Property', '资源')}</dt><dd>{cfg.property}</dd>
                <dt>{tr('Service account', '服务账号')}</dt><dd><code>{cfg.email}</code></dd>
                <dt>{tr('Last update', '上次更新')}</dt><dd>{cache ? fmtDateTime(cache.fetchedAt, l) : '—'}</dd>
              </dl>
            )}
            <form action={saveGsc} className="form">
              <div className="f"><label htmlFor="property">{tr('Search Console property', 'Search Console 资源')}</label>
                <input id="property" name="property" required defaultValue={cfg?.property || ''} placeholder={`sc-domain:${host.replace(/^www\./, '')}`} />
                <div className="hint"><span>{tr(`Exactly as shown in Search Console: “sc-domain:${host.replace(/^www\./, '')}” for a domain property, or “https://${host}/” for a URL-prefix property.`, `与 Search Console 中显示的完全一致：网域资源填“sc-domain:${host.replace(/^www\./, '')}”，网址前缀资源填“https://${host}/”。`)}</span></div></div>
              <div className="f"><label htmlFor="key_file">{tr('Service account key (JSON file)', '服务账号密钥（JSON 文件）')}</label>
                <input id="key_file" name="key_file" type="file" accept=".json,application/json" />
                <details style={{ marginTop: 6 }}><summary className="muted">{tr('…or paste the JSON', '……或粘贴 JSON 内容')}</summary><textarea name="key_json" placeholder='{"type": "service_account", ...}' style={{ minHeight: 120, fontFamily: 'var(--mono, monospace)', fontSize: '0.8rem' }} /></details>
                <div className="hint"><span>{cfg ? tr('Leave empty to keep the saved key.', '留空则保留已保存的密钥。') : tr('Stored encrypted. Read-only access is all that is requested.', '加密保存，只申请只读权限。')}</span></div></div>
              <div className="inline-form"><button className="btn btn-primary">{cfg ? tr('Save and test', '保存并测试') : tr('Connect and test', '连接并测试')}</button></div>
            </form>
            {cfg && <form action={disconnectGsc} style={{ marginTop: 16 }}><ConfirmButton className="btn btn-ghost btn-sm" message={tr('Disconnect Search Console?', '确定断开 Search Console？')}>{tr('Disconnect', '断开')}</ConfirmButton></form>}
          </Panel>
        </div>
        <div className="stack">
          <Panel title={tr('Setting it up (about 10 minutes)', '设置步骤（约 10 分钟）')}>
            <ol className="steps">
              <li>{tr('Make sure the website is verified in Google Search Console (search.google.com/search-console).', '确认网站已在 Google Search Console（search.google.com/search-console）完成验证。')}</li>
              <li>{tr('In Google Cloud Console (console.cloud.google.com), create a project and enable the “Google Search Console API”.', '在 Google Cloud Console（console.cloud.google.com）新建一个项目，并启用“Google Search Console API”。')}</li>
              <li>{tr('Go to IAM & Admin → Service accounts, create a service account, then Keys → Add key → JSON. A key file downloads.', '进入“IAM 和管理 → 服务账号”，创建服务账号，然后“密钥 → 添加密钥 → JSON”，会下载一个密钥文件。')}</li>
              <li>{tr('Back in Search Console: Settings → Users and permissions → Add user. Enter the service account’s email (ends in .iam.gserviceaccount.com) with “Restricted” permission.', '回到 Search Console：设置 → 用户和权限 → 添加用户，填写服务账号邮箱（以 .iam.gserviceaccount.com 结尾），权限选“受限”。')}</li>
              <li>{tr('Upload the key file here and enter the property name.', '在这里上传密钥文件并填写资源名称。')}</li>
            </ol>
          </Panel>
          <Panel title={tr('Website visitors', '网站访客统计')}>
            <p className="muted">{tr('Visitor counts are built in and need no setup. They are cookie-free and store no personal data, following the approach of the open-source tools Plausible and Umami.', '访客统计已内置，无需设置。不使用 Cookie、不保存个人信息，参照开源工具 Plausible 和 Umami 的做法。')}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}

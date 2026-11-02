import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';
import { hoursBetween, INQ_STATUS, salesUsers, countryName } from '@/lib/admin';
import { translator, label, channel, fmtAgo, fmtDateTime } from '@/lib/admin-lang';
import { inquiryRef } from '@/lib/crm';
import { Topbar, Panel, Pill } from '@/components/admin/ui';
import { AutoSelect } from '@/components/admin/client';
import { Timeline } from '@/components/admin/Timeline';
import { Composer, MailNotice, Thread } from '@/components/admin/Email';
import { site } from '@/lib/site';
import { updateInquiry, markResponded, convertInquiry, addActivity } from '../../../actions';

export default async function Inquiry({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; mailerror?: string }> }) {
  const u = await requireUser(can.crm);
  const { l, tr } = await translator();
  const { id } = await params;
  const sp = await searchParams;
  const q = db().prepare('SELECT i.*, us.name AS owner FROM inquiries i LEFT JOIN users us ON us.id = i.owner_id WHERE i.id = ?').get(+id) as any;
  if (!q) notFound();
  if (!can.seeAll(u) && q.owner_id && q.owner_id !== u.id) redirect('/HunterLin?denied=1');
  const items = j<any[]>(q.items, []);
  const files = j<any[]>(q.files, []);
  const account = q.account_id ? (db().prepare('SELECT * FROM accounts WHERE id = ?').get(q.account_id) as any) : null;
  const history = db().prepare(`SELECT COUNT(*) c FROM inquiries WHERE lower(email) = lower(?) AND id != ?`).get(q.email, q.id) as any;
  const acts = db().prepare('SELECT ac.*, us.name AS who FROM activities ac LEFT JOIN users us ON us.id = ac.user_id WHERE ac.inquiry_id = ? ORDER BY ac.created_at DESC').all(q.id) as any[];
  const emails = db().prepare('SELECT * FROM emails WHERE inquiry_id = ? OR (direction = \'in\' AND lower(from_addr) = lower(?) AND account_id IS NULL AND inquiry_id IS NULL) ORDER BY created_at').all(q.id, q.email) as any[];
  const respH = q.first_response_at ? hoursBetween(q.created_at, q.first_response_at) : null;
  const back = `/HunterLin/inquiries/${q.id}`;
  const ref = inquiryRef(q.id);
  const last = [...emails].reverse().find((e) => e.direction === 'in');
  const parts = items.map((i) => i.model).join(', ');
  const greeting = q.locale === 'zh'
    ? `${q.name}，您好：\n\n感谢您通过官网联系${site.brand}（询盘编号 ${ref}）。\n\n\n\n此致\n${u.name}\n${site.brand}`
    : `Dear ${q.name.split(' ')[0]},\n\nThank you for your ${label(q.type, 'en').toLowerCase()} request${parts ? ` for ${parts}` : ''} (ref. ${ref}).\n\n\n\nBest regards,\n${u.name}\n${site.brand}`;
  const subject = last ? (last.subject.match(/^re:/i) ? last.subject : `Re: ${last.subject}`) : q.locale === 'zh' ? `回复：您的询盘 ${ref}` : `Re: your ${label(q.type, 'en').toLowerCase()} request ${ref}`;

  return (
    <>
      <Topbar crumbs={[[tr('Inbox', '收件箱'), '/HunterLin/inbox'], [ref]]} title={<>{q.company} <Pill v={q.status} label={label(q.status, l)} /></>}
        sub={`${label(q.type, l)} · ${q.name} · ${tr('received', '收到于')} ${fmtDateTime(q.created_at, l)} (${fmtAgo(q.created_at, l)})`}>
        {q.account_id ? <Link className="btn btn-primary" href={`/HunterLin/accounts/${q.account_id}${q.opportunity_id ? `#deal-${q.opportunity_id}` : ''}`}>{tr('Open customer', '打开客户')}</Link> : null}
      </Topbar>
      <MailNotice sp={sp} l={l} />
      <div className="grid g-main">
        <div className="stack">
          <Panel title={tr('Request', '询盘内容')}>
            <div className="message">{q.message}</div>
            {items.length > 0 && (
              <table className="t" style={{ marginTop: 14 }}>
                <thead><tr><th>{tr('Part from quote list', '询价型号')}</th><th className="r">{tr('Quantity', '数量')}</th></tr></thead>
                <tbody>{items.map((i, k) => <tr key={k}><td><strong>{i.model}</strong></td><td className="r">{i.qty ? (Number.isFinite(+i.qty) ? (+i.qty).toLocaleString('en') : i.qty) : '—'}</td></tr>)}</tbody>
              </table>
            )}
            <dl className="dl" style={{ marginTop: 14 }}>
              <dt>{tr('Annual volume', '年用量')}</dt><dd>{q.annual_volume || '—'}</dd>
              <dt>{tr('Target date', '目标日期')}</dt><dd>{q.target_date || '—'}</dd>
              <dt>{tr('Files', '附件')}</dt><dd>{files.length ? files.map((f) => f.id ? <a key={f.id} href={`/api/files/${f.id}?name=${encodeURIComponent(f.name)}`} style={{ display: 'block' }}>{f.name}</a> : <span key={f.name} style={{ display: 'block' }}>{f.name}</span>) : '—'}</dd>
              <dt>{tr('Confidential', '保密')}</dt><dd>{q.nda ? tr('Yes, send an NDA before opening files', '是，打开附件前请先签保密协议') : tr('No', '否')}</dd>
            </dl>
          </Panel>

          <Panel title={emails.length ? tr(`Email (${emails.length})`, `邮件（${emails.length}）`) : tr('Reply by email', '邮件回复')}>
            {emails.length > 0 && <div style={{ marginBottom: 16 }}><Thread emails={emails} l={l} /></div>}
            <Composer u={u} l={l} back={back} to={q.email} subject={subject} body={greeting}
              inReplyTo={last?.message_id} references={last ? [last.refs, last.message_id].filter(Boolean).join(' ') : null}
              link={{ inquiry_id: q.id, account_id: q.account_id, contact_id: q.contact_id }} />
          </Panel>

          {!['converted', 'spam'].includes(q.status) && (
            <Panel title={tr('Turn into a deal', '转为商机')}>
              <form action={convertInquiry} className="form">
                <input type="hidden" name="id" value={q.id} />
                <div className="fgrid">
                  <div className="f full"><label htmlFor="title">{tr('Deal name', '商机名称')}</label><input id="title" name="title" defaultValue={`${parts || tr('Custom coil', '定制线圈')} ${tr('for', '—')} ${q.company}`} /></div>
                  <div className="f"><label htmlFor="value">{tr('Estimated annual value (USD)', '预计年销售额（美元）')}</label><input id="value" name="value" inputMode="decimal" placeholder="120000" /></div>
                  <div className="f"><label htmlFor="expected_close">{tr('Expected decision', '预计成交日期')}</label><input id="expected_close" name="expected_close" type="date" /></div>
                </div>
                <p className="muted" style={{ fontSize: '0.85rem' }}>{account ? tr(`Added to the existing customer ${account.name}.`, `将添加到现有客户“${account.name}”。`) : tr(`Creates the customer “${q.company}” with ${q.name} as contact.`, `将创建客户“${q.company}”，联系人为 ${q.name}。`)}{q.type === 'sample' ? tr(' A sample request is logged too.', ' 同时登记一条样品申请。') : ''}</p>
                <div><button className="btn btn-primary">{tr('Create deal', '创建商机')}</button></div>
              </form>
            </Panel>
          )}

          <Panel title={tr('Notes and history', '备注与记录')}>
            <form action={addActivity} className="form" style={{ marginBottom: 8 }}>
              <input type="hidden" name="inquiry_id" value={q.id} /><input type="hidden" name="account_id" value={q.account_id || ''} /><input type="hidden" name="back" value={back} />
              <div className="fgrid">
                <div className="f full"><label htmlFor="body">{tr('Add a note', '添加备注')}</label><textarea id="body" name="body" placeholder={tr('Call notes, what the buyer needs, next step…', '通话记录、客户需求、下一步……')} /></div>
                <div className="f"><label htmlFor="kind">{tr('Type', '类型')}</label><select id="kind" name="kind">{['note', 'call', 'email', 'meeting'].map((k) => <option key={k} value={k}>{label(k, l)}</option>)}</select></div>
                <div className="f"><label htmlFor="follow_up">{tr('Remind me on', '提醒日期')}</label><input id="follow_up" name="follow_up" type="date" /></div>
              </div>
              <div><button className="btn">{tr('Save note', '保存备注')}</button></div>
            </form>
            <Timeline items={acts} l={l} />
          </Panel>
        </div>
        <div className="stack">
          <Panel title={tr('Handling', '处理')}>
            <div className="form">
              <form action={updateInquiry} className="f">
                <input type="hidden" name="id" value={q.id} />
                <label htmlFor="status">{tr('Status', '状态')}</label>
                <AutoSelect id="status" name="status" defaultValue={q.status}>{INQ_STATUS.map((s) => <option key={s} value={s}>{label(s, l)}</option>)}</AutoSelect>
              </form>
              {can.assign(u) ? (
                <form action={updateInquiry} className="f">
                  <input type="hidden" name="id" value={q.id} />
                  <label htmlFor="owner_id">{tr('Owner', '负责人')}</label>
                  <AutoSelect id="owner_id" name="owner_id" defaultValue={q.owner_id || ''}><option value="">{tr('Unassigned', '未分配')}</option>{salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</AutoSelect>
                </form>
              ) : (
                <div className="f"><span className="lbl">{tr('Owner', '负责人')}</span>{q.owner || tr('Unassigned', '未分配')}{!q.owner_id && <form action={updateInquiry} style={{ display: 'inline', marginLeft: 8 }}><input type="hidden" name="id" value={q.id} /><input type="hidden" name="claim" value="1" /><button className="btn btn-sm">{tr('Take it', '我来跟进')}</button></form>}</div>
              )}
              <div className="f">
                <span className="lbl">{tr('First reply', '首次回复')}</span>
                {q.first_response_at ? <span>{fmtDateTime(q.first_response_at, l)} <span className="muted">({respH! < 1 ? tr('under 1 h', '不到 1 小时') : `${respH!.toFixed(1)} h`})</span></span> : (
                  <form action={markResponded} className="inline-form"><input type="hidden" name="id" value={q.id} /><button className="btn btn-copper btn-sm">{tr('Mark as replied', '标记为已回复')}</button><span className="muted" style={{ fontSize: '0.82rem' }}>{tr('Use this if you replied by phone or another channel.', '通过电话或其他方式回复时使用。')}</span></form>
                )}
              </div>
            </div>
          </Panel>
          <Panel title={tr('Contact', '联系人')}>
            <dl className="dl">
              <dt>{tr('Name', '姓名')}</dt><dd>{q.name}{q.role ? `, ${q.role}` : ''}</dd>
              <dt>{tr('Email', '邮箱')}</dt><dd><a href={`mailto:${q.email}`}>{q.email}</a></dd>
              <dt>{tr('Phone', '电话')}</dt><dd>{q.phone || '—'}</dd>
              <dt>{tr('Company', '公司')}</dt><dd>{account ? <Link href={`/HunterLin/accounts/${account.id}`}>{account.name}</Link> : q.company}{account && <span className="muted"> ({tr('existing customer', '现有客户')})</span>}</dd>
              <dt>{tr('Country', '国家')}</dt><dd>{countryName(q.country)}</dd>
              <dt>{tr('Site language', '网站语言')}</dt><dd>{q.locale === 'zh' ? tr('Chinese', '中文') : tr('English', '英文')}</dd>
              <dt>{tr('Earlier inquiries', '历史询盘')}</dt><dd>{history.c}</dd>
            </dl>
          </Panel>
          <Panel title={tr('How they found us', '来源')}>
            <dl className="dl">
              <dt>{tr('Channel', '渠道')}</dt><dd><strong>{channel(q.source, l)}</strong></dd>
              <dt>{tr('Referrer', '来源网址')}</dt><dd>{q.referrer || '—'}</dd>
              <dt>{tr('First page', '着陆页')}</dt><dd>{q.landing || '—'}</dd>
              <dt>{tr('Campaign', '推广活动')}</dt><dd>{q.utm || '—'}</dd>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

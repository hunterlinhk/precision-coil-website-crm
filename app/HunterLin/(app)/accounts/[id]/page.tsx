import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db, j } from '@/lib/db';
import { requireUser, can, type User } from '@/lib/auth';
import { money, countryName, STAGES, STAGE_PROB, SAMPLE_STATUS, salesUsers } from '@/lib/admin';
import { translator, label, channel, fmtAgo, fmtDate, type AL } from '@/lib/admin-lang';
import { inquiryRef } from '@/lib/crm';
import { site } from '@/lib/site';
import { Topbar, Panel, Pill, Kpi } from '@/components/admin/ui';
import { Timeline } from '@/components/admin/Timeline';
import { AccountForm } from '@/components/admin/AccountForm';
import { AutoSelect, ConfirmButton } from '@/components/admin/client';
import { Composer, MailNotice, Thread } from '@/components/admin/Email';
import { addActivity, addContact, deleteContact, saveOpportunity, toggleTask, createQuote, createSample, updateSample } from '@/app/HunterLin/actions';

// One deal: stage and value, its quotes and its samples, all edited in place.
function Deal({ o, quotes, samples, models, u, l, back }: { o: any; quotes: any[]; samples: any[]; models: string[]; u: User; l: AL; back: string }) {
  const tr = (en: string, zh: string) => (l === 'zh' ? zh : en);
  const closed = ['won', 'lost'].includes(o.stage);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <article className={`deal ${closed ? 'closed' : ''}`} id={`deal-${o.id}`}>
      <details open={!closed}>
        <summary>
          <span className="deal-title">{o.title}</span>
          <Pill v={o.stage} label={label(o.stage, l)} />
          <span className="deal-val">{money(o.value)}<span className="muted"> / {tr('yr', '年')}</span></span>
          {o.expected_close && <span className={`muted ${!closed && o.expected_close < today ? 'late' : ''}`}>{fmtDate(o.expected_close, l)}</span>}
        </summary>
        <form action={saveOpportunity} className="form deal-form">
          <input type="hidden" name="id" value={o.id} /><input type="hidden" name="back" value={`${back}?saved=1#deal-${o.id}`} />
          <div className="fgrid g4f">
            <div className="f full"><label htmlFor={`t${o.id}`}>{tr('Deal name', '商机名称')}</label><input id={`t${o.id}`} name="title" defaultValue={o.title} /></div>
            <div className="f"><label htmlFor={`s${o.id}`}>{tr('Stage', '阶段')}</label><select id={`s${o.id}`} name="stage" defaultValue={o.stage}>{STAGES.map((s) => <option key={s} value={s}>{label(s, l)} ({Math.round(STAGE_PROB[s] * 100)}%)</option>)}</select></div>
            <div className="f"><label htmlFor={`v${o.id}`}>{tr('Annual value (USD)', '年销售额（美元）')}</label><input id={`v${o.id}`} name="value" defaultValue={o.value} inputMode="decimal" /></div>
            <div className="f"><label htmlFor={`c${o.id}`}>{tr('Expected decision', '预计成交')}</label><input id={`c${o.id}`} name="expected_close" type="date" defaultValue={o.expected_close || ''} /></div>
            {can.assign(u) && <div className="f"><label htmlFor={`o${o.id}`}>{tr('Owner', '负责人')}</label><select id={`o${o.id}`} name="owner_id" defaultValue={o.owner_id || ''}>{salesUsers().map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>}
            {o.stage === 'lost' && <div className="f full"><label htmlFor={`r${o.id}`}>{tr('Why it was lost', '丢单原因')}</label><input id={`r${o.id}`} name="lost_reason" defaultValue={o.lost_reason || ''} placeholder={tr('Price, lead time, spec, went with incumbent…', '价格、交期、规格、客户选择了原供应商……')} /></div>}
          </div>
          <div className="inline-form"><button className="btn btn-sm btn-primary">{tr('Save deal', '保存商机')}</button>{j<string[]>(o.products, []).length > 0 && <span className="muted" style={{ fontSize: '0.82rem' }}>{tr('Parts', '型号')}: {j<string[]>(o.products, []).join(', ')}</span>}</div>
        </form>
        <div className="deal-cols">
          <div>
            <h4>{tr('Quotes', '报价单')}</h4>
            {quotes.length === 0 ? <p className="muted">{tr('No quotes yet.', '还没有报价。')}</p> : (
              <table className="t compact"><tbody>{quotes.map((q) => <tr key={q.id}><td><Link className="row-link" href={`/HunterLin/quotes/${q.id}`}>{q.number}</Link><span className="sub">{tr('valid until', '有效期至')} {fmtDate(q.valid_until, l)}</span></td><td><Pill v={q.status} label={label(q.status, l)} /></td><td className="r">{money(q.total, q.currency)}</td></tr>)}</tbody></table>
            )}
            <form action={createQuote}><input type="hidden" name="opportunity_id" value={o.id} /><button className="btn btn-sm">{tr('New quote', '新建报价')}</button></form>
          </div>
          <div>
            <h4>{tr('Samples', '样品')}</h4>
            {samples.length > 0 && (
              <table className="t compact"><tbody>{samples.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.model}</strong><span className="sub">{s.qty} {tr('pcs', '只')} · {fmtDate(s.requested_at, l)}{s.tracking ? ` · ${s.courier || ''} ${s.tracking}` : ''}</span></td>
                  <td className="r"><form action={updateSample}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="back" value={`${back}#deal-${o.id}`} />
                    <AutoSelect name="status" defaultValue={s.status} aria-label={tr(`Status of ${s.model} sample`, `${s.model} 样品状态`)} className="btn btn-sm">{SAMPLE_STATUS.map((x) => <option key={x} value={x}>{label(x, l)}</option>)}</AutoSelect>
                  </form></td>
                </tr>
              ))}</tbody></table>
            )}
            <form action={createSample} className="inline-form">
              <input type="hidden" name="opportunity_id" value={o.id} />
              <select name="model" aria-label={tr('Model', '型号')} defaultValue={j<string[]>(o.products, [])[0] || ''}>{models.map((m) => <option key={m}>{m}</option>)}</select>
              <input name="qty" defaultValue="20" aria-label={tr('Quantity', '数量')} style={{ width: 64 }} />
              <button className="btn btn-sm">{tr('Log sample', '登记样品')}</button>
            </form>
          </div>
        </div>
      </details>
    </article>
  );
}

export default async function Account({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; edit?: string; converted?: string; sent?: string; mailerror?: string }> }) {
  const u = await requireUser(can.crm);
  const { l, tr } = await translator();
  const { id } = await params;
  const sp = await searchParams;
  const a = db().prepare('SELECT a.*, us.name AS owner FROM accounts a LEFT JOIN users us ON us.id = a.owner_id WHERE a.id = ?').get(+id) as any;
  if (!a) notFound();
  if (!can.seeAll(u) && a.owner_id !== u.id) redirect('/HunterLin?denied=1');
  const contacts = db().prepare('SELECT * FROM contacts WHERE account_id = ? ORDER BY id').all(a.id) as any[];
  const opps = db().prepare(`SELECT * FROM opportunities WHERE account_id = ? ORDER BY stage IN ('won','lost'), updated_at DESC`).all(a.id) as any[];
  const quotes = db().prepare('SELECT * FROM quotes WHERE account_id = ? ORDER BY created_at DESC').all(a.id) as any[];
  const samples = db().prepare('SELECT * FROM samples WHERE account_id = ? ORDER BY requested_at DESC').all(a.id) as any[];
  const inqs = db().prepare('SELECT * FROM inquiries WHERE account_id = ? ORDER BY created_at DESC').all(a.id) as any[];
  const acts = db().prepare('SELECT ac.*, us.name AS who FROM activities ac LEFT JOIN users us ON us.id = ac.user_id WHERE ac.account_id = ? ORDER BY ac.created_at DESC LIMIT 60').all(a.id) as any[];
  const tasks = db().prepare('SELECT * FROM tasks WHERE account_id = ? AND done = 0 ORDER BY due_at').all(a.id) as any[];
  const emails = db().prepare('SELECT * FROM emails WHERE account_id = ? ORDER BY created_at DESC LIMIT 30').all(a.id) as any[];
  const models = (db().prepare('SELECT model FROM products ORDER BY model').all() as any[]).map((r) => r.model);
  const back = `/HunterLin/accounts/${a.id}`;
  const won = opps.filter((o) => o.stage === 'won').reduce((s, o) => s + o.value, 0);
  const open = opps.filter((o) => !['won', 'lost'].includes(o.stage));
  const primary = contacts.find((c) => c.email);
  const lastIn = emails.find((e) => e.direction === 'in');

  return (
    <>
      <Topbar crumbs={[[tr('Customers', '客户'), '/HunterLin/accounts'], [a.name]]} title={<>{a.name} <Pill v={a.stage} label={label(a.stage, l)} /></>}
        sub={[a.industry, countryName(a.country), a.owner ? `${tr('Owner', '负责人')}: ${a.owner}` : tr('No owner', '未分配负责人')].filter(Boolean).join(' · ')}>
        <Link href={sp.edit ? back : `${back}?edit=1`} className="btn">{sp.edit ? tr('Close editor', '关闭编辑') : tr('Edit details', '编辑资料')}</Link>
      </Topbar>
      {sp.converted && <p className="notice">{tr('Inquiry turned into a deal. Customer and contact are set up; add a value and a quote when you have them.', '询盘已转为商机，客户和联系人已创建。确定金额后可补充并新建报价。')}</p>}
      {sp.saved && <p className="notice">{tr('Saved.', '已保存。')}</p>}
      <MailNotice sp={sp} l={l} />
      {sp.edit && <div style={{ marginBottom: 16 }}><Panel title={tr('Customer details', '客户资料')}><AccountForm a={a} canAssign={can.assign(u)} l={l} /></Panel></div>}
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <Kpi label={tr('Won business', '已赢单金额')} value={money(won)} />
        <Kpi label={tr('Open deals', '进行中商机')} value={open.length} delta={open.length ? money(open.reduce((s, o) => s + o.value, 0)) : undefined} />
        <Kpi label={tr('Website inquiries', '网站询盘')} value={inqs.length} />
        <Kpi label={tr('Annual volume', '年用量')} value={<span style={{ fontSize: '1.3rem' }}>{a.annual_volume || '—'}</span>} />
      </div>
      <nav className="anchor-nav" aria-label={tr('On this page', '本页内容')}>
        <a href="#deals">{tr('Deals', '商机')} ({opps.length})</a><a href="#email">{tr('Email', '邮件')} ({emails.length})</a><a href="#history">{tr('History', '记录')}</a>
      </nav>
      <div className="grid g-main">
        <div className="stack">
          <section className="panel" id="deals">
            <div className="panel-head"><h2>{tr('Deals', '商机')}</h2><span className="muted">{tr('Quotes and samples sit under each deal.', '报价和样品都在对应商机下面。')}</span></div>
            <div className="panel-body">
              {opps.length === 0 && <p className="muted">{tr('No deals yet.', '还没有商机。')}</p>}
              {opps.map((o) => <Deal key={o.id} o={o} u={u} l={l} back={back} models={models} quotes={quotes.filter((q) => q.opportunity_id === o.id)} samples={samples.filter((s) => s.opportunity_id === o.id)} />)}
              <form action={saveOpportunity} className="inline-form" style={{ marginTop: 12 }}>
                <input type="hidden" name="account_id" value={a.id} />
                <input name="title" required placeholder={tr('New deal, e.g. “OIS coil for 2027 phone”', '新商机，例如“2027 机型 OIS 线圈”')} aria-label={tr('New deal name', '新商机名称')} style={{ flex: 1, minWidth: 200 }} />
                <input name="value" placeholder={tr('Value (USD)', '金额（美元）')} aria-label={tr('Value', '金额')} inputMode="decimal" style={{ width: 130 }} />
                <button className="btn btn-sm">{tr('Add deal', '添加商机')}</button>
              </form>
            </div>
          </section>

          <section className="panel" id="email">
            <div className="panel-head"><h2>{tr('Email', '邮件')}</h2><Link href={`/HunterLin/inbox/compose?account_id=${a.id}${primary ? `&to=${encodeURIComponent(primary.email)}` : ''}`} className="muted">{tr('Open full editor', '在新页面写邮件')}</Link></div>
            <div className="panel-body">
              {emails.length > 0 && <div style={{ marginBottom: 16 }}><Thread emails={[...emails].reverse()} l={l} openLast={false} /></div>}
              <Composer u={u} l={l} back={`${back}#email`} to={lastIn?.from_addr || primary?.email} subject={lastIn ? (lastIn.subject.match(/^re:/i) ? lastIn.subject : `Re: ${lastIn.subject}`) : `${site.brand} — `}
                inReplyTo={lastIn?.message_id} references={lastIn ? [lastIn.refs, lastIn.message_id].filter(Boolean).join(' ') : null}
                link={{ account_id: a.id, contact_id: primary?.id }} contacts={contacts.filter((c) => c.email).map((c) => ({ name: c.name, email: c.email }))} />
            </div>
          </section>

          <section className="panel" id="history">
            <div className="panel-head"><h2>{tr('Notes and history', '备注与记录')}</h2></div>
            <div className="panel-body">
              <form action={addActivity} className="form" style={{ marginBottom: 8 }}>
                <input type="hidden" name="account_id" value={a.id} /><input type="hidden" name="back" value={`${back}#history`} />
                <div className="fgrid">
                  <div className="f full"><label htmlFor="body">{tr('Log a call, meeting or note', '记录电话、会议或备注')}</label><textarea id="body" name="body" /></div>
                  <div className="f"><label htmlFor="kind">{tr('Type', '类型')}</label><select id="kind" name="kind">{['call', 'meeting', 'note', 'email'].map((k) => <option key={k} value={k}>{label(k, l)}</option>)}</select></div>
                  <div className="f"><label htmlFor="follow_up">{tr('Remind me on', '提醒日期')}</label><input id="follow_up" name="follow_up" type="date" /></div>
                </div>
                <div><button className="btn">{tr('Save', '保存')}</button></div>
              </form>
              <Timeline items={acts} l={l} />
            </div>
          </section>
        </div>
        <div className="stack">
          <Panel title={tr('Follow-ups', '待办')} flush>
            {tasks.length === 0 ? <p className="empty">{tr('No open follow-ups.', '没有未完成的待办。')}</p> : <ul className="tasks">{tasks.map((t) => (
              <li key={t.id}>
                <form action={toggleTask}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="back" value={back} /><button className="btn btn-sm" aria-label={tr('Mark done', '标记完成')}>✓</button></form>
                <div><div style={{ fontWeight: 560 }}>{t.title}</div><div className="muted" style={{ fontSize: '0.82rem' }}>{fmtDate(t.due_at, l)}</div></div>
              </li>))}</ul>}
          </Panel>
          <Panel title={tr('Contacts', '联系人')} flush>
            <ul>
              {contacts.map((c) => (
                <li key={c.id} className="contact">
                  <div><strong>{c.name}</strong><div className="muted" style={{ fontSize: '0.85rem' }}>{c.title}</div><div style={{ fontSize: '0.88rem' }}>{c.email && <Link href={`/HunterLin/inbox/compose?account_id=${a.id}&to=${encodeURIComponent(c.email)}`}>{c.email}</Link>}{c.phone && <span> {c.phone}</span>}{c.messenger && <span className="muted"> {c.messenger}</span>}</div></div>
                  <form action={deleteContact}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="account_id" value={a.id} /><ConfirmButton className="btn btn-ghost btn-sm" message={tr(`Remove ${c.name}?`, `确定删除 ${c.name}？`)}>{tr('Remove', '删除')}</ConfirmButton></form>
                </li>
              ))}
            </ul>
            <details className="add-contact">
              <summary>{tr('Add contact', '添加联系人')}</summary>
              <form action={addContact} className="form">
                <input type="hidden" name="account_id" value={a.id} />
                <div className="fgrid">
                  <div className="f"><label htmlFor="c-name">{tr('Name', '姓名')}</label><input id="c-name" name="name" required /></div>
                  <div className="f"><label htmlFor="c-title">{tr('Title', '职位')}</label><input id="c-title" name="title" /></div>
                  <div className="f"><label htmlFor="c-email">{tr('Email', '邮箱')}</label><input id="c-email" name="email" type="email" /></div>
                  <div className="f"><label htmlFor="c-phone">{tr('Phone', '电话')}</label><input id="c-phone" name="phone" /></div>
                  <div className="f full"><label htmlFor="c-m">{tr('WeChat / WhatsApp', '微信 / WhatsApp')}</label><input id="c-m" name="messenger" /></div>
                </div>
                <div><button className="btn btn-sm">{tr('Add contact', '添加联系人')}</button></div>
              </form>
            </details>
          </Panel>
          <Panel title={tr('Website inquiries', '网站询盘')} flush>
            {inqs.length === 0 ? <p className="empty">{tr('None linked.', '没有关联的询盘。')}</p> : <table className="t"><tbody>{inqs.map((i) => <tr key={i.id}><td><Link className="row-link" href={`/HunterLin/inquiries/${i.id}`}>{inquiryRef(i.id)}</Link><span className="sub">{label(i.type, l)} · {channel(i.source, l)}</span></td><td><Pill v={i.status} label={label(i.status, l)} /></td><td className="r muted">{fmtAgo(i.created_at, l)}</td></tr>)}</tbody></table>}
          </Panel>
          {a.notes && <Panel title={tr('Requirements and notes', '需求与备注')}><p style={{ whiteSpace: 'pre-wrap' }}>{a.notes}</p></Panel>}
        </div>
      </div>
    </>
  );
}

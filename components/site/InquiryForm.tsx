'use client';
import { useEffect, useRef, useState } from 'react';
import { withBase, STATIC_PREVIEW } from '@/lib/base';
import Link from 'next/link';
import { useRfq } from './client';
import type { Dict } from '@/lib/i18n';

function Field({ name, label, children, full, required, invalid, reqLabel }: { name: string; label: string; children: React.ReactNode; full?: boolean; required?: boolean; invalid?: boolean; reqLabel: string }) {
  return (
    <div key={name} className={`field ${full ? 'full' : ''}`} data-invalid={invalid || undefined}>
      <label htmlFor={`i-${name}`}>{label}{required && <span className="req" aria-label={reqLabel}>*</span>}</label>
      {children}
    </div>
  );
}

const COUNTRIES = ['US', 'CN', 'TW', 'HK', 'JP', 'KR', 'VN', 'DE', 'GB', 'FR', 'IT', 'ES', 'NL', 'SE', 'DK', 'FI', 'NO', 'CH', 'AT', 'PL', 'CZ', 'IE', 'BE', 'PT', 'IL', 'TR', 'IN', 'SG', 'MY', 'TH', 'ID', 'PH', 'AU', 'NZ', 'CA', 'MX', 'BR', 'AR', 'CL', 'AE', 'SA', 'ZA', 'EG', 'HU', 'RO'];
const MAX = 20 * 1024 * 1024;

type Types = 'quote' | 'sample' | 'drawing' | 'general';

export function InquiryForm({ locale, d, initialType, model, topic }: { locale: string; d: Dict['contact']; initialType: Types; model?: string; topic?: string }) {
  const { items, setQty, remove, clear } = useRfq();
  const [type, setType] = useState<Types>(initialType);
  const [files, setFiles] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'error' | 'done'>('idle');
  const [ref, setRef] = useState('');
  const [invalid, setInvalid] = useState<string[]>([]);
  const [filled, setFilled] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const zh = locale === 'zh';

  // Country names come from the browser's Intl data after mount, so server and client markup match.
  const [countries, setCountries] = useState<string[][]>(() => COUNTRIES.map((c) => [c, c]));
  useEffect(() => {
    try {
      const names = new Intl.DisplayNames([zh ? 'zh-CN' : 'en'], { type: 'region' });
      setCountries(COUNTRIES.map((c) => [c, names.of(c) || c]).sort((a, b) => a[1].localeCompare(b[1], zh ? 'zh-CN' : 'en')));
    } catch { /* keep codes */ }
  }, [zh]);

  // The static preview has no server to read ?type= / ?model=, so pick them up in the browser.
  const [urlModel, setUrlModel] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!STATIC_PREVIEW) return;
    const q = new URL(location.href).searchParams;
    const tp = q.get('type') as Types | null;
    if (tp && tp in d.types) setType(tp);
    if (q.get('model')) setUrlModel(q.get('model')!);
  }, [d.types]);
  if (urlModel && !model) model = urlModel;

  const defaultMsg = model ? (zh ? `关于 ${model}：` : `Regarding ${model}: `) : topic === 'audit' ? (zh ? '我们正在进行供应商评估，请提供证书与审核资料。' : 'We are qualifying suppliers and would like your certificates and audit documents.') : '';

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) if (f.size <= MAX && !next.some((x) => x.name === f.name)) next.push(f);
    setFiles(next.slice(0, 8));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const missing = ['name', 'email', 'company', 'country', 'message'].filter((k) => !String(fd.get(k) || '').trim());
    if (String(fd.get('email') || '') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(fd.get('email')))) missing.push('email');
    setInvalid(missing);
    if (missing.length) { setState('error'); form.querySelector<HTMLElement>(`[name="${missing[0]}"]`)?.focus(); return; }
    fd.set('type', type);
    fd.set('locale', locale);
    fd.set('items', JSON.stringify(items.map((i) => ({ model: i.model, qty: i.qty }))));
    files.forEach((f) => fd.append('files', f));
    try { fd.set('src', localStorage.getItem('aw_src') || ''); } catch { /* ignore */ }
    setState('sending');
    if (STATIC_PREVIEW) {
      // Static preview build: there is no server to receive the inquiry, so show the confirmation only.
      await new Promise((r) => setTimeout(r, 700));
      setRef(`PREVIEW-${String(Date.now()).slice(-5)}`); setState('done'); clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    try {
      const res = await fetch('/api/inquiry', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) { setInvalid(json.fields || []); setState('error'); return; }
      setRef(json.ref); setState('done'); clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch { setState('error'); }
  }

  if (state === 'done') {
    return (
      <div className="form-done" role="status">
        <span className="burst" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ ['--a' as any]: `${(i / 14) * 360}deg`, ['--d' as any]: `${70 + (i % 3) * 26}px` }} />)}</span>
        <h2>{d.done}</h2>
        <p>{d.doneLead} <span className="ref">{ref}</span></p>
        <p>{d.doneNext}</p>
        <Link href={`/${locale}/products`} className="btn btn-light" style={{ marginTop: 28 }}>{zh ? '继续浏览产品' : 'Keep browsing products'}</Link>
      </div>
    );
  }

  // How many of the five required answers are in: drives the winding progress beside the submit button.
  function measure(form: HTMLFormElement) {
    const fd = new FormData(form);
    const ok = ['name', 'company', 'country', 'message'].filter((k) => String(fd.get(k) || '').trim().length > (k === 'message' ? 12 : 0)).length
      + (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(fd.get('email') || '')) ? 1 : 0);
    setFilled(ok);
  }

  const F = (props: { name: string; label: string; children: React.ReactNode; full?: boolean; required?: boolean }) => Field({ ...props, invalid: invalid.includes(props.name), reqLabel: d.required });

  return (
    <form className="form" onSubmit={submit} noValidate onInput={(e) => measure(e.currentTarget)} onChange={(e) => measure(e.currentTarget)}>
      {state === 'error' && <p className="form-error" role="alert">{d.error}</p>}
      <fieldset>
        <legend>{d.type}</legend>
        <div className="type-pick">
          {(Object.keys(d.types) as Types[]).map((k) => (
            <label key={k}><input type="radio" name="type-pick" value={k} checked={type === k} onChange={() => setType(k)} /><span>{d.types[k]}</span></label>
          ))}
        </div>
      </fieldset>

      {(type === 'quote' || type === 'sample') && (
        <fieldset>
          <legend>{d.list}</legend>
          {items.length === 0 ? <p className="rfq-empty">{d.listEmpty} <Link href={`/${locale}/products`} className="link">{zh ? '产品目录' : 'Catalogue'}</Link></p> : (
            <ul className="rfq-lines">
              {items.map((i) => (
                <li key={i.model} className="rfq-line">
                  <span className="thumb"><img src={withBase(`/renders/${i.slug}-sm.webp`)} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} /></span>
                  <div><strong>{i.model}</strong><span>{zh ? i.name_zh : i.name_en}</span></div>
                  <input aria-label={`${i.model} ${d.qty}`} placeholder={type === 'sample' ? (zh ? '样品数量' : 'Sample qty') : d.qty} value={i.qty} onChange={(e) => setQty(i.model, e.target.value)} inputMode="numeric" />
                  <button type="button" onClick={() => remove(i.model)}>{d.remove}</button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}

      <div className="fields">
        {F({ name: "name", label: d.name, required: true, children: (<><input id="i-name" name="name" autoComplete="name" /></>) })}
        {F({ name: "email", label: d.email, required: true, children: (<><input id="i-email" name="email" type="email" autoComplete="email" /></>) })}
        {F({ name: "company", label: d.company, required: true, children: (<><input id="i-company" name="company" autoComplete="organization" /></>) })}
        {F({ name: "country", label: d.country, required: true, children: (<>
          <select id="i-country" name="country" defaultValue="">
            <option value="" disabled>—</option>
            {countries.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            <option value="OTHER">{zh ? '其他' : 'Other'}</option>
          </select>
        </>) })}
        {F({ name: "role", label: d.role, children: (<>
          <select id="i-role" name="role" defaultValue="">
            <option value="">—</option>
            {d.roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </>) })}
        {F({ name: "phone", label: d.phone, children: (<><input id="i-phone" name="phone" autoComplete="tel" /></>) })}
        {F({ name: "message", label: d.message, full: true, required: true, children: (<><textarea key={defaultMsg} id="i-message" name="message" placeholder={d.messagePh} defaultValue={defaultMsg} /></>) })}
        {type !== 'general' && (
          <>
            {F({ name: "annual_volume", label: d.volume, children: (<>
              <select id="i-annual_volume" name="annual_volume" defaultValue="">
                <option value="">—</option>
                {['< 100k', '100k – 1M', '1M – 10M', '> 10M'].map((v) => <option key={v}>{v}</option>)}
              </select>
            </>) })}
            {F({ name: "target_date", label: d.target, children: (<><input id="i-target_date" name="target_date" placeholder={zh ? '例如 2027 年第一季度' : 'e.g. Q1 2027'} /></>) })}
          </>
        )}
      </div>

      <fieldset>
        <legend>{d.files}</legend>
        <div
          className="drop" data-over={over || undefined} role="button" tabIndex={0}
          onClick={() => fileInput.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
        >
          <strong>{zh ? '拖放文件到此处，或点击选择' : 'Drop files here or click to choose'}</strong>
          <span className="hint">{d.filesHint}</span>
          <input ref={fileInput} type="file" multiple hidden accept=".pdf,.step,.stp,.dwg,.dxf,.igs,.iges,.png,.jpg,.jpeg,.zip,.xlsx,.docx" onChange={(e) => addFiles(e.target.files)} />
        </div>
        {files.length > 0 && (
          <ul className="file-list">
            {files.map((f) => <li key={f.name}><span>{f.name} ({Math.max(1, Math.round(f.size / 1024))} KB)</span><button type="button" onClick={() => setFiles(files.filter((x) => x !== f))}>{d.remove}</button></li>)}
          </ul>
        )}
        <label className="check" style={{ marginTop: 16 }}><input type="checkbox" name="nda" value="1" defaultChecked={type === 'drawing'} /><span>{d.nda}</span></label>
      </fieldset>

      {/* Spam trap: humans never see or fill this. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}><input name="website" tabIndex={-1} autoComplete="off" /></div>

      <div className="form-submit">
        <WindProgress n={filled} total={5} label={filled >= 5 ? (zh ? '可以提交了' : 'Ready to send') : (zh ? `必填项 ${filled} / 5` : `${filled} of 5 required answers`)} />
        <button type="submit" className={`btn ${filled >= 5 ? 'btn-copper' : 'btn-solid'} btn-arrow`} disabled={state === 'sending'}>
          {state === 'sending' ? d.sending : d.submit}
          <svg className="arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
      </div>
    </form>
  );
}

// Five turns of wire, one per required answer. Filled turns are copper.
function WindProgress({ n, total, label }: { n: number; total: number; label: string }) {
  return (
    <div className="wind" data-done={n >= total || undefined}>
      <svg viewBox={`0 0 ${total * 14 + 18} 44`} aria-hidden="true">
        <path d={`M2 34 C 8 34, 8 22, 14 22`} className="wind-lead" />
        {Array.from({ length: total }, (_, i) => (
          <ellipse key={i} cx={20 + i * 14} cy={22} rx={7} ry={18} className={i < n ? 'on' : ''} style={{ ['--i' as any]: i }} />
        ))}
      </svg>
      <span aria-live="polite">{label}</span>
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
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
        <h2>{d.done}</h2>
        <p>{d.doneLead} <span className="ref">{ref}</span></p>
        <p>{d.doneNext}</p>
        <Link href={`/${locale}/products`} className="btn btn-light" style={{ marginTop: 28 }}>{zh ? '继续浏览产品' : 'Keep browsing products'}</Link>
      </div>
    );
  }

  const F = (props: { name: string; label: string; children: React.ReactNode; full?: boolean; required?: boolean }) => Field({ ...props, invalid: invalid.includes(props.name), reqLabel: d.required });

  return (
    <form className="form" onSubmit={submit} noValidate>
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
                  <span className="thumb"><img src={`/renders/${i.slug}-sm.webp`} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} /></span>
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
        {F({ name: "message", label: d.message, full: true, required: true, children: (<><textarea id="i-message" name="message" placeholder={d.messagePh} defaultValue={defaultMsg} /></>) })}
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

      <div><button type="submit" className="btn btn-solid" disabled={state === 'sending'}>{state === 'sending' ? d.sending : d.submit}</button></div>
    </form>
  );
}

'use client';
import { useMemo, useRef, useState } from 'react';
import { Markdown } from '@/lib/markdown';

type L = 'en' | 'zh';
type Art = Record<string, any>;
type Opt = { value: string; label: string };
type Act = (fd: FormData) => void;

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const chars = (s: string) => s.replace(/\s/g, '').length;

export function ArticleForm({ a, ui, products, apps, siteHost, actions }: {
  a: Art; ui: L; products: Opt[]; apps: Opt[]; siteHost: string;
  actions: { save: Act; publish: Act; unpublish: Act; remove?: Act };
}) {
  const tr = (en: string, zh: string) => (ui === 'zh' ? zh : en);
  const isNew = !a.id;
  const [lang, setLang] = useState<L>(ui);
  const [v, setV] = useState<Record<string, string>>(() => {
    const keys = ['title', 'excerpt', 'takeaways', 'body', 'seo_title', 'seo_desc'];
    const o: Record<string, string> = { slug: a.slug || '', type: a.type || 'tech', author: a.author || '', published_date: (a.published_at || '').slice(0, 10) };
    keys.forEach((k) => (['en', 'zh'] as const).forEach((l) => { o[`${k}_${l}`] = a[`${k}_${l}`] || ''; }));
    return o;
  });
  const [slugTouched, setSlugTouched] = useState(!!a.slug);
  const [faq, setFaq] = useState<string[][]>(() => (Array.isArray(a.faq) ? a.faq : []).map((r: string[]) => [0, 1, 2, 3].map((i) => r[i] || '')));
  const [linked, setLinked] = useState<string[]>(a.products || []);
  const [linkedApps, setLinkedApps] = useState<string[]>(a.applications || []);
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [cover, setCover] = useState<string | null>(a.cover ? `/api/media/${a.cover}` : null);
  const [removeCover, setRemoveCover] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const set = (k: string, val: string) => setV((cur) => {
    const n = { ...cur, [k]: val };
    if (k === 'title_en' && !slugTouched) n.slug = slugify(val);
    return n;
  });
  const f = (k: string) => v[`${k}_${lang}`] || '';

  // Markdown toolbar: wrap the selection or insert at the start of the line.
  const fmt = (kind: 'h2' | 'h3' | 'b' | 'i' | 'ul' | 'ol' | 'link') => {
    const ta = bodyRef.current; if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e);
    let out = value, cs = s, ce = e;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const prefix = (p: string) => { const lines = (sel || (ui === 'zh' ? '列表项' : 'List item')).split('\n').map((x, i) => `${p === '1. ' ? `${i + 1}. ` : p}${x}`).join('\n'); out = value.slice(0, s) + lines + value.slice(e); cs = s; ce = s + lines.length; };
    if (kind === 'h2' || kind === 'h3') { const p = kind === 'h2' ? '## ' : '### '; const text = sel || (ui === 'zh' ? '小标题' : 'Heading'); out = value.slice(0, lineStart) + (lineStart === s ? '' : value.slice(lineStart, s)) + `${s > 0 && value[s - 1] !== '\n' ? '\n\n' : ''}${p}${text}\n\n` + value.slice(e); cs = s + p.length + (s > 0 && value[s - 1] !== '\n' ? 2 : 0); ce = cs + text.length; }
    else if (kind === 'b' || kind === 'i') { const m = kind === 'b' ? '**' : '*'; const text = sel || (ui === 'zh' ? '文字' : 'text'); out = value.slice(0, s) + m + text + m + value.slice(e); cs = s + m.length; ce = cs + text.length; }
    else if (kind === 'ul') prefix('- ');
    else if (kind === 'ol') prefix('1. ');
    else { const text = sel || (ui === 'zh' ? '链接文字' : 'link text'); const ins = `[${text}](https://)`; out = value.slice(0, s) + ins + value.slice(e); cs = s + text.length + 3; ce = cs + 8; }
    set(`body_${lang}`, out);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(cs, ce); });
  };

  // Checklist for search engines and AI assistants (generative engine optimisation).
  const checks = useMemo(() => {
    const L = lang;
    const body = v[`body_${L}`] || '';
    const len = L === 'en' ? words(body) : chars(body);
    const title = v[`seo_title_${L}`] || v[`title_${L}`] || '';
    const desc = v[`seo_desc_${L}`] || v[`excerpt_${L}`] || '';
    const tMax = L === 'en' ? 60 : 32, dMax = L === 'en' ? 158 : 80;
    const h2 = (body.match(/^## /gm) || []).length;
    const faqN = faq.filter((r) => (L === 'en' ? r[0] && r[1] : r[2] && r[3])).length;
    const numbers = /\d/.test(body);
    return [
      { ok: !!v[`title_${L}`], t: tr('Has a title', '已填写标题') },
      { ok: title.length > 0 && title.length <= tMax, t: tr(`Search title is ${tMax} characters or less (${title.length})`, `搜索标题不超过 ${tMax} 字（当前 ${title.length}）`) },
      { ok: desc.length >= (L === 'en' ? 70 : 30) && desc.length <= dMax, t: tr(`Summary is ${L === 'en' ? '70' : '30'}–${dMax} characters (${desc.length})`, `摘要 ${L === 'en' ? '70' : '30'}–${dMax} 字（当前 ${desc.length}）`) },
      { ok: (v[`takeaways_${L}`] || '').length >= 40, t: tr('Short answer filled in (what AI assistants quote)', '已填写“简要回答”（AI 助手最常引用）') },
      { ok: h2 >= 2, t: tr(`Body has section headings (${h2})`, `正文有小标题（${h2} 个）`) },
      { ok: L === 'en' ? len >= 300 : len >= 600, t: tr(`Body is long enough to be useful (${len} ${L === 'en' ? 'words' : 'characters'})`, `正文篇幅足够（${len} ${L === 'en' ? '词' : '字'}）`) },
      { ok: numbers, t: tr('Uses concrete figures (sizes, tolerances, frequencies)', '包含具体数据（尺寸、公差、频率等）') },
      { ok: faqN >= 2, t: tr(`At least 2 FAQ entries (${faqN})`, `至少 2 条常见问题（${faqN} 条）`) },
      { ok: linked.length + linkedApps.length > 0, t: tr('Linked to a product or application', '已关联产品或应用') },
      { ok: !!v.author, t: tr('Author shown', '已署名作者') },
    ];
  }, [v, faq, linked, linkedApps, lang, ui]);
  const score = checks.filter((c) => c.ok).length;
  const done = (l: L) => !!(v[`title_${l}`] && v[`body_${l}`] && v[`excerpt_${l}`]);
  const body = f('body');
  const readMin = Math.max(1, Math.round(Math.max(words(v.body_en || '') / 220, chars(v.body_zh || '') / 400)));
  const tMax = lang === 'en' ? 60 : 32, dMax = lang === 'en' ? 158 : 80;
  const serpTitle = f('seo_title') || f('title');
  const serpDesc = f('seo_desc') || f('excerpt');

  return (
    <form action={actions.save} className="form">
      {a.id && <input type="hidden" name="id" value={a.id} />}
      <input type="hidden" name="faq" value={JSON.stringify(faq)} />
      {(['en', 'zh'] as const).flatMap((l) => ['title', 'excerpt', 'takeaways', 'body', 'seo_title', 'seo_desc'].map((k) => l === lang ? null : <input key={`${k}_${l}`} type="hidden" name={`${k}_${l}`} value={v[`${k}_${l}`] || ''} />))}
      <div className="grid g-main">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <div className="ltabs" role="tablist" aria-label={tr('Language', '语言')}>
                {(['en', 'zh'] as const).map((l) => (
                  <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)}>
                    {l === 'en' ? 'English' : '中文'} {done(l) ? <span className="ok-mark">✓</span> : <span className="miss">{tr('incomplete', '未完成')}</span>}
                  </button>
                ))}
              </div>
              <span className="muted" style={{ fontSize: '0.82rem' }}>{readMin} {tr('min read', '分钟阅读')}</span>
            </div>
            <div className="panel-body form">
              <div className="f"><label htmlFor="title">{tr('Title', '标题')}</label>
                <input id="title" name={`title_${lang}`} value={f('title')} onChange={(e) => set(`title_${lang}`, e.target.value)} className="big-input" placeholder={lang === 'en' ? 'How to specify a VCM coil' : '如何确定 VCM 线圈规格'} />
                <div className="hint"><span>{tr('Write it as the question or topic a buyer would search for.', '用采购会搜索的问题或主题来写标题。')}</span></div></div>
              <div className="f"><label htmlFor="excerpt">{tr('Summary', '摘要')}</label>
                <textarea id="excerpt" name={`excerpt_${lang}`} value={f('excerpt')} onChange={(e) => set(`excerpt_${lang}`, e.target.value)} style={{ minHeight: 64 }} />
                <div className="hint"><span>{tr('Shown on the article list and in Google results.', '显示在文章列表和谷歌搜索结果中。')}</span><span className={f('excerpt').length > dMax ? 'over' : ''}>{f('excerpt').length} / {dMax}</span></div></div>
              <div className="f"><label htmlFor="takeaways">{tr('Short answer', '简要回答')}</label>
                <textarea id="takeaways" name={`takeaways_${lang}`} value={f('takeaways')} onChange={(e) => set(`takeaways_${lang}`, e.target.value)} style={{ minHeight: 80 }} placeholder={tr('Two or three sentences that answer the question directly, with the key numbers.', '用两三句话直接回答问题，写出关键数据。')} />
                <div className="hint"><span>{tr('Shown in a “Key points” box at the top of the article. ChatGPT, Perplexity and Google’s AI answers quote this kind of text most.', '显示在文章顶部的“要点”框中。ChatGPT、Perplexity 和谷歌 AI 回答最常引用这类内容。')}</span></div></div>

              <div className="f">
                <div className="body-head">
                  <label htmlFor="body">{tr('Article', '正文')}</label>
                  <div className="seg small" role="tablist">
                    <button type="button" role="tab" aria-selected={view === 'write'} onClick={() => setView('write')}>{tr('Write', '编辑')}</button>
                    <button type="button" role="tab" aria-selected={view === 'preview'} onClick={() => setView('preview')}>{tr('Preview', '预览')}</button>
                  </div>
                </div>
                {view === 'write' ? (
                  <>
                    <div className="md-toolbar" role="toolbar" aria-label={tr('Formatting', '格式')}>
                      <button type="button" onClick={() => fmt('h2')} title={tr('Section heading', '小标题')}>H2</button>
                      <button type="button" onClick={() => fmt('h3')} title={tr('Sub-heading', '次级标题')}>H3</button>
                      <button type="button" onClick={() => fmt('b')} title={tr('Bold', '加粗')}><b>B</b></button>
                      <button type="button" onClick={() => fmt('i')} title={tr('Italic', '斜体')}><i>I</i></button>
                      <button type="button" onClick={() => fmt('ul')} title={tr('Bulleted list', '无序列表')}>• {tr('List', '列表')}</button>
                      <button type="button" onClick={() => fmt('ol')} title={tr('Numbered list', '有序列表')}>1. {tr('List', '列表')}</button>
                      <button type="button" onClick={() => fmt('link')} title={tr('Link', '链接')}>🔗 {tr('Link', '链接')}</button>
                    </div>
                    <textarea id="body" ref={bodyRef} name={`body_${lang}`} className="tall md-area" value={body} onChange={(e) => set(`body_${lang}`, e.target.value)} />
                  </>
                ) : (
                  <>
                    <input type="hidden" name={`body_${lang}`} value={body} />
                    <div className="md-preview prose">{body ? <Markdown source={body} /> : <p className="muted">{tr('Nothing written yet.', '还没有内容。')}</p>}</div>
                  </>
                )}
                <div className="hint"><span>{tr('Leave an empty line between paragraphs. Start sections with a heading.', '段落之间空一行；每个部分用小标题开头。')}</span><span>{lang === 'en' ? `${words(body)} words` : `${chars(body)} 字`}</span></div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>{tr('Frequently asked questions', '常见问题')}</h2><span className="muted">{lang === 'en' ? 'English' : '中文'}</span></div>
            <div className="panel-body form">
              <p className="muted" style={{ fontSize: '0.85rem' }}>{tr('Shown at the end of the article and marked up as FAQ for Google. Use the questions customers really ask.', '显示在文章末尾，并以 FAQ 结构化数据提交给谷歌。请填写客户真正会问的问题。')}</p>
              {faq.map((r, i) => (
                <div className="faq-row" key={i}>
                  <input value={r[lang === 'en' ? 0 : 2]} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? x.map((y, k) => (k === (lang === 'en' ? 0 : 2) ? e.target.value : y)) : x)))} placeholder={tr('Question', '问题')} aria-label={`${tr('Question', '问题')} ${i + 1}`} />
                  <textarea value={r[lang === 'en' ? 1 : 3]} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? x.map((y, k) => (k === (lang === 'en' ? 1 : 3) ? e.target.value : y)) : x)))} placeholder={tr('Answer, in one to three sentences', '回答，一到三句话')} aria-label={`${tr('Answer', '回答')} ${i + 1}`} style={{ minHeight: 60 }} />
                  <div className="faq-ctl">
                    {!r[lang === 'en' ? 0 : 2] && r[lang === 'en' ? 2 : 0] && <span className="muted" style={{ fontSize: '0.8rem' }}>{tr('Chinese:', '英文：')} {r[lang === 'en' ? 2 : 0]}</span>}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFaq(faq.filter((_, j) => j !== i))}>{tr('Remove', '删除')}</button>
                  </div>
                </div>
              ))}
              <div><button type="button" className="btn btn-sm" onClick={() => setFaq([...faq, ['', '', '', '']])}>{tr('Add question', '添加问题')}</button></div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>{tr('Google result', '谷歌搜索结果')}</h2><span className="muted">{lang === 'en' ? 'English' : '中文'}</span></div>
            <div className="panel-body form">
              <div className="serp" aria-label={tr('Search result preview', '搜索结果预览')}>
                <div className="u">{siteHost} › {lang} › resources › {v.slug || '…'}</div>
                <div className="t">{serpTitle.length > tMax + 5 ? serpTitle.slice(0, tMax + 2) + '…' : serpTitle || <em>{tr('Title', '标题')}</em>}</div>
                <div className="d">{serpDesc ? (serpDesc.length > dMax + 5 ? serpDesc.slice(0, dMax) + '…' : serpDesc) : <em>{tr('Add a summary.', '请填写摘要。')}</em>}</div>
              </div>
              <details>
                <summary className="muted">{tr('Use a different title or description for search (optional)', '为搜索单独设置标题或描述（可选）')}</summary>
                <div className="form" style={{ marginTop: 10 }}>
                  <div className="f"><label htmlFor="seo_title">{tr('Search title', '搜索标题')}</label><input id="seo_title" name={`seo_title_${lang}`} value={f('seo_title')} onChange={(e) => set(`seo_title_${lang}`, e.target.value)} placeholder={f('title')} />
                    <div className="hint"><span>{tr('Empty = article title.', '留空则使用文章标题。')}</span><span className={f('seo_title').length > tMax ? 'over' : ''}>{f('seo_title').length} / {tMax}</span></div></div>
                  <div className="f"><label htmlFor="seo_desc">{tr('Search description', '搜索描述')}</label><textarea id="seo_desc" name={`seo_desc_${lang}`} value={f('seo_desc')} onChange={(e) => set(`seo_desc_${lang}`, e.target.value)} placeholder={f('excerpt')} style={{ minHeight: 60 }} />
                    <div className="hint"><span>{tr('Empty = summary.', '留空则使用摘要。')}</span><span className={f('seo_desc').length > dMax ? 'over' : ''}>{f('seo_desc').length} / {dMax}</span></div></div>
                </div>
              </details>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-head"><h2>{tr('Search & AI checklist', '搜索与 AI 检查')}</h2><span className={`score ${score >= 8 ? 'good' : score >= 5 ? 'mid' : 'low'}`}>{score}/{checks.length}</span></div>
            <div className="panel-body">
              <ul className="checklist">{checks.map((c) => <li key={c.t} className={c.ok ? 'ok' : ''}>{c.t}</li>)}</ul>
              <p className="muted" style={{ fontSize: '0.78rem', marginTop: 8 }}>{tr(`Checks the ${lang === 'en' ? 'English' : 'Chinese'} version. Structured data (Article, FAQ, breadcrumbs) and the llms.txt summary for AI crawlers are generated automatically.`, `检查的是${lang === 'en' ? '英文' : '中文'}版本。文章、FAQ、面包屑等结构化数据，以及给 AI 爬虫的 llms.txt 摘要都会自动生成。`)}</p>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>{tr('Settings', '设置')}</h2></div>
            <div className="panel-body form">
              <div className="f"><label htmlFor="type">{tr('Type', '类型')}</label>
                <select id="type" name="type" value={v.type} onChange={(e) => set('type', e.target.value)}><option value="tech">{tr('Technical note', '技术文章')}</option><option value="news">{tr('News', '新闻')}</option><option value="case">{tr('Case study', '案例')}</option></select>
                {v.type === 'case' && <div className="hint"><span>{tr('Only publish case studies the customer has approved.', '案例请在客户同意后再发布。')}</span></div>}</div>
              <div className="f"><label htmlFor="slug">{tr('Web address', '网址')}</label>
                <input id="slug" name="slug" value={v.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} placeholder={tr('from the English title', '根据英文标题自动生成')} />
                <div className="hint"><span>/resources/{v.slug || '…'}</span></div></div>
              <div className="f"><label htmlFor="published_date">{tr('Date', '日期')}</label><input id="published_date" type="date" name="published_date" value={v.published_date} onChange={(e) => set('published_date', e.target.value)} />
                <div className="hint"><span>{tr('Empty = the day it is published.', '留空则使用发布当天。')}</span></div></div>
              <div className="f"><label htmlFor="author">{tr('Author', '作者')}</label><input id="author" name="author" value={v.author} onChange={(e) => set('author', e.target.value)} placeholder={tr('e.g. Arcwind engineering team', '例如：Arcwind 工程团队')} /></div>
              <div className="f"><span className="lbl">{tr('Cover photo', '封面图片')}</span>
                {cover && !removeCover && <img src={cover} alt="" className="cover-prev" />}
                <input type="file" name="cover_file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setCover(URL.createObjectURL(file)); setRemoveCover(false); } }} />
                {a.cover && <label className="check"><input type="checkbox" name="cover_remove" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} /> {tr('Remove cover', '删除封面')}</label>}
                <div className="hint"><span>{tr('Optional. Without one, the article uses the 3D render of its first related product.', '可选。不上传时，使用第一个关联产品的 3D 渲染图。')}</span></div></div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>{tr('Related products', '关联产品')}</h2><span className="muted">{linked.length}</span></div>
            <div className="panel-body"><div className="checks col scroll">
              {products.map((p) => <label key={p.value}><input type="checkbox" name="products" value={p.value} checked={linked.includes(p.value)} onChange={(e) => setLinked(e.target.checked ? [...linked, p.value] : linked.filter((x) => x !== p.value))} /> {p.label}</label>)}
            </div></div>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>{tr('Applications', '应用领域')}</h2></div>
            <div className="panel-body"><div className="checks col">
              {apps.map((p) => <label key={p.value}><input type="checkbox" name="applications" value={p.value} checked={linkedApps.includes(p.value)} onChange={(e) => setLinkedApps(e.target.checked ? [...linkedApps, p.value] : linkedApps.filter((x) => x !== p.value))} /> {p.label}</label>)}
            </div></div>
          </section>
          {!isNew && actions.remove && (
            <section className="panel"><div className="panel-body"><button className="btn btn-ghost btn-sm" formAction={actions.remove} onClick={(e) => { if (!confirm(tr('Delete this article permanently?', '确定永久删除这篇文章？'))) e.preventDefault(); }}>{tr('Delete article', '删除文章')}</button></div></section>
          )}
        </div>
      </div>
      <div className="sticky-actions">
        <button className="btn">{tr('Save draft', '保存草稿')}</button>
        {a.status === 'published' && <button className="btn" formAction={actions.unpublish}>{tr('Unpublish', '取消发布')}</button>}
        <button className="btn btn-copper" formAction={actions.publish}>{a.status === 'published' ? tr('Save and keep live', '保存并保持发布') : tr('Publish', '发布')}</button>
      </div>
    </form>
  );
}

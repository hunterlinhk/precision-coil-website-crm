'use client';
import { useEffect, useRef } from 'react';

/* ==========================================================================
   Motion layer. One observer for scroll reveals, count-ups and scroll-linked
   progress, plus a few pointer effects (spotlight, tilt, magnetic buttons).
   Everything is attribute-driven so server components only add data-*:

   data-reveal            fade/rise in when it enters the viewport
   data-reveal="words"    per-word masked rise (children .w > span)
   data-stagger           direct children get --i for staggered delays
   data-count             count up the first number in the element
   data-from="1.000"      …starting from this value instead of 0
   data-scroll            gets --p: 0 when its top meets the viewport bottom, 1 when its bottom leaves the top
   data-spot              gets --mx / --my (pointer position) for spotlight gradients
   data-tilt              gets --rx / --ry (−1…1) for a gentle 3D tilt
   data-magnetic          drifts toward the pointer
   data-draw              SVG shapes inside are normalised so strokes can draw on

   Respects prefers-reduced-motion: everything is shown immediately, nothing moves.
   ========================================================================== */

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

function countUp(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Text | null = null;
  while (walker.nextNode()) { const n = walker.currentNode as Text; if (/\d/.test(n.data)) { node = n; break; } }
  if (!node) return;
  const original = node.data;
  const m = original.match(/\d[\d,]*(?:\.\d+)?/);
  if (!m) return;
  const raw = m[0];
  const target = parseFloat(raw.replace(/,/g, ''));
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  const commas = raw.includes(',');
  const from = parseFloat(el.dataset.from || '0');
  const dur = Number(el.dataset.dur || 1700);
  const fmt = (v: number) => {
    const s = v.toFixed(decimals);
    if (!commas) return s;
    const [i, d] = s.split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
  };
  const t0 = performance.now();
  const target_node = node;
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    const v = from + (target - from) * easeOut(k);
    target_node.data = original.replace(raw, fmt(v));
    if (k < 1) requestAnimationFrame(step);
    else target_node.data = original;
  };
  target_node.data = original.replace(raw, fmt(from));
  requestAnimationFrame(step);
}

function prepDraw(root: Element) {
  root.querySelectorAll('path, line, rect, circle, ellipse, polyline, polygon').forEach((s) => {
    if (!s.hasAttribute('pathLength')) s.setAttribute('pathLength', '1');
  });
}

export function Motion() {
  useEffect(() => {
    const doc = document.documentElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    doc.classList.add('motion-ready');
    if (reduce) doc.classList.remove('motion');

    const seen = new WeakSet<Element>();
    const live = new Set<HTMLElement>(); // data-scroll elements currently near the viewport

    const reveal = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.setAttribute('data-in', '');
        if (el.hasAttribute('data-count') && !reduce) countUp(el);
        reveal.unobserve(el);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    const near = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) live.add(el); else live.delete(el);
      }
      schedule();
    }, { rootMargin: '20% 0px 20% 0px' });

    const scan = () => {
      document.querySelectorAll('[data-reveal], [data-count], [data-scroll], [data-stagger], [data-draw]').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const h = el as HTMLElement;
        if (h.hasAttribute('data-stagger')) Array.from(h.children).forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i)));
        if (h.hasAttribute('data-draw')) prepDraw(h);
        if (h.hasAttribute('data-scroll')) near.observe(h);
        if (h.hasAttribute('data-reveal') || h.hasAttribute('data-count') || h.hasAttribute('data-stagger') || h.hasAttribute('data-draw')) {
          if (reduce) h.setAttribute('data-in', ''); else reveal.observe(h);
        }
      });
    };
    scan();
    let pending = 0;
    const mo = new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; scan(); }); });
    mo.observe(document.body, { childList: true, subtree: true });

    // ---- scroll-linked progress ----
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const max = doc.scrollHeight - vh;
      doc.style.setProperty('--scroll', String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
      document.querySelector('.site-header')?.toggleAttribute('data-scrolled', window.scrollY > 8);
      if (reduce) return;
      live.forEach((el) => {
        const r = el.getBoundingClientRect();
        const p = (vh - r.top) / (vh + r.height);
        el.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(4));
      });
    };
    function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // ---- pointer effects (fine pointers only) ----
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    let mag: HTMLElement | null = null;
    let tilt: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t || !t.closest) return;
      const spot = t.closest('[data-spot]') as HTMLElement | null;
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
        spot.style.setProperty('--my', `${e.clientY - r.top}px`);
      }
      const ti = t.closest('[data-tilt]') as HTMLElement | null;
      if (tilt && tilt !== ti) { tilt.style.setProperty('--rx', '0'); tilt.style.setProperty('--ry', '0'); }
      tilt = ti;
      if (ti) {
        const r = ti.getBoundingClientRect();
        ti.style.setProperty('--rx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        ti.style.setProperty('--ry', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      }
      const mg = t.closest('[data-magnetic]') as HTMLElement | null;
      if (mag && mag !== mg) { mag.style.setProperty('--tx', '0px'); mag.style.setProperty('--ty', '0px'); }
      mag = mg;
      if (mg) {
        const r = mg.getBoundingClientRect();
        mg.style.setProperty('--tx', `${((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1)}px`);
        mg.style.setProperty('--ty', `${((e.clientY - r.top - r.height / 2) * 0.36).toFixed(1)}px`);
      }
    };
    const onLeave = () => {
      if (mag) { mag.style.setProperty('--tx', '0px'); mag.style.setProperty('--ty', '0px'); mag = null; }
      if (tilt) { tilt.style.setProperty('--rx', '0'); tilt.style.setProperty('--ry', '0'); tilt = null; }
    };
    if (fine && !reduce) {
      document.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }

    return () => {
      reveal.disconnect(); near.disconnect(); mo.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return null;
}

// Runs before first paint: opt into motion styles, but fall back to plain content if JS never boots.
export const motionBootScript = `(function(){try{var d=document.documentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('motion');setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion')},3500)}catch(e){}})();`;

/* ---------- Loupe: a magnifying lens over a product image ---------- */
export function Loupe({ src, zoom = 2.6, children, label }: { src: string; zoom?: number; children: React.ReactNode; label?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current, ln = lens.current;
    if (!el || !ln) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    el.setAttribute('data-loupe', '');
    let pre: HTMLImageElement | null = null;
    const R = 92;
    const move = (e: PointerEvent) => {
      const img = el.querySelector('img');
      if (!img || !img.naturalWidth) return;
      if (!pre) { pre = new Image(); pre.src = src; }
      const r = img.getBoundingClientRect();
      // the rendered content box of an object-fit: contain image
      const s = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
      const cw = img.naturalWidth * s, ch = img.naturalHeight * s;
      const ox = r.left + (r.width - cw) / 2, oy = r.top + (r.height - ch) / 2;
      const x = e.clientX - ox, y = e.clientY - oy;
      const b = el.getBoundingClientRect();
      ln.style.transform = `translate3d(${e.clientX - b.left - R}px, ${e.clientY - b.top - R}px, 0)`;
      ln.style.backgroundSize = `${cw * zoom}px ${ch * zoom}px`;
      ln.style.backgroundPosition = `${-(x * zoom - R)}px ${-(y * zoom - R)}px`;
      el.setAttribute('data-lens', '');
    };
    const leave = () => el.removeAttribute('data-lens');
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [src, zoom]);
  return (
    <div ref={box} className="loupe">
      {children}
      <div ref={lens} className="loupe-lens" aria-hidden="true" style={{ backgroundImage: `url(${src})` }}>
        <span className="loupe-x">×{zoom.toFixed(1)}</span>
      </div>
      {label && <span className="loupe-hint" aria-hidden="true"><svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.3" /></svg>{label}</span>}
    </div>
  );
}

/* ---------- Production ticker: coils wound since local midnight ---------- */
export function Ticker({ perYear, locale }: { perYear: number; locale: string }) {
  const out = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const perMs = perYear / (365 * 86400 * 1000);
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const fmt = new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : 'en-US');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let id = 0;
    const tick = () => {
      if (out.current) out.current.textContent = fmt.format(Math.floor((Date.now() - midnight.getTime()) * perMs));
      id = window.setTimeout(tick, reduce ? 1000 : 90);
    };
    tick();
    return () => clearTimeout(id);
  }, [perYear, locale]);
  return <span ref={out} className="ticker-n">&nbsp;</span>;
}

/* ---------- Cursor-following preview for a list of rows with data-preview ---------- */
export function HoverPreview({ children }: { children: React.ReactNode }) {
  const card = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const w = wrap.current, c = card.current;
    if (!w || !c) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    w.setAttribute('data-hp', '');
    const img = c.querySelector('img')!;
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0, on = false;
    const loop = () => {
      const dx = x - cx;
      cx += dx * 0.16; cy += (y - cy) * 0.16;
      const rot = Math.max(-12, Math.min(12, dx * 0.06));
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) rotate(${rot}deg)`;
      raf = on || Math.abs(dx) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      const row = (e.target as Element).closest('[data-preview]');
      if (row) {
        const src = row.getAttribute('data-preview')!;
        if (img.getAttribute('src') !== src) { img.setAttribute('src', src); c.animate([{ filter: 'blur(6px)', opacity: 0.4 }, { filter: 'blur(0)', opacity: 1 }], { duration: 260 }); }
        if (!on) { cx = x; cy = y; }
        on = true; c.setAttribute('data-on', '');
      } else { on = false; c.removeAttribute('data-on'); }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const leave = () => { on = false; c.removeAttribute('data-on'); };
    w.addEventListener('pointermove', move);
    w.addEventListener('pointerleave', leave);
    return () => { w.removeEventListener('pointermove', move); w.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={wrap} className="hp">
      {children}
      <div ref={card} className="hp-card" aria-hidden="true"><img alt="" /></div>
    </div>
  );
}

/* ---------- Measuring reticle that follows the pointer over the macro image ---------- */
export function Reticle({ widthMm = 2.4 }: { widthMm?: number }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const r = el.current;
    const host = r?.parentElement;
    if (!r || !host) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const read = r.querySelector('.reticle-read') as HTMLElement;
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      r.style.setProperty('--x', `${cx}px`); r.style.setProperty('--y', `${cy}px`);
      const b = host.getBoundingClientRect();
      const mm = widthMm / b.width;
      read.textContent = `X ${(cx * mm).toFixed(3)}  Y ${(cy * mm).toFixed(3)} mm`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      const b = host.getBoundingClientRect();
      x = e.clientX - b.left; y = e.clientY - b.top;
      if (!r.hasAttribute('data-on')) { cx = x; cy = y; }
      r.setAttribute('data-on', '');
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const leave = () => r.removeAttribute('data-on');
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => { host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, [widthMm]);
  return (
    <div ref={el} className="reticle" aria-hidden="true">
      <i className="reticle-h" /><i className="reticle-v" />
      <span className="reticle-ring" />
      <span className="reticle-read" />
    </div>
  );
}

/* ---------- A bead of copper that flies from a button to the quote-list counter ---------- */
export function flyToQuote(from: Element) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = Array.from(document.querySelectorAll('.rfq-count .rfq-n')).find((n) => (n as HTMLElement).offsetParent !== null) as HTMLElement | undefined;
  if (!target) return;
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
  const sx = a.left + a.width / 2, sy = a.top + a.height / 2;
  const ex = b.left + b.width / 2, ey = b.top + b.height / 2;
  const bead = document.createElement('span');
  bead.className = 'fly-bead';
  document.body.appendChild(bead);
  const mx = (sx + ex) / 2, my = Math.min(sy, ey) - 140;
  bead.animate([
    { transform: `translate(${sx}px, ${sy}px) scale(1.4)`, opacity: 1 },
    { transform: `translate(${mx}px, ${my}px) scale(1)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${ex}px, ${ey}px) scale(0.4)`, opacity: 0.6 },
  ], { duration: 720, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => {
    bead.remove();
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.45)', background: '#c4652c', color: '#fff' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  };
}

/* ---------- Local time at the plant ---------- */
export function LocalClock({ label, running }: { label: string; running: string }) {
  const out = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Shanghai' });
    const tick = () => { if (out.current) out.current.textContent = fmt.format(new Date()); };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <><i className="live-dot" aria-hidden="true" /><span>{label}</span> <span ref={out} className="clock">--:--:--</span> <span className="muted-dark">· {running}</span></>;
}

/* ---------- Scroll spy: marks the step nearest the viewport centre as current ---------- */
export function ScrollSpy({ children, className }: { children: React.ReactNode; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = el.current;
    if (!root) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
    const set = (i: string) => {
      if (root.getAttribute('data-current') === i) return;
      root.setAttribute('data-current', i);
      root.querySelectorAll<HTMLElement>('[data-step], [data-for]').forEach((n) => n.toggleAttribute('data-on', (n.dataset.step ?? n.dataset.for) === i));
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) set((e.target as HTMLElement).dataset.step!);
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return <div ref={el} className={className} data-current="0">{children}</div>;
}

/* ---------- Client-side filter for a list of [data-type] items (keeps ?type= in the URL) ---------- */
export function TypeFilter({ tabs, initial, label, children }: { tabs: [string, string][]; initial: string; label: string; children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const w = wrap.current!;
    const apply = (k: string) => {
      w.setAttribute('data-filter', k);
      w.querySelectorAll<HTMLButtonElement>('.pills button').forEach((b) => b.setAttribute('aria-pressed', String(b.value === k)));
    };
    const fromUrl = new URL(location.href).searchParams.get('type');
    if (fromUrl && tabs.some(([k]) => k === fromUrl)) apply(fromUrl);
    const click = (e: Event) => {
      const b = (e.target as Element).closest('.pills button') as HTMLButtonElement | null;
      if (!b) return;
      apply(b.value);
      const u = new URL(location.href);
      if (b.value === 'all') u.searchParams.delete('type'); else u.searchParams.set('type', b.value);
      history.replaceState(history.state, '', u.toString());
      w.querySelectorAll<HTMLElement>('[data-type]').forEach((li, i) => li.animate?.([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: Math.min(i, 8) * 40, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'backwards' }));
    };
    w.addEventListener('click', click);
    return () => w.removeEventListener('click', click);
  }, [tabs]);
  return (
    <div ref={wrap} className="type-filter" data-filter={initial}>
      <div className="catbar" style={{ position: 'static' }}>
        <div className="pills" role="group" aria-label={label}>
          {tabs.map(([k, l]) => <button key={k} type="button" value={k} aria-pressed={k === initial}>{l}</button>)}
        </div>
      </div>
      {children}
    </div>
  );
}

'use client';
import { useEffect, useRef } from 'react';

// Animated orthocyclic winding cross-section. Turns are laid layer by layer
// (alternating direction, like a real winder); when the coil is complete,
// every tenth turn lights up: about one in ten VCM coils worldwide is ours.

type Labels = { turns: string; wire: string; fill: string; share: string; shareLabel: string; caption: string };

export function WindingHero({ labels }: { labels: Labels }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let start = 0;
    let turns: { x: number; y: number; i: number }[] = [];
    let W = 0, H = 0, r = 0, box = { x: 0, y: 0, w: 0, h: 0 };
    const WIND_MS = 4200, LIGHT_MS = 900;

    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const perLayer = W < 520 ? 16 : 22;
      const pad = 22;
      r = (W - pad * 2 - 12) / (perLayer * 2 + 1);
      const rowH = r * Math.sqrt(3);
      const layers = Math.max(6, Math.min(13, Math.floor((H - pad * 2 - 12 - 2 * r) / rowH) + 1));
      box = { x: pad, y: pad, w: W - pad * 2, h: (layers - 1) * rowH + 2 * r + 12 };
      box.y = (H - box.h) / 2;
      turns = [];
      let n = 0;
      for (let L = 0; L < layers; L++) {
        const count = L % 2 === 0 ? perLayer : perLayer;
        const offset = L % 2 === 0 ? 0 : r;
        const y = box.y + box.h - 6 - r - L * rowH;
        const xs = Array.from({ length: count }, (_, k) => box.x + 6 + r + offset + k * 2 * r);
        if (L % 2 === 1) xs.reverse();
        xs.forEach((x) => turns.push({ x, y, i: n++ }));
      }
    }

    function turn(x: number, y: number, alpha: number, lit: boolean) {
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      if (lit) { g.addColorStop(0, '#ffe2bf'); g.addColorStop(0.45, '#f08a3e'); g.addColorStop(1, '#9a4513'); }
      else { g.addColorStop(0, '#e7a877'); g.addColorStop(0.5, '#b8612a'); g.addColorStop(1, '#6e3412'); }
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(x, y, r * 0.93, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = Math.max(0.6, r * 0.12);
      ctx.strokeStyle = lit ? 'rgba(255,214,170,.9)' : 'rgba(240,170,110,.35)';
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    let done = false;
    function frame(ts: number) {
      if (!start) start = ts;
      const t = reduce || done ? WIND_MS + LIGHT_MS : ts - start;
      ctx.clearRect(0, 0, W, H);
      // Bobbin: core (bottom) and flanges (sides)
      ctx.strokeStyle = 'rgba(214,232,226,.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(box.x, box.y - 10); ctx.lineTo(box.x, box.y + box.h); ctx.lineTo(box.x + box.w, box.y + box.h); ctx.lineTo(box.x + box.w, box.y - 10);
      ctx.stroke();
      ctx.setLineDash([2, 5]); ctx.strokeStyle = 'rgba(214,232,226,.22)';
      ctx.beginPath(); ctx.moveTo(box.x - 14, box.y + box.h + 14); ctx.lineTo(box.x + box.w + 14, box.y + box.h + 14); ctx.stroke();
      ctx.setLineDash([]);

      const wound = Math.min(turns.length, Math.floor((Math.min(t, WIND_MS) / WIND_MS) * turns.length));
      const lightP = Math.max(0, Math.min(1, (t - WIND_MS) / LIGHT_MS));
      for (let k = 0; k < wound; k++) {
        const p = turns[k];
        const lit = lightP > 0 && p.i % 10 === 9;
        const alpha = lightP > 0 ? (lit ? 1 : 1 - 0.5 * lightP) : 1;
        turn(p.x, p.y, alpha, lit && lightP > 0.05);
      }
      // Wire feed from the guide nozzle to the turn being laid
      if (t < WIND_MS && wound > 0 && wound < turns.length) {
        const p = turns[wound];
        ctx.strokeStyle = 'rgba(232,150,90,.9)'; ctx.lineWidth = Math.max(1, r * 0.5);
        ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      if (countRef.current) countRef.current.textContent = String(wound).padStart(3, '0');
      if (shareRef.current) shareRef.current.style.opacity = String(lightP);
      if (t < WIND_MS + LIGHT_MS) raf = requestAnimationFrame(frame);
      else done = true;
    }

    layout();
    const ro = new ResizeObserver(() => { layout(); if (done) frame(performance.now()); });
    ro.observe(canvas);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <figure className="winding">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="winding-foot">
        <div className="winding-readout" aria-hidden="true">
          <span><b ref={countRef}>000</b> {labels.turns}</span>
          <span><b>0.040</b> mm {labels.wire}</span>
          <span><b>90.7%</b> {labels.fill}</span>
        </div>
        <div className="winding-share" ref={shareRef} style={{ opacity: 0 }}>
          <strong>{labels.share}</strong>
          <span>{labels.shareLabel}</span>
        </div>
      </div>
      <figcaption>{labels.caption}</figcaption>
    </figure>
  );
}

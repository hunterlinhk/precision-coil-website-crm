'use client';
import { useEffect, useRef, useState } from 'react';

// Product viewer: drag to rotate, scroll or pinch to zoom.
export function ProductViewer({ dims, slug, label }: { dims: any; slug: string; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unsupported'>('loading');
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('@/lib/coil3d/live').then(({ mountLive, webglAvailable }) => {
      if (cancelled || !canvas.current) return;
      if (!webglAvailable()) { setState('unsupported'); return; }
      dispose = mountLive(canvas.current, { kind: 'product', dims, slug, interactive: true, onReady: () => setState('ready') });
    });
    return () => { cancelled = true; dispose?.(); };
  }, [dims, slug]);
  return (
    <div className="viewer" data-state={state}>
      <canvas ref={canvas} aria-label={label} role="img" />
      {state === 'loading' && <span className="viewer-note">Loading 3D model…</span>}
      {state === 'unsupported' && <span className="viewer-note">3D needs WebGL, which this browser has turned off.</span>}
    </div>
  );
}

'use client';
import { useState } from 'react';

export function FigureTabs({ tabs }: { tabs: { label: string; node: React.ReactNode }[] }) {
  const [i, setI] = useState(0);
  return (
    <div className="pd-figure">
      {tabs.length > 1 && (
        <div className="pd-figure-tabs" role="tablist">
          {tabs.map((t, k) => (
            <button key={t.label} type="button" role="tab" aria-selected={i === k} aria-controls={`fig-${k}`} id={`tab-${k}`} onClick={() => setI(k)}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      {tabs.map((t, k) => (
        <div key={t.label} id={`fig-${k}`} role="tabpanel" aria-labelledby={`tab-${k}`} hidden={i !== k} className="pd-figure-panel">
          {t.node}
        </div>
      ))}
    </div>
  );
}

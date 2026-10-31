'use client';
import { useState } from 'react';
import { ProductViewer } from './Live3D';

// Product stage: studio photo, interactive 3D model (loaded only when opened) and the dimensioned drawing.
export function Stage({ photo, drawing, dims, slug, labels }: {
  photo: React.ReactNode; drawing: React.ReactNode; dims: any; slug: string;
  labels: { photo: string; model: string; drawing: string; hint: string; viewer: string };
}) {
  const [tab, setTab] = useState<'photo' | '3d' | 'drawing'>('photo');
  return (
    <div className="stage">
      <div className="stage-panel" hidden={tab !== 'photo'}>{photo}</div>
      {tab === '3d' && (
        <div className="stage-panel">
          <ProductViewer dims={dims} slug={slug} label={labels.viewer} />
          <span className="stage-hint">{labels.hint}</span>
        </div>
      )}
      <div className="stage-panel drawing-panel" hidden={tab !== 'drawing'}>{drawing}</div>
      <div className="stage-tabs">
        <div className="seg" role="group" aria-label="View">
          <button type="button" aria-pressed={tab === 'photo'} onClick={() => setTab('photo')}>{labels.photo}</button>
          <button type="button" aria-pressed={tab === '3d'} onClick={() => setTab('3d')}>{labels.model}</button>
          <button type="button" aria-pressed={tab === 'drawing'} onClick={() => setTab('drawing')}>{labels.drawing}</button>
        </div>
      </div>
    </div>
  );
}

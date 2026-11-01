'use client';
import { useState } from 'react';
import { Loupe } from './motion';

// Several uploaded product photos: the active one fills the stage (with the loupe), thumbnails switch between them.
export function PhotoSwitch({ images, label }: { images: { src: string; alt: string }[]; label: string }) {
  const [i, setI] = useState(0);
  const cur = images[i];
  return (
    <>
      <Loupe key={cur.src} src={cur.src} zoom={2.4} label={label}><img src={cur.src} alt={cur.alt} /></Loupe>
      <div className="photo-thumbs" role="group" aria-label="Photos">
        {images.map((im, k) => (
          <button key={im.src} type="button" aria-pressed={k === i} onClick={() => setI(k)} aria-label={`Photo ${k + 1}`}>
            <img src={im.src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </>
  );
}

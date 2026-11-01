'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type Img = { id: string; name: string; size?: number };

// Product photos: the first one is the main photo and replaces the studio render on the website.
// Reorder, replace or remove existing photos and add new ones; nothing changes until the product is saved.
export function PhotoManager({ images, fallback, model }: { images: Img[]; fallback?: string; model: string }) {
  const [order, setOrder] = useState(images.map((i) => i.id));
  const [removed, setRemoved] = useState<string[]>([]);
  const [replaced, setReplaced] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<{ name: string; url: string }[]>([]);
  const [over, setOver] = useState(false);
  const addInput = useRef<HTMLInputElement>(null);
  const byId = useMemo(() => Object.fromEntries(images.map((i) => [i.id, i])), [images]);
  const live = order.filter((id) => !removed.includes(id));
  useEffect(() => () => { Object.values(replaced).forEach(URL.revokeObjectURL); added.forEach((a) => URL.revokeObjectURL(a.url)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (id: string, to: number) => setOrder((o) => { const n = o.filter((x) => x !== id); n.splice(Math.max(0, Math.min(to, n.length)), 0, id); return n; });
  const showAdded = (files: FileList | null) => {
    added.forEach((a) => URL.revokeObjectURL(a.url));
    setAdded(Array.from(files || []).filter((f) => f.type.startsWith('image/')).map((f) => ({ name: f.name, url: URL.createObjectURL(f) })));
  };

  return (
    <div className="photos">
      <input type="hidden" name="image_order" value={order.join(',')} />
      {removed.map((id) => <input key={id} type="hidden" name="remove_file" value={id} />)}

      {live.length === 0 && added.length === 0 && (
        <div className="photo-empty">
          {fallback && <img src={fallback} alt={`${model} studio render`} />}
          <p><strong>No photos yet.</strong> The website shows this studio render. Upload a photo and it replaces the render everywhere: catalogue, product page and related products.</p>
        </div>
      )}

      <ul className="photo-grid">
        {order.map((id) => {
          const img = byId[id];
          if (!img) return null;
          const gone = removed.includes(id);
          const pos = live.indexOf(id);
          return (
            <li key={id} className="photo-card" data-removed={gone || undefined} data-main={pos === 0 || undefined}>
              <div className="photo-thumb">
                <img src={replaced[id] || `/api/media/${id}`} alt={img.name} />
                {pos === 0 && <span className="photo-badge">Main photo</span>}
                {replaced[id] && <span className="photo-badge new">Replacement</span>}
              </div>
              <div className="photo-name" title={img.name}>{img.name}</div>
              <div className="photo-tools">
                {!gone && pos > 0 && <button type="button" className="btn btn-sm" onClick={() => move(id, 0)}>Make main</button>}
                {!gone && <button type="button" className="btn btn-sm" aria-label="Move earlier" disabled={pos <= 0} onClick={() => move(id, order.indexOf(id) - 1)}>←</button>}
                {!gone && <button type="button" className="btn btn-sm" aria-label="Move later" disabled={pos === live.length - 1} onClick={() => move(id, order.indexOf(id) + 1)}>→</button>}
                {!gone && (
                  <label className="btn btn-sm">
                    Replace
                    <input type="file" name={`replace_${id}`} accept="image/*" hidden onChange={(e) => {
                      const f = e.target.files?.[0];
                      setReplaced((r) => ({ ...r, [id]: f ? URL.createObjectURL(f) : '' }));
                    }} />
                  </label>
                )}
                <button type="button" className={`btn btn-sm ${gone ? '' : 'btn-danger-ghost'}`} onClick={() => setRemoved((r) => (gone ? r.filter((x) => x !== id) : [...r, id]))}>{gone ? 'Undo remove' : 'Remove'}</button>
              </div>
            </li>
          );
        })}
        {added.map((a, i) => (
          <li key={a.url} className="photo-card is-new">
            <div className="photo-thumb"><img src={a.url} alt={a.name} />{live.length === 0 && i === 0 && <span className="photo-badge">Main photo</span>}<span className="photo-badge new">New</span></div>
            <div className="photo-name" title={a.name}>{a.name}</div>
          </li>
        ))}
      </ul>

      <label className="photo-drop" data-over={over || undefined}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (addInput.current && e.dataTransfer.files.length) { addInput.current.files = e.dataTransfer.files; showAdded(e.dataTransfer.files); } }}>
        <strong>Add photos</strong>
        <span>Drop images here or click to choose. JPG, PNG or WebP, up to 25 MB each. Landscape (4:3) on a plain light background fits the product page best.</span>
        <input ref={addInput} type="file" name="new_images" accept="image/*" multiple hidden onChange={(e) => showAdded(e.target.files)} />
      </label>
      <p className="hint">Changes are applied when you save the product.</p>
    </div>
  );
}

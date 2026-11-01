// Optional base path, used only for the static preview build (e.g. GitHub Pages under /<repo>).
// Next prefixes its own links and assets; plain asset URLs go through withBase().
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const withBase = (p: string) => (p.startsWith('/') ? BASE + p : p);
export const STATIC_PREVIEW = process.env.NEXT_PUBLIC_STATIC_PREVIEW === '1';

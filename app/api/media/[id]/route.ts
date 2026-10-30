import { readUpload } from '@/lib/uploads';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = readUpload(id, 'public');
  if (!f) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(f.body), { headers: { 'Content-Type': f.type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', ...(f.type === 'image/svg+xml' ? { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" } : {}) } });
}

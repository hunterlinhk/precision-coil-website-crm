import { readUpload } from '@/lib/uploads';
import { currentUser, can } from '@/lib/auth';

// Customer drawings: only signed-in CRM users can download them.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u || !can.crm(u)) return new Response('Sign in required', { status: 401 });
  const { id } = await params;
  const f = readUpload(id, 'private');
  if (!f) return new Response('Not found', { status: 404 });
  const name = new URL(req.url).searchParams.get('name') || id;
  return new Response(new Uint8Array(f.body), { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${name.replace(/["\r\n]/g, '')}"`, 'Cache-Control': 'private, no-store' } });
}

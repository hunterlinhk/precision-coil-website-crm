import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser, can } from '@/lib/auth';

// Deals are edited on the customer page now; keep old links working.
export default async function Opportunity({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(can.crm);
  const { id } = await params;
  const o = db().prepare('SELECT account_id FROM opportunities WHERE id = ?').get(+id) as { account_id: number } | undefined;
  if (!o) notFound();
  redirect(`/HunterLin/accounts/${o.account_id}#deal-${id}`);
}

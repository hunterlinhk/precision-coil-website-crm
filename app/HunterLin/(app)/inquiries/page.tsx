import { redirect } from 'next/navigation';

// The inquiry list now lives in the Inbox.
export default async function Inquiries({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const p = new URLSearchParams(await searchParams);
  redirect(`/HunterLin/inbox${p.size ? `?${p}` : ''}`);
}

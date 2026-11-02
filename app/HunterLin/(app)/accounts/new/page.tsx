import { requireUser, can } from '@/lib/auth';
import { translator } from '@/lib/admin-lang';
import { Topbar, Panel } from '@/components/admin/ui';
import { AccountForm } from '@/components/admin/AccountForm';

export const metadata = { title: 'New customer' };

export default async function NewAccount({ searchParams }: { searchParams: Promise<{ domain?: string; name?: string }> }) {
  const u = await requireUser(can.crm);
  const { l, tr } = await translator();
  const sp = await searchParams;
  return (
    <>
      <Topbar crumbs={[[tr('Customers', '客户'), '/HunterLin/accounts'], [tr('New', '新建')]]} title={tr('Add a customer', '添加客户')} />
      <div style={{ maxWidth: 760 }}><Panel><AccountForm canAssign={can.assign(u)} l={l} a={sp.domain || sp.name ? { domain: sp.domain, name: sp.name, __new: true } : undefined} /></Panel></div>
    </>
  );
}

import { requireUser, can } from '@/lib/auth';
import { Topbar, Panel } from '@/components/admin/ui';
import { AccountForm } from '@/components/admin/AccountForm';

export const metadata = { title: 'New customer' };

export default async function NewAccount() {
  const u = await requireUser(can.crm);
  return (
    <>
      <Topbar crumbs={[['Customers', '/HunterLin/accounts'], ['New']]} title="Add a customer" />
      <div style={{ maxWidth: 760 }}><Panel><AccountForm canAssign={can.assign(u)} /></Panel></div>
    </>
  );
}

import { requireAdmin } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { AdminPermissionsProvider } from '@/components/auth/AdminPermissionsProvider';
import { ToastProvider } from '@/components/ui/toast';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <AdminPermissionsProvider role={admin.role} perms={admin.perms}>
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar perms={admin.perms} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar admin={admin} />
          <main className="scroll-slim flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
    </AdminPermissionsProvider>
  );
}

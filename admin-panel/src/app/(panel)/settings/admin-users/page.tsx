import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { listAdminUsers } from '@/lib/settings/queries';
import { AdminUserManager } from './AdminUserManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin Users · CampusEduX Admin' };

export default async function AdminUsersPage() {
  const admin = await requireModule('admin_users');
  const users = await listAdminUsers();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Settings
        </Link>
        <PageHeader title="Admin Users" subtitle="Staff accounts and their roles. Only Super Admins can manage these." />
      </div>
      <AdminUserManager users={users} canManage={admin.perms.admin_users.edit} />
    </div>
  );
}

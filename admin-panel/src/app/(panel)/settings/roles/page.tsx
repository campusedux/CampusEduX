import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { ADMIN_ROLES, ROLE_LABEL, type AdminRole } from '@/lib/permissions';
import { getRoleMatrix } from '@/lib/settings/queries';
import { RoleMatrixEditor } from './RoleMatrixEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Roles & Permissions · CampusEduX Admin' };

export default async function RolesPage({ searchParams }: { searchParams: { role?: string } }) {
  const admin = await requireModule('roles');
  const role = (ADMIN_ROLES.includes(searchParams.role as AdminRole) ? searchParams.role : 'admin') as AdminRole;
  const matrix = await getRoleMatrix(role);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Settings
        </Link>
        <PageHeader
          title="Roles & Permissions"
          subtitle="Per-module view/add/edit/delete for each role. Drives the sidebar visibility and button gating everywhere."
        />
      </div>

      <Tabs
        basePath="/settings/roles"
        param="role"
        current={role}
        tabs={ADMIN_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
      />

      <RoleMatrixEditor role={role} matrix={matrix} canEdit={admin.perms.roles.edit} />
    </div>
  );
}

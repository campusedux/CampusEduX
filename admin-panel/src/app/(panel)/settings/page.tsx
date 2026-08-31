import Link from 'next/link';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/primitives';
import { getSiteSettings } from '@/lib/settings/queries';
import { GeneralSettingsForm } from './GeneralSettingsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings · CampusEduX Admin' };

export default async function SettingsPage() {
  const admin = await requireModule('settings');
  const settings = await getSiteSettings();

  const links = [
    { href: '/settings/courses', label: 'Courses', show: admin.perms.settings.view },
    { href: '/settings/branches', label: 'Branches', show: admin.perms.settings.view },
    { href: '/settings/years', label: 'Years', show: admin.perms.settings.view },
    { href: '/settings/categories', label: 'Categories', show: admin.perms.settings.view },
    { href: '/settings/technologies', label: 'Technologies', show: admin.perms.settings.view },
    { href: '/settings/admin-users', label: 'Admin Users', show: admin.perms.admin_users.view },
    { href: '/settings/roles', label: 'Roles & Permissions', show: admin.perms.roles.view },
    { href: '/settings/backup', label: 'Backup', show: admin.perms.backup.view },
    { href: '/settings/system-logs', label: 'System Logs', show: admin.perms.system_logs.view },
  ].filter((l) => l.show);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Settings" subtitle="Site configuration, academic data, staff and system." />

      <Card>
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:bg-brand-light/40"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </Card>

      <GeneralSettingsForm settings={settings} canEdit={admin.perms.settings.edit} />
    </div>
  );
}

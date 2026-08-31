import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getTechnologies } from '@/lib/projects/queries';
import { TechnologyManager } from '../../projects/technologies/TechnologyManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Technologies · CampusEduX Admin' };

export default async function SettingsTechnologiesPage() {
  const admin = await requireModule('settings');
  const technologies = await getTechnologies();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Settings
        </Link>
        <PageHeader title="Technologies" subtitle="The shared tech vocabulary used on project cards and filters." />
      </div>
      {/* Edits are gated server-side on the `projects` permission. */}
      <TechnologyManager
        technologies={technologies}
        canAdd={admin.perms.projects.add}
        canEdit={admin.perms.projects.edit}
        canDelete={admin.perms.projects.delete}
      />
    </div>
  );
}

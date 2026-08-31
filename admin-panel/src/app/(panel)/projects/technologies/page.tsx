import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getTechnologies } from '@/lib/projects/queries';
import { TechnologyManager } from './TechnologyManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Technologies · CampusEduX Admin' };

export default async function TechnologiesPage() {
  const admin = await requireModule('projects');
  const technologies = await getTechnologies();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/projects" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Projects
        </Link>
        <PageHeader title="Technologies" subtitle="The tech vocabulary shown on project cards and used in filters." />
      </div>
      <TechnologyManager
        technologies={technologies}
        canAdd={admin.perms.projects.add}
        canEdit={admin.perms.projects.edit}
        canDelete={admin.perms.projects.delete}
      />
    </div>
  );
}

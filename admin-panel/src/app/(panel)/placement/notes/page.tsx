import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getPrepNotes } from '@/lib/placement/queries';
import { getAcademicOptions } from '@/lib/academic-targeting';
import { NotesManager } from './NotesManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Preparation Notes · CampusEduX Admin' };

export default async function NotesPage() {
  const admin = await requireModule('placement');
  const [notes, academicOptions] = await Promise.all([getPrepNotes(), getAcademicOptions()]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/placement" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Placement Prep
        </Link>
        <PageHeader
          title="Preparation Notes"
          subtitle="Study notes shown to students under Prep → Notes. Only Published notes are visible."
        />
      </div>
      <NotesManager notes={notes} perms={admin.perms.placement} academicOptions={academicOptions} />
    </div>
  );
}

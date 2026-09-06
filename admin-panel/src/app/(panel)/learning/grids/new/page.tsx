import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getAcademicOptions } from '@/lib/academic-targeting';
import { GridForm } from '../[gridId]/GridForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New learning grid · CampusEduX Admin' };

export default async function NewGridPage() {
  const admin = await requireModule('learning');
  if (!admin.perms.learning.add) redirect('/learning');
  const options = await getAcademicOptions();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/learning" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Learning
        </Link>
        <PageHeader title="New learning grid" subtitle="Step 1 — create the grid. You'll add Topics and Content next." />
      </div>
      <GridForm canEdit options={options} />
    </div>
  );
}

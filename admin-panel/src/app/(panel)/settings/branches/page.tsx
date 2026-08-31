import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { AcademicManager } from '../AcademicManager';
import { getBranches, getCourses } from '@/lib/settings/queries';


export const dynamic = 'force-dynamic';
export const metadata = { title: 'Branches · CampusEduX Admin' };

export default async function Page() {
  const admin = await requireModule('settings');
  const [rows, courses] = await Promise.all([getBranches(), getCourses()]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Settings
        </Link>
        <PageHeader title="Branches" subtitle="Branches, linked to a course." />
      </div>
      <AcademicManager kind="branch" rows={rows} courses={courses.map((c: any) => ({ id: c.id, name: c.name }))} perms={admin.perms.settings} />
    </div>
  );
}

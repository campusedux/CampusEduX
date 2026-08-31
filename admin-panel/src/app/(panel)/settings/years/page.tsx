import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { AcademicManager } from '../AcademicManager';
import { getAcademicYears } from '@/lib/settings/queries';


export const dynamic = 'force-dynamic';
export const metadata = { title: 'Years · CampusEduX Admin' };

export default async function Page() {
  const admin = await requireModule('settings');
  const rows = await getAcademicYears();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Settings
        </Link>
        <PageHeader title="Years" subtitle="Academic years shown in student profiles." />
      </div>
      <AcademicManager kind="year" rows={rows}  perms={admin.perms.settings} />
    </div>
  );
}

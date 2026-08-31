import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { MockTestForm } from '../../MockTestForm';
import { createMockTest } from '../../actions';
import { getCompanyOptions } from '@/lib/jobs/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Mock Test · CampusEduX Admin' };

export default async function NewMockTestPage() {
  const admin = await requireModule('placement');
  if (!admin.perms.placement.add) redirect('/placement/tests?error=no_access');
  const companies = await getCompanyOptions();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Add Mock Test" subtitle="Create the test shell, then add questions." />
      <MockTestForm mode="create" action={createMockTest} companies={companies} cancelHref="/placement/tests" />
    </div>
  );
}

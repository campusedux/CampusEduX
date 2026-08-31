import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { MockTestForm } from '../../../MockTestForm';
import { updateMockTest } from '../../../actions';
import { getMockTest } from '@/lib/placement/queries';
import { getCompanyOptions } from '@/lib/jobs/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Mock Test · CampusEduX Admin' };

export default async function EditMockTestPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('placement');
  if (!admin.perms.placement.edit) redirect(`/placement/tests/${params.id}?error=no_access`);
  const [test, companies] = await Promise.all([getMockTest(params.id), getCompanyOptions()]);
  if (!test) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Edit Mock Test" subtitle={test.title} />
      <MockTestForm
        mode="edit"
        action={updateMockTest.bind(null, params.id)}
        initial={test}
        companies={companies}
        cancelHref={`/placement/tests/${params.id}`}
      />
    </div>
  );
}

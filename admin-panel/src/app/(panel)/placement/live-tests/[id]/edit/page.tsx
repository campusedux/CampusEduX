import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { LiveTestForm } from '../../../LiveTestForm';
import { updateLiveTest } from '../../../actions';
import { getLiveTest, getTestOptions } from '@/lib/placement/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Live Test · CampusEduX Admin' };

export default async function EditLiveTestPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('placement');
  if (!admin.perms.placement.edit) redirect('/placement/live-tests?error=no_access');
  const [live, tests] = await Promise.all([getLiveTest(params.id), getTestOptions()]);
  if (!live) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Edit Live Test" subtitle={live.title} />
      <LiveTestForm mode="edit" action={updateLiveTest.bind(null, params.id)} initial={live} tests={tests} cancelHref="/placement/live-tests" />
    </div>
  );
}

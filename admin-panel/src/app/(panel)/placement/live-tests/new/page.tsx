import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { LiveTestForm } from '../../LiveTestForm';
import { createLiveTest } from '../../actions';
import { getTestOptions } from '@/lib/placement/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Schedule Live Test · CampusEduX Admin' };

export default async function NewLiveTestPage() {
  const admin = await requireModule('placement');
  if (!admin.perms.placement.add) redirect('/placement/live-tests?error=no_access');
  const tests = await getTestOptions();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Schedule Live Test" subtitle="Set the window and status." />
      <LiveTestForm mode="create" action={createLiveTest} tests={tests} cancelHref="/placement/live-tests" />
    </div>
  );
}

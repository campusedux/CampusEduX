import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getShareReports } from '@/lib/resume/queries';
import { ShareReportManager } from './ShareReportManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resume Share Reports · CampusEduX Admin' };

export default async function ResumeSharesPage() {
  const admin = await requireModule('resume');
  const reports = await getShareReports();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Resume Share Reports"
        subtitle="Reports submitted from a public resume share page. Revoking a link takes effect immediately."
      />
      <ShareReportManager reports={reports} perms={admin.perms.resume} />
    </div>
  );
}

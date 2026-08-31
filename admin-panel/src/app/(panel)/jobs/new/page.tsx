import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { JobForm } from '../JobForm';
import { createJob } from '../actions';
import { getCompanyOptions } from '@/lib/jobs/queries';
import { getAcademicOptions } from '@/lib/academic-targeting';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Job · CampusEduX Admin' };

export default async function NewJobPage() {
  const admin = await requireModule('jobs');
  if (!admin.perms.jobs.add) redirect('/jobs?error=no_access');
  const [companies, academicOptions] = await Promise.all([getCompanyOptions(), getAcademicOptions()]);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Add Job" subtitle="Post a new job listing." />
      <JobForm
        mode="create"
        action={createJob}
        companies={companies}
        academicOptions={academicOptions}
        cancelHref="/jobs"
      />
    </div>
  );
}

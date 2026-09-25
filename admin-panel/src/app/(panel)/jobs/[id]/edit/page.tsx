import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { JobForm } from '../../JobForm';
import { updateJob } from '../../actions';
import { getJob, getCompanyOptions } from '@/lib/jobs/queries';
import { getAcademicOptions } from '@/lib/academic-targeting';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Job · CampusEduX Admin' };

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('jobs');
  if (!admin.perms.jobs.edit) redirect(`/jobs/${params.id}?error=no_access`);

  const [job, companies, academicOptions] = await Promise.all([
    getJob(params.id),
    getCompanyOptions(),
    getAcademicOptions(),
  ]);
  if (!job) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Edit Job" subtitle={job.title} />
      <JobForm
        mode="edit"
        action={updateJob.bind(null, params.id)}
        companies={companies}
        academicOptions={academicOptions}
        cancelHref={`/jobs/${params.id}`}
        initial={{
          title: job.title,
          company_id: job.company_id,
          company_name: job.company_name,
          location: job.location,
          salary_range: job.salary_range,
          salary_min_lpa: job.salary_min_lpa,
          salary_max_lpa: job.salary_max_lpa,
          job_type: job.job_type,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          experience: job.experience,
          status: job.status,
          ...(job as unknown as Pick<
            import('../../JobForm').JobFormInitial,
            | 'apply_url' | 'application_deadline' | 'requisition_id' | 'category' | 'qualification'
            | 'work_mode' | 'experience_level' | 'shift' | 'benefits' | 'summary' | 'responsibilities' | 'candidate_note'
          >),
          target_type: (job as { target_type?: string | null }).target_type ?? null,
          target_course_id: (job as { target_course_id?: string | null }).target_course_id ?? null,
          target_branch_ids: (job as { target_branch_ids?: string[] | null }).target_branch_ids ?? null,
          target_year_id: (job as { target_year_id?: string | null }).target_year_id ?? null,
        }}
      />
    </div>
  );
}

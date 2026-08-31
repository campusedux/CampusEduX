import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Pencil, Users } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { safeCount } from '@/lib/utils';
import { getJob } from '@/lib/jobs/queries';
import { Card, CardHeader, Badge, StatusPill } from '@/components/ui/primitives';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { FlashToast } from '@/components/ui/FlashToast';
import { formatDate } from '@/lib/utils';
import { toggleJobFeatured, deleteJob } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Job · CampusEduX Admin' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="max-w-[62%] text-right font-medium text-ink">{value || '—'}</span>
    </div>
  );
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string; saved?: string };
}) {
  const admin = await requireModule('jobs');
  const supabase = createClient();
  const job = await getJob(params.id);
  if (!job) notFound();

  const applicants = await safeCount(
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('job_id', params.id),
  );

  return (
    <div className="space-y-5">
      {searchParams.created ? <FlashToast title="Job created" /> : null}
      {searchParams.saved ? <FlashToast title="Changes saved" /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/jobs" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={14} /> Jobs
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">{job.title}</h1>
            <StatusPill status={job.status ?? 'open'} />
            {job.is_featured ? <Badge label="Featured" tone="info" /> : null}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {job.company_name || 'Unknown company'} · {job.location || 'No location'} · {job.job_type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/jobs/applications?job=${job.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
          >
            <Users size={14} /> {applicants} applicants
          </Link>
          {admin.perms.jobs.edit ? (
            <Link
              href={`/jobs/${job.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
            >
              <Pencil size={14} /> Edit
            </Link>
          ) : null}
          {admin.perms.jobs.delete ? (
            <DeleteButton action={deleteJob.bind(null, job.id)} confirmMessage={`Delete "${job.title}"?`} label="Delete" redirectTo="/jobs" />
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Description" />
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{job.description || 'No description.'}</p>
          {job.requirements?.length ? (
            <>
              <h4 className="mt-4 text-sm font-semibold text-ink">Requirements</h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-muted">
                {job.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          ) : null}
          {job.skills?.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <Badge key={s} label={s} tone="neutral" />
              ))}
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Details" />
            <Row label="Salary" value={job.salary_range} />
            <Row label="Experience" value={job.experience} />
            <Row label="Posted" value={formatDate(job.posted_at)} />
            <Row label="Updated" value={formatDate(job.updated_at)} />
          </Card>
          <Card>
            <CardHeader title="Homepage" />
            {admin.perms.jobs.edit ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Featured job</span>
                <ToggleSwitch checked={job.is_featured} action={toggleJobFeatured.bind(null, job.id)} />
              </div>
            ) : (
              <Badge label={job.is_featured ? 'Featured' : 'Not featured'} tone={job.is_featured ? 'info' : 'neutral'} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

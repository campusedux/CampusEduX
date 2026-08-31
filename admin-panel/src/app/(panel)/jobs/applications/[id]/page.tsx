import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { getApplication, getApplicationStages, APP_STATUS_LABEL } from '@/lib/jobs/queries';
import { Card, CardHeader, StatusPill, EmptyState } from '@/components/ui/primitives';
import { formatDateTime, initials } from '@/lib/utils';
import { DecisionBar } from './DecisionBar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resume Viewer · CampusEduX Admin' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value || '—'}</span>
    </div>
  );
}

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('jobs');
  const app = await getApplication(params.id);
  if (!app) notFound();
  const stages = await getApplicationStages(params.id);
  const resumeUrl: string | undefined = app.resume?.file_url;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/jobs/applications" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Applications
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand-dark">
            {initials(app.applicant?.full_name)}
          </span>
          <div>
            <h1 className="text-xl font-bold text-ink">{app.applicant?.full_name || 'Unknown applicant'}</h1>
            <p className="text-sm text-ink-muted">
              applied to <span className="font-medium text-ink">{app.job?.title}</span>
              {app.job?.company_name ? ` · ${app.job.company_name}` : ''}
            </p>
          </div>
          <StatusPill status={APP_STATUS_LABEL[app.status] ?? app.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Resume"
              action={
                resumeUrl ? (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
                  >
                    <Download size={14} /> Download
                  </a>
                ) : undefined
              }
            />
            {resumeUrl ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <iframe src={resumeUrl} title="Resume" className="h-[600px] w-full" />
              </div>
            ) : (
              <EmptyState title="No resume attached" description="The applicant applied without uploading a PDF." />
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {admin.perms.jobs.edit ? (
            <Card>
              <CardHeader title="Decision" />
              <DecisionBar id={app.id} current={app.status} />
              {app.rejection_reason ? (
                <p className="mt-3 rounded-lg bg-danger/5 p-2 text-sm text-danger">Reason: {app.rejection_reason}</p>
              ) : null}
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Applicant" />
            <Row label="Email" value={app.applicant?.email} />
            <Row label="Phone" value={app.applicant?.mobile_number} />
            <Row label="Course" value={[app.applicant?.course, app.applicant?.branch].filter(Boolean).join(' · ')} />
            <Row label="Applied" value={formatDateTime(app.created_at)} />
            {app.resume ? <Row label="Resume file" value={app.resume.file_name} /> : null}
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            {stages.length === 0 ? (
              <p className="text-sm text-ink-faint">No stages recorded.</p>
            ) : (
              <ol className="space-y-2">
                {stages.map((s) => (
                  <li key={s.id} className="flex items-start gap-2 text-sm">
                    <FileText size={14} className="mt-0.5 text-ink-faint" />
                    <div>
                      <p className="font-medium text-ink">{s.label}</p>
                      <p className="text-xs text-ink-faint">
                        {s.status}
                        {s.occurred_at ? ` · ${formatDateTime(s.occurred_at)}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

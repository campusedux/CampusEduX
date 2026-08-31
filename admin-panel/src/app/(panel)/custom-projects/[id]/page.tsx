import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { getCustomRequest } from '@/lib/custom-projects/queries';
import { Card, CardHeader, StatusPill, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { formatINR, formatDate, formatDateTime } from '@/lib/utils';
import {
  CUSTOM_STATUS_LABEL,
  PLATFORM_LABEL,
  PROGRESS_BY_STATUS,
  type CustomProjectStatus,
} from '@/lib/custom-projects/constants';
import { StatusControl } from './StatusControl';
import { AdminNotesForm } from './AdminNotesForm';
import { MessageThread } from './MessageThread';
import { saveRequestAdminNotes, replyToRequest } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Custom Project · CampusEduX Admin' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="max-w-[62%] break-words text-right font-medium text-ink">{value || '—'}</span>
    </div>
  );
}

export default async function CustomProjectDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('custom_projects');
  const data = await getCustomRequest(params.id);
  if (!data) notFound();

  const { request: r, features, files, history, delivery, messages, uploadUrls } = data;
  const canEdit = admin.perms.custom_projects.edit;
  const pct = PROGRESS_BY_STATUS[r.status as CustomProjectStatus] ?? 0;
  const reqs: { text: string }[] = Array.isArray(r.custom_requirements) ? r.custom_requirements : [];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/custom-projects" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Custom Projects
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-ink">{r.title}</h1>
          <StatusPill status={r.status} />
        </div>
        <p className="mt-1 font-mono text-sm text-ink-muted">
          {r.request_code} · {formatDateTime(r.created_at)}
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink">{CUSTOM_STATUS_LABEL[r.status as CustomProjectStatus]}</span>
          <span className="text-ink-muted">{pct}% complete</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle">
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Brief" />
            <Row label="Objective" value={r.objective} />
            <Row label="Problem statement" value={r.problem_statement} />
            <Row label="Description" value={r.description} />
            <Row label="Target users" value={r.target_users} />
            <Row label="Technology preference" value={r.technology_preference} />
          </Card>

          <Card>
            <CardHeader
              title="Selected features"
              description={`${features.length} feature${features.length === 1 ? '' : 's'} · frozen at request time`}
            />
            {features.length === 0 ? (
              <p className="text-sm text-ink-muted">No optional features selected.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {features.map((f) => (
                    <tr key={f.feature_id} className="border-b border-border last:border-0">
                      <td className="py-2 text-ink">{f.feature_name}</td>
                      <td className="py-2 text-ink-muted">{f.category}</td>
                      <td className="py-2 text-right font-mono">{formatINR(Number(f.feature_price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {reqs.length > 0 ? (
            <Card>
              <CardHeader title="Custom requirements" />
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
                {reqs.map((x, i) => (
                  <li key={i}>{x.text}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {r.project_image_path || files.length > 0 ? (
            <Card>
              <CardHeader title="Attachments" />
              <div className="space-y-2 text-sm">
                {r.project_image_path ? (
                  <a
                    href={uploadUrls[r.project_image_path] ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-surface-subtle"
                  >
                    <span className="text-ink">Project image</span>
                    <span className="text-brand">Open</span>
                  </a>
                ) : null}
                {files.map((f) => (
                  <a
                    key={f.id}
                    href={uploadUrls[f.storage_path] ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-surface-subtle"
                  >
                    <span className="text-ink">
                      {f.file_name || f.label}{' '}
                      <span className="text-ink-faint">· {Number(f.size_mb).toFixed(2)} MB</span>
                    </span>
                    <span className="text-brand">Open</span>
                  </a>
                ))}
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Delivery"
              action={
                canEdit ? (
                  <Link href={`/custom-projects/${r.id}/delivery`}>
                    <Button variant="secondary" size="sm">
                      <PackageCheck size={14} /> Manage delivery
                    </Button>
                  </Link>
                ) : undefined
              }
            />
            {delivery ? (
              <div className="space-y-1 text-sm">
                <Row label="Demo URL" value={delivery.demo_url} />
                <Row label="Notes" value={delivery.notes} />
                <Row label="Assets" value={`${delivery.assets.length} file${delivery.assets.length === 1 ? '' : 's'}`} />
                <Row label="Delivered at" value={delivery.delivered_at ? formatDateTime(delivery.delivered_at) : '—'} />
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Nothing uploaded yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="History" />
            {history.length === 0 ? (
              <p className="text-sm text-ink-muted">No status changes yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-2">
                    <span className="text-ink-faint">{formatDateTime(h.created_at)}</span>
                    <Badge
                      label={`${h.old_status ? CUSTOM_STATUS_LABEL[h.old_status as CustomProjectStatus] + ' → ' : ''}${
                        CUSTOM_STATUS_LABEL[h.new_status as CustomProjectStatus] ?? h.new_status
                      }`}
                      tone="neutral"
                    />
                    <span className="text-ink-muted">by {h.changed_by_role}</span>
                    {h.note ? <span className="text-ink">— {h.note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Messages" description="Visible to the student. Keep internal notes in the panel on the right." />
            {canEdit ? (
              <MessageThread action={replyToRequest.bind(null, r.id)} messages={messages} />
            ) : (
              <ul className="space-y-2 text-sm">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-lg bg-surface-subtle px-3 py-2">
                    <span className="text-ink-faint">{m.sender_role}: </span>
                    {m.body}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Student" />
            <Row
              label="Name"
              value={
                r.profile ? (
                  <Link href={`/students/${r.profile.id}`} className="text-brand hover:underline">
                    {r.profile.full_name || 'Unknown'}
                  </Link>
                ) : (
                  'Unknown'
                )
              }
            />
            <Row label="Email" value={r.profile?.email} />
            <Row label="Phone" value={r.profile?.mobile_number} />
          </Card>

          <Card>
            <CardHeader title="Configuration" />
            <Row label="Type" value={r.project_type[0].toUpperCase() + r.project_type.slice(1)} />
            <Row label="Level" value={r.project_level} />
            <Row label="Platform" value={PLATFORM_LABEL[r.platform] ?? r.platform} />
            <Row label="Pricing version" value={String(r.pricing_version)} />
          </Card>

          <Card>
            <CardHeader title="Pricing snapshot" />
            <Row label="Base price" value={formatINR(Number(r.base_price))} />
            <Row label="Features" value={formatINR(Number(r.feature_total))} />
            <Row label="Platform charges" value={formatINR(Number(r.platform_charge))} />
            <Row label="Estimated total" value={formatINR(Number(r.estimated_total))} />
            <Row label="Token paid" value={formatINR(Number(r.token_amount))} />
            <Row label="Payment id" value={<span className="font-mono text-xs">{r.payment_id}</span>} />
          </Card>

          <Card>
            <CardHeader title="Status" />
            {canEdit ? (
              <StatusControl id={r.id} current={r.status as CustomProjectStatus} />
            ) : (
              <p className="text-sm text-ink-faint">Read-only for your role.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Internal notes" description="Private — never shown to the student." />
            {canEdit ? (
              <AdminNotesForm action={saveRequestAdminNotes.bind(null, r.id)} initial={r.admin_notes ?? ''} />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-ink-muted">{r.admin_notes || 'No notes.'}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

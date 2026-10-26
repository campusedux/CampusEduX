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
  PAYMENT_STATUS_LABEL,
  ADDON_STATUS_LABEL,
  CREDIT_KIND_LABEL,
  type CreditKind,
  type CustomProjectStatus,
} from '@/lib/custom-projects/constants';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { StatusControl } from './StatusControl';
import { FinalPriceForm } from './FinalPriceForm';
import { AdminNotesForm } from './AdminNotesForm';
import { MessageThread } from './MessageThread';
import { AddonPriceForm, AddonRejectButton, CreditForm, RemoveCreditButton, RequestEditForm } from './ProjectValueForms';
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

  const { request: r, features, files, history, delivery, messages, uploadUrls, amounts, addons, credits, changes } = data;
  const included = features.filter((f) => f.is_included);
  const addOns = features.filter((f) => !f.is_included);
  const canEdit = admin.perms.custom_projects.edit;
  const pct = PROGRESS_BY_STATUS[r.status as CustomProjectStatus] ?? 0;
  const reqs: { text: string }[] = Array.isArray(r.custom_requirements) ? r.custom_requirements : [];
  const mentoring = r.service_scope === 'mentoring';

  return (
    <div className="space-y-5">
      {mentoring && <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-ink">Mentoring only: provide code review, debugging help, architecture guidance and feedback through messages. The student authors assessed deliverables. Do not upload source code, reports, slides or viva answers.</div>}
      <div>
        <Link href="/custom-projects" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Custom Projects
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-ink">{r.title}</h1>
          <StatusPill status={r.status} />
          {amounts ? (
            amounts.paymentStatus === 'paid' ? (
              <Badge label="Paid" tone="success" />
            ) : (
              <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
                {PAYMENT_STATUS_LABEL[amounts.paymentStatus]} · due {formatINR(amounts.due)}
              </span>
            )
          ) : null}
          {amounts && amounts.pendingAddons > 0 ? (
            <Badge label={`${amounts.pendingAddons} add-on${amounts.pendingAddons === 1 ? '' : 's'} to price`} tone="info" />
          ) : null}
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
            <CardHeader
              title="Brief"
              action={
                canEdit ? (
                  <RequestEditForm
                    requestId={r.id}
                    initial={{
                      title: r.title ?? '',
                      objective: r.objective ?? '',
                      problem_statement: r.problem_statement ?? '',
                      description: r.description ?? '',
                      target_users: r.target_users ?? '',
                      technology_preference: r.technology_preference ?? '',
                      custom_requirements: reqs.map((x) => x.text).join('\n'),
                      deadline: r.deadline ?? '',
                    }}
                  />
                ) : undefined
              }
            />
            <Row label="Objective" value={r.objective} />
            <Row label="Problem statement" value={r.problem_statement} />
            <Row label="Description" value={r.description} />
            <Row label="Target users" value={r.target_users} />
            <Row label="Technology preference" value={r.technology_preference} />
            <Row label="Deadline" value={r.deadline ? formatDate(r.deadline) : ''} />
          </Card>

          <Card>
            <CardHeader
              title="Extra features requested by the student"
              description="Separate from the original request. Price one → the student accepts → only accepted prices add to the project value."
            />
            {addons.length === 0 ? (
              <p className="text-sm text-ink-muted">No extra features requested.</p>
            ) : (
              <ul className="divide-y divide-border">
                {addons.map((a) => (
                  <li key={a.id} className="space-y-2 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{a.title}</p>
                        {a.description ? <p className="whitespace-pre-wrap text-ink-muted">{a.description}</p> : null}
                        <p className="text-xs text-ink-faint">Requested {formatDateTime(a.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          label={ADDON_STATUS_LABEL[a.status]}
                          tone={a.status === 'accepted' ? 'success' : a.status === 'rejected' ? 'danger' : a.status === 'priced' ? 'warning' : 'info'}
                        />
                        <span className="font-mono">{a.price != null ? formatINR(Number(a.price)) : '—'}</span>
                      </div>
                    </div>
                    {canEdit && !mentoring && (a.status === 'pending' || a.status === 'priced') ? (
                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <AddonPriceForm
                          addonId={a.id}
                          requestId={r.id}
                          price={a.price != null ? Number(a.price) : null}
                          label={a.status === 'pending' ? 'Set price' : 'Update price'}
                        />
                        <AddonRejectButton addonId={a.id} requestId={r.id} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Included features"
              description={`${included.length} feature${included.length === 1 ? '' : 's'} · free with the ${r.project_level} ${r.project_type} project · frozen at request time`}
            />
            {included.length === 0 ? (
              <p className="text-sm text-ink-muted">No included features recorded for this request.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {included.map((f) => (
                    <tr key={f.feature_id} className="border-b border-border last:border-0">
                      <td className="py-2 text-ink">{f.feature_name}</td>
                      <td className="py-2 text-ink-muted">{f.category}</td>
                      <td className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Included
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Paid add-ons"
              description={`${addOns.length} add-on${addOns.length === 1 ? '' : 's'} · frozen at request time`}
            />
            {addOns.length === 0 ? (
              <p className="text-sm text-ink-muted">No paid add-ons selected.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {addOns.map((f) => (
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
                canEdit && !mentoring ? (
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
                    {h.event === 'price' || h.event === 'payment' ? (
                      <Badge label={h.event === 'price' ? 'Price change' : 'Payment'} tone="neutral" />
                    ) : (
                      <Badge
                        label={`${h.old_status ? CUSTOM_STATUS_LABEL[h.old_status as CustomProjectStatus] + ' → ' : ''}${
                          CUSTOM_STATUS_LABEL[h.new_status as CustomProjectStatus] ?? h.new_status
                        }`}
                        tone="neutral"
                      />
                    )}
                    <span className="text-ink-muted">by {h.changed_by_role}</span>
                    {h.note ? <span className="text-ink">— {h.note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Change history" description="Who changed the request, base value, add-ons or credits, and when." />
            {changes.length === 0 ? (
              <p className="text-sm text-ink-muted">No edits yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {changes.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-start gap-2">
                    <span className="text-ink-faint">{formatDateTime(c.created_at)}</span>
                    <Badge label={`${c.entity} · ${c.action}`} tone={c.actor_role === 'admin' ? 'brand' : 'neutral'} />
                    <span className="text-ink-muted">by {c.actor_role}</span>
                    {c.field ? <span className="font-mono text-xs text-ink">{c.field}</span> : null}
                    <span className="min-w-0 break-words text-xs text-ink-muted">
                      {c.old_value != null ? <>{JSON.stringify(c.old_value).slice(0, 160)} → </> : null}
                      {c.new_value != null ? JSON.stringify(c.new_value).slice(0, 160) : c.old_value != null ? '(removed)' : ''}
                    </span>
                    {c.note ? <span className="text-ink">— {c.note}</span> : null}
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
            <CardHeader title="Payment" description="From custom_project_amounts() — the same figures the student sees." />
            {amounts ? (
              <>
                <Row label="Base value" value={formatINR(amounts.baseValue)} />
                <Row label="Accepted add-ons" value={formatINR(amounts.addonsTotal)} />
                <Row label="Project value" value={formatINR(amounts.projectValue)} />
                <Row label="Paid (Razorpay)" value={formatINR(amounts.paymentsTotal)} />
                <Row label="Credits" value={formatINR(amounts.creditsTotal)} />
                <Row label="Due" value={formatINR(amounts.due)} />
                <Row label="Status" value={PAYMENT_STATUS_LABEL[amounts.paymentStatus]} />
              </>
            ) : (
              <p className="text-sm text-danger">Could not load the payment summary.</p>
            )}
            {admin.perms.custom_projects.edit && amounts && (
              <div className="mt-3 border-t border-border pt-3">
                <FinalPriceForm
                  requestId={r.id}
                  estimatedTotal={Number(r.estimated_total)}
                  finalPrice={r.final_price != null ? Number(r.final_price) : null}
                  locked={amounts.due === 0}
                  minBase={Math.max(0, Math.round((amounts.settledTotal - amounts.addonsTotal) * 100) / 100)}
                />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Credits" description="Offline payments, discounts or adjustments that reduce the due." />
            {credits.length === 0 ? (
              <p className="text-sm text-ink-muted">No credits.</p>
            ) : (
              <ul className="mb-3 divide-y divide-border text-sm">
                {credits.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {formatINR(Number(c.amount))} · {CREDIT_KIND_LABEL[c.kind as CreditKind] ?? c.kind}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {formatDateTime(c.created_at)}
                        {c.note ? ` · ${c.note}` : ''}
                      </p>
                    </div>
                    {canEdit ? <RemoveCreditButton creditId={c.id} requestId={r.id} /> : null}
                  </li>
                ))}
              </ul>
            )}
            {canEdit ? <CreditForm requestId={r.id} /> : null}
          </Card>

          <Card>
            <CardHeader title="Pricing snapshot" description="Frozen when the request was created." />
            <Row label="Base price" value={formatINR(Number(r.base_price))} />
            <Row label="Add-ons" value={formatINR(Number(r.feature_total))} />
            <Row label="Platform charges" value={formatINR(Number(r.platform_charge))} />
            <Row label="Estimated total" value={formatINR(Number(r.estimated_total))} />
            <Row label="Token" value={formatINR(Number(r.token_amount))} />
            <Row label="Payment id" value={<span className="font-mono text-xs">{r.payment_id}</span>} />
          </Card>

          <Card>
            <CardHeader title="Status" />
            <PermissionGate can={{ module: 'custom_projects', action: 'edit' }} mode="disable" block>
              <StatusControl id={r.id} current={r.status as CustomProjectStatus} />
            </PermissionGate>
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

import { safeHref } from "@/lib/safeUrl";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { StatusBadge } from "../../_builder/StatusBadge";
import { TrackingStepper } from "../../_builder/TrackingStepper";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
import {
  CP_DELIVERIES_BUCKET,
  CP_SIGNED_URL_TTL,
  CP_UPLOADS_BUCKET,
  CUSTOM_PROJECT_PROGRESS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  type CustomProjectStatus,
  type Platform,
} from "@/lib/customProjects";
import MessageThread from "./MessageThread";

// Per-user data: never statically rendered or cached across users.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Custom project",
  robots: { index: false, follow: false },
};

type Params = { params: { id: string } };

export default async function Page({ params }: Params) {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: request } = await supabase
    .from("custom_project_requests")
    .select(
      "id,request_code,title,objective,problem_statement,description,target_users,technology_preference,project_type,project_level,platform,custom_requirements,base_price,platform_charge,feature_total,estimated_total,token_amount,status,created_at",
    )
    .eq("id", params.id)
    // RLS lets admins read every row; this keeps the student page owner-only.
    .eq("user_id", user.id)
    .maybeSingle();
  if (!request) notFound();

  const [{ data: features }, { data: files }, { data: history }, { data: delivery }, { data: messages }] = await Promise.all([
    supabase
      .from("custom_project_request_features")
      .select("feature_id,feature_name,feature_price,category")
      .eq("request_id", params.id),
    supabase
      .from("custom_project_request_files")
      .select("id,label,file_name,size_mb,storage_path")
      .eq("request_id", params.id)
      .order("sort_order", { ascending: true }),
    // `note` is admin-facing — never selected here (spec §29).
    supabase
      .from("custom_project_request_history")
      .select("old_status,new_status,created_at")
      .eq("request_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("custom_project_deliveries")
      .select("id,demo_url,notes,delivered_at")
      .eq("request_id", params.id)
      .maybeSingle(),
    supabase
      .from("custom_project_messages")
      .select("id,sender_role,body,created_at")
      .eq("request_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  // Signed URLs for reference files (private uploads bucket) — one batched
  // Storage call for all of them instead of one round-trip per file.
  const fileRows = files ?? [];
  const fileSigned = fileRows.length
    ? (await supabase.storage.from(CP_UPLOADS_BUCKET).createSignedUrls(
        fileRows.map((f) => f.storage_path),
        CP_SIGNED_URL_TTL,
      )).data ?? []
    : [];
  const fileLinks = fileRows.map((f, i) => ({ ...f, url: fileSigned[i]?.signedUrl ?? null }));

  // Delivery assets + signed URLs (only resolvable once status = 'delivered' — RLS).
  let deliveryAssets: { id: string; kind: string; label: string; file_name: string; size_mb: number; url: string | null }[] = [];
  if (delivery) {
    const { data: assets } = await supabase
      .from("custom_project_delivery_assets")
      .select("id,kind,label,file_name,size_mb,storage_path")
      .eq("delivery_id", delivery.id)
      .order("sort_order", { ascending: true });
    const assetRows = assets ?? [];
    const assetSigned = assetRows.length
      ? (await supabase.storage.from(CP_DELIVERIES_BUCKET).createSignedUrls(
          assetRows.map((a) => a.storage_path),
          CP_SIGNED_URL_TTL,
        )).data ?? []
      : [];
    deliveryAssets = assetRows.map((a, i) => ({
      id: a.id,
      kind: a.kind,
      label: a.label,
      file_name: a.file_name,
      size_mb: Number(a.size_mb) || 0,
      url: assetSigned[i]?.signedUrl ?? null,
    }));
  }

  const pct = CUSTOM_PROJECT_PROGRESS[request.status as CustomProjectStatus] ?? 0;
  const customRequirements: { text: string }[] = Array.isArray(request.custom_requirements) ? request.custom_requirements : [];

  const sectionTitle = "font-display text-lg font-bold text-ink";
  const linkCls = "inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-700";

  return (
    <div className="container-prose py-10 sm:py-12">
      <Link href="/custom-projects/my-projects" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All custom projects
      </Link>

      <header className="card mt-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[1.6rem] font-bold leading-tight tracking-tight text-ink sm:text-[1.9rem]">{request.title}</h1>
            <div className="mt-1 text-xs text-ink-muted">
              <span className="font-mono">{request.request_code}</span> · {request.project_type}/{request.project_level} ·{" "}
              {PLATFORM_LABELS[request.platform as Platform] ?? request.platform} · created {timeAgo(request.created_at)}
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>
        <TrackingStepper status={request.status} />
        {request.status !== "cancelled" && (
          <div className="mt-5">
            <div className="flex justify-between text-xs font-medium text-ink-muted">
              <span>Progress</span>
              <span className="tabular-nums text-ink">{pct}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line" aria-hidden>
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </header>

      {/* pricing snapshot */}
      <section className="card mt-5 p-5 text-sm sm:p-6" aria-label="Pricing">
        <dl className="space-y-2 text-ink-muted">
          <div className="flex justify-between"><dt>Base price</dt><dd className="text-ink">{formatINR(request.base_price)}</dd></div>
          <div className="flex justify-between"><dt>Platform charge</dt><dd className="text-ink">{Number(request.platform_charge) > 0 ? formatINR(request.platform_charge) : "Included"}</dd></div>
          <div className="flex justify-between"><dt>Features</dt><dd className="text-ink">{formatINR(request.feature_total)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink"><dt>Estimated total</dt><dd>{formatINR(request.estimated_total)}</dd></div>
          <div className="flex justify-between rounded-xl bg-success/10 px-3 py-2 font-semibold text-success"><dt>Token paid</dt><dd>{formatINR(request.token_amount)}</dd></div>
        </dl>
      </section>

      {/* details */}
      <section className="card mt-5 space-y-4 p-5 text-sm sm:p-6" aria-label="Project details">
        {[
          ["Objective", request.objective],
          ["Problem statement", request.problem_statement],
          ["Description", request.description],
          ["Target users", request.target_users],
          ["Technology preference", request.technology_preference],
        ]
          .filter(([, v]) => v)
          .map(([label, v]) => (
            <div key={label as string}>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
              <p className="mt-1 whitespace-pre-line leading-relaxed text-ink">{v as string}</p>
            </div>
          ))}

        {customRequirements.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Custom requirements</div>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-ink">
              {customRequirements.map((r, i) => (
                <li key={i}>{r.text}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {(features ?? []).length > 0 && (
        <section className="card mt-5 p-5 sm:p-6">
          <h2 className={sectionTitle}>Selected features</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {(features ?? []).map((f) => (
              <li key={f.feature_id} className="flex justify-between gap-3 py-2">
                <span className="text-ink-muted">{f.feature_name}</span>
                <span className="font-medium text-ink">{Number(f.feature_price) > 0 ? formatINR(f.feature_price) : "Included"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {fileLinks.length > 0 && (
        <section className="card mt-5 p-5 sm:p-6">
          <h2 className={sectionTitle}>Reference files</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {fileLinks.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate text-ink-muted">
                  {f.file_name || f.label} <span className="text-xs">({f.size_mb} MB)</span>
                </span>
                {safeHref(f.url) ? (
                  <a href={safeHref(f.url) ?? undefined} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    <Download className="h-3.5 w-3.5" aria-hidden /> Download
                  </a>
                ) : (
                  <span className="text-xs text-ink-muted">unavailable</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* timeline */}
      {(history ?? []).length > 0 && (
        <section className="card mt-5 p-5 sm:p-6">
          <h2 className={sectionTitle}>Status history</h2>
          <ol className="mt-4 space-y-4 border-l-2 border-line pl-5">
            {(history ?? []).map((h, i) => (
              <li key={i} className="relative text-sm">
                <span aria-hidden className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                <p className="text-ink">
                  {h.old_status ? `${STATUS_LABELS[h.old_status as CustomProjectStatus] ?? h.old_status} → ` : ""}
                  <span className="font-semibold">{STATUS_LABELS[h.new_status as CustomProjectStatus] ?? h.new_status}</span>
                </p>
                <p className="text-xs text-ink-faint">{timeAgo(h.created_at)}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* delivery — only visible once status = delivered (RLS) */}
      {delivery && (
        <section className="mt-5 rounded-2xl border border-success/40 bg-success/[0.06] p-5 sm:p-6">
          <h2 className={sectionTitle}>Delivery</h2>
          {delivery.delivered_at && <p className="text-xs text-ink-muted">Delivered {timeAgo(delivery.delivered_at)}</p>}
          {delivery.notes && <p className="mt-2 whitespace-pre-line text-sm text-ink">{delivery.notes}</p>}
          {safeHref(delivery.demo_url) && (
            <p className="mt-3 text-sm">
              <a href={safeHref(delivery.demo_url) ?? undefined} target="_blank" rel="noopener noreferrer" className={linkCls}>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Live demo
              </a>
            </p>
          )}
          {deliveryAssets.length > 0 && (
            <ul className="mt-3 divide-y divide-success/20 text-sm">
              {deliveryAssets.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-ink-muted">
                    {a.label || a.file_name} <span className="text-xs">({a.kind})</span>
                  </span>
                  {safeHref(a.url) ? (
                    <a href={safeHref(a.url) ?? undefined} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      <Download className="h-3.5 w-3.5" aria-hidden /> Download
                    </a>
                  ) : (
                    <span className="text-xs text-ink-muted">unavailable</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* messages */}
      <section className="mt-8">
        <h2 className={sectionTitle}>Messages</h2>
        <MessageThread
          requestId={request.id}
          initialMessages={(messages ?? []).map((m) => ({
            id: m.id,
            senderRole: m.sender_role,
            body: m.body,
            createdAt: m.created_at,
          }))}
        />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "Custom project",
  robots: { index: false, follow: false },
};

type Params = { params: { id: string } };

export default async function Page({ params }: Params) {
  await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: request } = await supabase
    .from("custom_project_requests")
    .select("*")
    .eq("id", params.id)
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

  // Signed URLs for reference files (private uploads bucket).
  const fileLinks = await Promise.all(
    (files ?? []).map(async (f) => {
      const { data } = await supabase.storage.from(CP_UPLOADS_BUCKET).createSignedUrl(f.storage_path, CP_SIGNED_URL_TTL);
      return { ...f, url: data?.signedUrl ?? null };
    }),
  );

  // Delivery assets + signed URLs (only resolvable once status = 'delivered' — RLS).
  let deliveryAssets: { id: string; kind: string; label: string; file_name: string; size_mb: number; url: string | null }[] = [];
  if (delivery) {
    const { data: assets } = await supabase
      .from("custom_project_delivery_assets")
      .select("id,kind,label,file_name,size_mb,storage_path")
      .eq("delivery_id", delivery.id)
      .order("sort_order", { ascending: true });
    deliveryAssets = await Promise.all(
      (assets ?? []).map(async (a) => {
        const { data } = await supabase.storage.from(CP_DELIVERIES_BUCKET).createSignedUrl(a.storage_path, CP_SIGNED_URL_TTL);
        return {
          id: a.id,
          kind: a.kind,
          label: a.label,
          file_name: a.file_name,
          size_mb: Number(a.size_mb) || 0,
          url: data?.signedUrl ?? null,
        };
      }),
    );
  }

  const pct = CUSTOM_PROJECT_PROGRESS[request.status as CustomProjectStatus] ?? 0;
  const customRequirements: { text: string }[] = Array.isArray(request.custom_requirements) ? request.custom_requirements : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/custom-projects/my-projects" className="text-sm text-ink underline">
        ← All custom projects
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">{request.title}</h1>
          <div className="text-xs text-ink-muted">
            {request.request_code} · {request.project_type}/{request.project_level} ·{" "}
            {PLATFORM_LABELS[request.platform as Platform] ?? request.platform} · created {timeAgo(request.created_at)}
          </div>
        </div>
        <span className="whitespace-nowrap rounded-lg border border-line px-2 py-1 text-xs text-ink">
          {STATUS_LABELS[request.status as CustomProjectStatus] ?? request.status}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full rounded-lg bg-primary/10">
        <div className="h-1.5 rounded-lg bg-success" style={{ width: `${pct}%` }} />
      </div>

      {/* pricing snapshot */}
      <div className="mt-6 border border-line bg-white p-5 text-sm">
        <dl className="space-y-1 text-ink-muted">
          <div className="flex justify-between"><dt>Base price</dt><dd className="text-ink">{formatINR(request.base_price)}</dd></div>
          <div className="flex justify-between"><dt>Platform charge</dt><dd className="text-ink">{Number(request.platform_charge) > 0 ? formatINR(request.platform_charge) : "Included"}</dd></div>
          <div className="flex justify-between"><dt>Features</dt><dd className="text-ink">{formatINR(request.feature_total)}</dd></div>
          <div className="flex justify-between border-t border-line pt-1 font-semibold text-ink"><dt>Estimated total</dt><dd>{formatINR(request.estimated_total)}</dd></div>
          <div className="flex justify-between text-ink"><dt className="font-semibold">Token paid</dt><dd className="font-semibold">{formatINR(request.token_amount)}</dd></div>
        </dl>
      </div>

      {/* details */}
      <div className="mt-6 space-y-3 text-sm">
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
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
              <p className="mt-0.5 whitespace-pre-line text-ink">{v as string}</p>
            </div>
          ))}
      </div>

      {customRequirements.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-ink">Custom requirements</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink-muted">
            {customRequirements.map((r, i) => (
              <li key={i}>{r.text}</li>
            ))}
          </ul>
        </div>
      )}

      {(features ?? []).length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-ink">Selected features</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink-muted">
            {(features ?? []).map((f) => (
              <li key={f.feature_id} className="flex justify-between">
                <span>{f.feature_name}</span>
                <span className="text-ink">{Number(f.feature_price) > 0 ? formatINR(f.feature_price) : "Included"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fileLinks.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-ink">Reference files</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {fileLinks.map((f) => (
              <li key={f.id} className="flex justify-between">
                <span className="text-ink-muted">
                  {f.file_name || f.label} <span className="text-xs">({f.size_mb} MB)</span>
                </span>
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-ink underline">
                    Download
                  </a>
                ) : (
                  <span className="text-xs text-ink-muted">unavailable</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* timeline */}
      {(history ?? []).length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-ink">Status history</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink-muted">
            {(history ?? []).map((h, i) => (
              <li key={i}>
                {timeAgo(h.created_at)} —{" "}
                {h.old_status ? `${STATUS_LABELS[h.old_status as CustomProjectStatus] ?? h.old_status} → ` : ""}
                {STATUS_LABELS[h.new_status as CustomProjectStatus] ?? h.new_status}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* delivery — only visible once status = delivered (RLS) */}
      {delivery && (
        <div className="mt-6 border border-success/40 bg-white p-5">
          <h2 className="text-lg font-bold text-ink">Delivery</h2>
          {delivery.delivered_at && <p className="text-xs text-ink-muted">Delivered {timeAgo(delivery.delivered_at)}</p>}
          {delivery.notes && <p className="mt-2 whitespace-pre-line text-sm text-ink">{delivery.notes}</p>}
          {delivery.demo_url && (
            <p className="mt-2 text-sm">
              <a href={delivery.demo_url} target="_blank" rel="noopener noreferrer" className="text-ink underline">
                Live demo
              </a>
            </p>
          )}
          {deliveryAssets.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {deliveryAssets.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span className="text-ink-muted">
                    {a.label || a.file_name} <span className="text-xs">({a.kind})</span>
                  </span>
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-ink underline">
                      Download
                    </a>
                  ) : (
                    <span className="text-xs text-ink-muted">unavailable</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* messages */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-ink">Messages</h2>
        <MessageThread
          requestId={request.id}
          initialMessages={(messages ?? []).map((m) => ({
            id: m.id,
            senderRole: m.sender_role,
            body: m.body,
            createdAt: m.created_at,
          }))}
        />
      </div>
    </div>
  );
}

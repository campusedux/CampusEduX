import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
import { ArrowRight, Boxes, Plus } from "lucide-react";
import { CUSTOM_PROJECT_PROGRESS, type CustomProjectStatus } from "@/lib/customProjects";
import { EmptyState } from "@/components/ui";
import { StatusBadge } from "../_builder/StatusBadge";

// Per-user data: never statically rendered or cached across users.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My custom projects",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const user = await requireUser();
  const supabase = await createAuthedServerSupabase();

  // token_payment_status = paid — a request only exists for real once the
  // Edge Function has verified the token payment (spec §15). RLS scopes this
  // to the signed-in student — but admins can read every row, so the explicit
  // user_id filter is what keeps an admin's own "My projects" list to their own.
  const { data: requests } = await supabase
    .from("custom_project_requests")
    .select("id,request_code,title,project_type,project_level,platform,estimated_total,token_amount,status,created_at")
    .eq("user_id", user.id)
    .eq("token_payment_status", "paid")
    .order("created_at", { ascending: false })
    // This un-paginated list is bounded to the 100 most recent requests so the
    // query can't grow without limit; realistic accounts are far below this.
    .limit(100);

  return (
    <div className="container-prose py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Custom projects</p>
          <h1 className="mt-2 font-display text-[1.9rem] font-bold tracking-tight text-ink">My custom projects</h1>
        </div>
        <Link href="/custom-projects/start" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden /> New request
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Boxes}
          title="No project requests yet"
          subtitle="Tell us what you want built — you'll track every stage of it here."
          action={
            <Link href="/custom-projects/start" className="btn-secondary h-10 text-sm">
              Start a request
            </Link>
          }
        />
      ) : (
        <div className="mt-8 space-y-4">
          {requests.map((r) => {
            const pct = CUSTOM_PROJECT_PROGRESS[r.status as CustomProjectStatus] ?? 0;
            const cancelled = r.status === "cancelled";
            return (
              <Link key={r.id} href={`/custom-projects/my-projects/${r.id}`} className="card card-hover group block p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-lg font-bold text-ink group-hover:text-primary">{r.title}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      <span className="font-mono">{r.request_code}</span> · {r.project_type}/{r.project_level} · {timeAgo(r.created_at)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {!cancelled && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-medium text-ink-muted">
                      <span>Progress</span>
                      <span className="tabular-nums text-ink">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line" aria-hidden>
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-ink-muted">
                  <span>
                    Estimated <span className="font-semibold text-ink">{formatINR(r.estimated_total)}</span> · Token paid{" "}
                    <span className="font-semibold text-ink">{formatINR(r.token_amount)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    View details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

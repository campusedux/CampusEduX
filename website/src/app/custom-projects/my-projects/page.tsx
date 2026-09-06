import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
import {
  CUSTOM_PROJECT_PROGRESS,
  STATUS_LABELS,
  type CustomProjectStatus,
} from "@/lib/customProjects";

export const metadata: Metadata = {
  title: "My custom projects",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  // token_payment_status = paid — a request only exists for real once the
  // Edge Function has verified the token payment (spec §15). RLS already
  // scopes this to the signed-in student.
  const { data: requests } = await supabase
    .from("custom_project_requests")
    .select("id,request_code,title,project_type,project_level,platform,estimated_total,token_amount,status,created_at")
    .eq("token_payment_status", "paid")
    .order("created_at", { ascending: false });

  return (
    <div className="container-prose py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">My custom projects</h1>
        <Link
          href="/custom-projects/start"
          className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-primary hover:text-white"
        >
          New request
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="empty-state mt-8">
          You haven&apos;t submitted a custom project request yet.{" "}
          <Link href="/custom-projects/start" className="text-ink underline">
            Start one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {requests.map((r) => {
            const pct = CUSTOM_PROJECT_PROGRESS[r.status as CustomProjectStatus] ?? 0;
            return (
              <Link
                key={r.id}
                href={`/custom-projects/my-projects/${r.id}`}
                className="block border border-line bg-white p-5 hover:border-line"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-ink">{r.title}</div>
                    <div className="text-xs text-ink-muted">
                      {r.request_code} · {r.project_type}/{r.project_level} · {timeAgo(r.created_at)}
                    </div>
                  </div>
                  <span className="whitespace-nowrap rounded-lg border border-line px-2 py-1 text-xs text-ink">
                    {STATUS_LABELS[r.status as CustomProjectStatus] ?? r.status}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-lg bg-primary/10">
                  <div className="h-1.5 rounded-lg bg-success" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs text-ink-muted">
                  <span>Estimated {formatINR(r.estimated_total)}</span>
                  <span>Token paid {formatINR(r.token_amount)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

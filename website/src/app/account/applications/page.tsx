import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { timeAgo } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  in_review: "In review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
};

export default async function ApplicationsPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: applications } = await supabase
    .from("applications")
    .select("id,status,created_at,job:jobs(id,title,company_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Your applications</h1>
      {!applications || applications.length === 0 ? (
        <div className="empty-state mt-6">No applications yet. <Link href="/jobs" className="text-navy underline">Browse open roles</Link>.</div>
      ) : (
        <div className="mt-6 divide-y divide-navy/10 border-t border-navy/10">
          {applications.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between py-4">
              <div>
                <Link href={`/jobs/${a.job?.id}`} className="font-serif text-navy hover:text-marigold">{a.job?.title}</Link>
                <div className="text-xs text-slate">{a.job?.company_name} · Applied {timeAgo(a.created_at)}</div>
              </div>
              <span className="rounded-sm border border-navy/20 px-2 py-1 text-xs text-navy">{STATUS_LABEL[a.status] ?? a.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

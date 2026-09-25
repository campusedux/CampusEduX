import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { timeAgo } from "@/lib/format";
import { Badge, EmptyState, Button } from "@/components/ui";
import { Briefcase } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";

const STATUS_TONE: Record<string, "primary" | "success" | "danger" | "neutral"> = {
  in_review: "primary",
  shortlisted: "success",
  hired: "success",
  rejected: "danger",
};
const STATUS_LABEL: Record<string, string> = {
  in_review: "In review",
  shortlisted: "Shortlisted",
  rejected: "Not selected",
  hired: "Hired",
};

export default async function ApplicationsPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: applications } = await supabase
    .from("applications")
    .select("id,status,created_at,job:jobs(id,title,company_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    // This un-paginated list is bounded to the 100 most recent applications so
    // the query can't grow without limit; realistic accounts are far below this.
    .limit(100);

  return (
    <div>
      <AccountPageHeader title="Your applications" description="Jobs you've applied to through CampusEduX, with their latest status." />
      {!applications || applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          action={<Button href="/jobs" size="sm">Browse open roles</Button>}
        />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {applications.map((a) => {
            const job = Array.isArray(a.job) ? a.job[0] : a.job;
            return (
              <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-4">
                <div className="min-w-0">
                  <Link href={`/jobs/${job?.id}`} className="font-semibold text-ink hover:text-primary">
                    {job?.title}
                  </Link>
                  <div className="text-xs text-ink-faint">
                    {job?.company_name} · Applied {timeAgo(a.created_at)}
                  </div>
                </div>
                <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>{STATUS_LABEL[a.status] ?? a.status}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

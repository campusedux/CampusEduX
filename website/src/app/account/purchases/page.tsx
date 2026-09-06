import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
import { Badge, EmptyState, Button } from "@/components/ui";

export default async function PurchasesPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: purchases } = await supabase
    .from("purchases")
    .select("id,status,total_amount,created_at,project:projects(id,title,thumbnail_url,category_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    // This un-paginated list is bounded to the 100 most recent purchases so the
    // query can't grow without limit; realistic accounts are far below this.
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Your purchases</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Source code and documentation for a purchased project download from the CampusEduX app, tied to this account.
      </p>
      {!purchases || purchases.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No purchases yet"
          action={<Button href="/projects" size="sm">Browse the marketplace</Button>}
        />
      ) : (
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
          {purchases.map((p) => {
            const project = Array.isArray(p.project) ? p.project[0] : p.project;
            return (
              <div key={p.id} className="flex items-center gap-4 px-4 py-4">
                <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-primary-50">
                  {project?.thumbnail_url && (
                    <Image src={project.thumbnail_url} alt={project.title} fill className="object-cover" sizes="80px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/projects/${project?.id}`} className="font-semibold text-ink hover:text-primary">
                    {project?.title}
                  </Link>
                  <div className="text-xs text-ink-faint">
                    {project?.category_name} · {timeAgo(p.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink">{formatINR(p.total_amount)}</div>
                  <Badge tone={p.status === "success" ? "success" : p.status === "failed" ? "danger" : "neutral"}>
                    {p.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

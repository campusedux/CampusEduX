import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";

export default async function PurchasesPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: purchases } = await supabase
    .from("purchases")
    .select("id,status,total_amount,created_at,project:projects(id,title,thumbnail_url,category_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Your purchases</h1>
      {!purchases || purchases.length === 0 ? (
        <div className="empty-state mt-6">You haven&apos;t purchased any projects yet. <Link href="/projects" className="text-navy underline">Browse the marketplace</Link>.</div>
      ) : (
        <div className="mt-6 divide-y divide-navy/10 border-t border-navy/10">
          {purchases.map((p: any) => (
            <div key={p.id} className="flex items-center gap-4 py-4">
              <div className="relative h-14 w-20 flex-shrink-0 bg-navy/5">
                {p.project?.thumbnail_url && <Image src={p.project.thumbnail_url} alt={p.project.title} fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <Link href={`/projects/${p.project?.id}`} className="font-serif text-navy hover:text-marigold">{p.project?.title}</Link>
                <div className="text-xs text-slate">{p.project?.category_name} · {timeAgo(p.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-navy">{formatINR(p.total_amount)}</div>
                <div className={`text-xs ${p.status === "success" ? "text-emerald" : p.status === "failed" ? "text-red-700" : "text-slate"}`}>{p.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { getOptionalUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { EmptyState, Button, Pagination, PageHeader } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import { PRACTICE_LANGUAGE_LABEL } from "@/lib/practice.types";

export const metadata: Metadata = {
  title: "Submissions",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 25;

const VERDICT_LABEL: Record<string, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  compile_error: "Compile Error",
  runtime_error: "Runtime Error",
  time_limit_exceeded: "Time Limit Exceeded",
  error: "Error",
};
const VERDICT_CLASS: Record<string, string> = {
  accepted: "bg-emerald-50 text-emerald-700",
  wrong_answer: "bg-red-50 text-red-700",
  compile_error: "bg-red-50 text-red-700",
  runtime_error: "bg-red-50 text-red-700",
  time_limit_exceeded: "bg-amber-50 text-amber-700",
  error: "bg-surface text-ink-muted",
};

function formatMemory(kb: number | null): string {
  if (!kb || kb <= 0) return "—";
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

interface SubmissionRow {
  id: string;
  problem_slug: string;
  language: string;
  verdict: string;
  passed: number;
  total: number;
  runtime_ms: number | null;
  memory_kb: number | null;
  created_at: string;
}

export default async function PracticeSubmissionsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await getOptionalUser();

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="page-shell">
      <PageHeader eyebrow="Practice" title="Submissions" />
      <div className="mt-8">{children}</div>
    </div>
  );

  if (!user) {
    return (
      <Shell>
        <EmptyState
          icon={History}
          title="Sign in to see your submissions"
          subtitle="Every solution you submit from a practice problem is saved here — with its verdict, language, run time and tests passed."
          action={
            <Button href={`/login?next=${encodeURIComponent("/practice/submissions")}`} size="sm">
              Sign in
            </Button>
          }
        />
      </Shell>
    );
  }

  const pageNum = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (pageNum - 1) * PAGE_SIZE;

  const supabase = createAuthedServerSupabase();
  const { data, count } = await supabase
    .from("coding_submissions")
    .select("id,problem_slug,language,verdict,passed,total,runtime_ms,memory_kb,created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const rows = (data ?? []) as SubmissionRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  if (rows.length === 0) {
    return (
      <Shell>
        <EmptyState
          icon={History}
          title="No submissions yet"
          subtitle="Open a practice problem, write a solution and press Submit — it will show up here."
          action={
            <Button href="/practice/problems" size="sm">
              Browse problems
            </Button>
          }
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-3 font-semibold">Problem</th>
              <th className="px-4 py-3 font-semibold">Language</th>
              <th className="px-4 py-3 font-semibold">Verdict</th>
              <th className="px-4 py-3 font-semibold">Tests</th>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Memory</th>
              <th className="px-4 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface/60">
                <td className="px-4 py-3">
                  <Link href={`/practice/problems/${r.problem_slug}`} className="font-medium text-ink hover:text-primary">
                    {r.problem_slug}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">{PRACTICE_LANGUAGE_LABEL[r.language] ?? r.language}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                      VERDICT_CLASS[r.verdict] ?? "bg-surface text-ink-muted"
                    }`}
                  >
                    {VERDICT_LABEL[r.verdict] ?? r.verdict}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {r.passed}/{r.total}
                </td>
                <td className="px-4 py-3 text-ink-muted">{r.runtime_ms ? `${r.runtime_ms} ms` : "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{formatMemory(r.memory_kb)}</td>
                <td className="px-4 py-3 text-ink-faint">{timeAgo(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={pageNum} totalPages={totalPages} basePath="/practice/submissions" />
    </Shell>
  );
}

import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { timeAgo } from "@/lib/format";
import { Badge, EmptyState, Button } from "@/components/ui";
import Link from "next/link";

export default async function AccountResumePage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const [{ data: resumes }, { data: downloads }] = await Promise.all([
    supabase.from("resumes_builder").select("id,title,template,ats_score,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("resume_downloads").select("id,resume_title,downloaded_at").eq("user_id", user.id).order("downloaded_at", { ascending: false }).limit(10),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Your resumes</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Edit any resume here or in the CampusEduX app — both stay in sync automatically.
      </p>

      {!resumes || resumes.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No resumes created yet"
          action={<Button href="/resume/templates" size="sm">See templates</Button>}
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {resumes.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-ink">{r.title}</div>
                {typeof r.ats_score === "number" && <Badge tone={r.ats_score >= 70 ? "success" : "neutral"}>ATS {r.ats_score}</Badge>}
              </div>
              <div className="mt-1 text-xs text-ink-faint">Template: {r.template} · updated {timeAgo(r.updated_at)}</div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Link href={`/account/resume/${r.id}/edit`} className="text-xs font-semibold text-primary hover:underline">
                  Edit resume
                </Link>
                <Link href={`/account/resume/${r.id}/projects`} className="text-xs font-semibold text-primary hover:underline">
                  + Add a project
                </Link>
                <a href={`/api/resume/export/pdf?resumeId=${r.id}`} className="text-xs font-semibold text-primary hover:underline">
                  Download PDF
                </a>
                <a href={`/api/resume/export/docx?resumeId=${r.id}`} className="text-xs font-semibold text-primary hover:underline">
                  Download DOCX
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-lg font-bold text-ink">Download history</h2>
      {!downloads || downloads.length === 0 ? (
        <EmptyState className="mt-3" title="No downloads yet" />
      ) : (
        <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
          {downloads.map((d) => (
            <div key={d.id} className="flex justify-between px-4 py-3 text-sm">
              <span className="text-ink">{d.resume_title}</span>
              <span className="text-ink-faint">{timeAgo(d.downloaded_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

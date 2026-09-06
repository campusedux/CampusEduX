import Link from "next/link";
import { Badge, EmptyState, Button } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import ResumeCardActions from "./ResumeCardActions";

export interface DashboardResume {
  id: string;
  title: string;
  templateLabel: string;
  atsScore: number;
  updatedAt: string;
  completion: number;
  versions: number;
  downloads: number;
  isDemo: boolean;
}

/** "My résumés" grid + download history — shared by the /resume hub. */
export function ResumeDashboard({
  resumes,
  downloads,
}: {
  resumes: DashboardResume[];
  downloads: { id: string; resume_title: string; downloaded_at: string }[];
}) {
  return (
    <div>
      {resumes.length === 0 ? (
        <EmptyState
          className="mt-2"
          title="No résumés yet"
          subtitle="Pick a template to start with a complete demo résumé you can edit, or upload one you already have."
          action={
            <Button href="/resume/templates" size="sm">
              Choose a template
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {resumes.map((r) => (
            <div key={r.id} className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink">{r.title}</span>
                    {r.isDemo && <Badge tone="premium">Demo</Badge>}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-faint">
                    {r.templateLabel} · updated {timeAgo(r.updatedAt)}
                  </div>
                </div>
                <Link href={`/account/resume/${r.id}/ats`}>
                  <Badge tone={r.atsScore >= 70 ? "success" : "neutral"}>ATS {r.atsScore}</Badge>
                </Link>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Completion</span>
                  <span className="tabular-nums">{r.completion}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${r.completion}%` }} />
                </div>
              </div>

              <div className="mt-2 flex gap-3 text-xs text-ink-faint">
                <span>v{r.versions}</span>
                <span>
                  {r.downloads} download{r.downloads === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
                <Link href={`/account/resume/${r.id}/edit`} className="text-xs font-semibold text-primary hover:underline">
                  Edit
                </Link>
                <Link href={`/account/resume/${r.id}/preview`} className="text-xs font-semibold text-primary hover:underline">
                  Preview
                </Link>
                <Link href={`/account/resume/${r.id}/ats`} className="text-xs font-semibold text-primary hover:underline">
                  ATS check
                </Link>
                <Link href={`/account/resume/${r.id}/jd-match`} className="text-xs font-semibold text-primary hover:underline">
                  Job match
                </Link>
                <a href={`/api/resume/export/pdf?resumeId=${r.id}`} className="text-xs font-semibold text-primary hover:underline">
                  Download
                </a>
                <ResumeCardActions resumeId={r.id} title={r.title} />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-lg font-bold text-ink">Download history</h2>
      {downloads.length === 0 ? (
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

export default ResumeDashboard;

import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { listResumeVersionsAction } from "@/lib/actions/resumeBuilder";
import { EmptyState } from "@/components/ui";
import VersionHistory from "./VersionHistory";

export default async function ResumeVersionsPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: resume } = await supabase.from("resumes_builder").select("id, title").eq("id", params.id).eq("user_id", user.id).maybeSingle();
  if (!resume) notFound();

  const versions = await listResumeVersionsAction(resume.id);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-[1.6rem] font-bold tracking-tight text-ink">Version history — &ldquo;{resume.title}&rdquo;</h1>
      <p className="mt-1 text-sm text-ink-muted">
        A checkpoint is saved automatically before every download, and whenever you save one manually below. Restoring a
        version snapshots your current content first, so restoring is itself undoable.
      </p>

      {"error" in versions ? (
        <EmptyState className="mt-6" title="Couldn't load version history" subtitle={versions.error} />
      ) : (
        <VersionHistory resumeId={resume.id} initialVersions={versions} />
      )}
    </div>
  );
}

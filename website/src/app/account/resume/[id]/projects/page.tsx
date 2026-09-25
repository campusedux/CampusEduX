import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { listMyResumeProjectCandidatesAction } from "@/lib/actions/resumeBuilder";
import { EmptyState } from "@/components/ui";
import ProjectPicker from "./ProjectPicker";

export default async function ResumeAddProjectPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: resume } = await supabase
    .from("resumes_builder")
    .select("id, title")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!resume) notFound();

  const projects = await listMyResumeProjectCandidatesAction();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-[1.6rem] font-bold tracking-tight text-ink">Add a project to &ldquo;{resume.title}&rdquo;</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Only finished Custom Project Builder requests (ready or delivered) can be added — this never replaces what&apos;s
        already in your Projects section, it only adds to it.
      </p>

      {"error" in projects ? (
        <EmptyState className="mt-6" title="Couldn't load your projects" subtitle={projects.error} />
      ) : projects.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No finished projects yet"
          subtitle="Once a Custom Project Builder request is marked ready or delivered, it shows up here."
        />
      ) : (
        <ProjectPicker resumeId={resume.id} projects={projects} />
      )}
    </div>
  );
}

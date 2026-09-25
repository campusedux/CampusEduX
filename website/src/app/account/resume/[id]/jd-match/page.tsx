import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import JdMatchPanel from "./JdMatchPanel";

export default async function ResumeJdMatchPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: resume } = await supabase.from("resumes_builder").select("id, title").eq("id", params.id).eq("user_id", user.id).maybeSingle();
  if (!resume) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-[1.6rem] font-bold tracking-tight text-ink">Check &ldquo;{resume.title}&rdquo; against a job description</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Paste the job description below. This compares real keyword overlap — it won&apos;t suggest keyword-stuffing your
        resume, just tells you what&apos;s genuinely missing.
      </p>

      <JdMatchPanel resumeId={resume.id} />
    </div>
  );
}

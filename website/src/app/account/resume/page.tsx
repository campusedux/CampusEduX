import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { timeAgo } from "@/lib/format";

export default async function AccountResumePage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const [{ data: resumes }, { data: downloads }] = await Promise.all([
    supabase.from("resumes_builder").select("id,title,template,ats_score,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("resume_downloads").select("id,resume_title,downloaded_at").eq("user_id", user.id).order("downloaded_at", { ascending: false }).limit(10),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Your resumes</h1>
      <p className="mt-1 text-sm text-slate">Full editing (sections, templates, PDF export) happens in the CampusEduX app — this is a read-only overview of what&apos;s saved to your account.</p>

      {(!resumes || resumes.length === 0) ? (
        <div className="empty-state mt-6">No resumes created yet.</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {resumes.map((r: any) => (
            <div key={r.id} className="border border-navy/10 bg-white p-4">
              <div className="font-serif text-navy">{r.title}</div>
              <div className="mt-1 text-xs text-slate">Template: {r.template} · ATS score: {r.ats_score}</div>
              <div className="mt-1 text-xs text-slate">Updated {timeAgo(r.updated_at)}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 font-serif text-lg text-navy">Download history</h2>
      {(!downloads || downloads.length === 0) ? (
        <div className="empty-state mt-3">No downloads yet.</div>
      ) : (
        <div className="mt-3 divide-y divide-navy/10 border-t border-navy/10">
          {downloads.map((d: any) => (
            <div key={d.id} className="flex justify-between py-3 text-sm">
              <span className="text-navy">{d.resume_title}</span>
              <span className="text-slate">{timeAgo(d.downloaded_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getPublicSupabase } from "@/lib/supabase/server";
import { mapResumeRow } from "@/lib/resumeBuilder/types";
import ResumeEditor from "./ResumeEditor";

export default async function ResumeEditPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: row } = await supabase
    .from("resumes_builder")
    .select("id, title, template, personal_details, education, skills, sections, ats_score, layout, updated_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) notFound();

  const publicSupabase = getPublicSupabase();
  const { data: templateRows } = publicSupabase
    ? await publicSupabase.from("resume_templates").select("id, name, accent_color").order("sort_order", { ascending: true })
    : { data: null };

  const templates = (templateRows ?? []).map((t) => ({ id: t.id, name: t.name, accentColor: t.accent_color }));

  const { data: shareRows } = await supabase
    .from("resume_shares")
    .select("id, token, is_active, view_count, created_at")
    .eq("resume_id", params.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const shares = (shareRows ?? []).map((s) => ({
    id: s.id,
    token: s.token,
    isActive: s.is_active,
    viewCount: s.view_count,
    createdAt: s.created_at,
  }));

  return (
    <div className="container-page py-10">
      <ResumeEditor resume={mapResumeRow(row)} templates={templates} shares={shares} />
    </div>
  );
}

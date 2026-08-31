import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const [{ data: courses }, { data: branches }, { data: years }] = await Promise.all([
    supabase.from("courses").select("id,name").eq("status", "active").order("sort_order"),
    supabase.from("branches").select("id,name,course_id").eq("status", "active").order("sort_order"),
    supabase.from("academic_years").select("id,label").eq("status", "active").order("sort_order"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Profile</h1>
      <div className="mt-6 max-w-lg">
        <ProfileForm
          initial={user}
          catalog={{
            courses: courses ?? [],
            branches: branches ?? [],
            years: (years ?? []).map((y) => y.label),
          }}
        />
      </div>
    </div>
  );
}

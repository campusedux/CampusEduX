import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import NotificationRow from "./NotificationRow";

export default async function NotificationsPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data } = await supabase
    .from("notifications")
    .select("id,title,body,category,is_read,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Notifications</h1>
      {(!data || data.length === 0) ? (
        <div className="empty-state mt-6">No notifications yet.</div>
      ) : (
        <div className="mt-6 divide-y divide-navy/10 border-t border-navy/10">
          {data.map((n) => <NotificationRow key={n.id} notification={n as any} />)}
        </div>
      )}
    </div>
  );
}

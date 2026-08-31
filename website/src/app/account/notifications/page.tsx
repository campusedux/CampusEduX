import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import NotificationRow from "./NotificationRow";
import { EmptyState } from "@/components/ui";

export default async function NotificationsPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data } = await supabase
    .from("notifications")
    .select("id,title,body,category,is_read,created_at,image_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Notifications</h1>
      {(!data || data.length === 0) ? (
        <EmptyState className="mt-6" title="No notifications yet" />
      ) : (
        <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {data.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}

import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import NotificationRow from "./NotificationRow";
import { EmptyState } from "@/components/ui";
import { Bell } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";

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
      <AccountPageHeader title="Notifications" />
      {(!data || data.length === 0) ? (
        <EmptyState icon={Bell} title="No notifications yet" subtitle="Updates about your applications, purchases and account show up here." />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {data.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}

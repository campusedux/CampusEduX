"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { timeAgo } from "@/lib/format";

type Notification = { id: string; title: string; body: string; category: string; is_read: boolean; created_at: string };

export default function NotificationRow({ notification }: { notification: Notification }) {
  const [isRead, setIsRead] = useState(notification.is_read);

  async function markRead() {
    if (isRead) return;
    setIsRead(true);
    await createBrowserSupabase().from("notifications").update({ is_read: true }).eq("id", notification.id);
  }

  return (
    <div onClick={markRead} className={`cursor-pointer py-4 ${isRead ? "" : "bg-marigold/5"}`}>
      <div className="flex items-center justify-between">
        <div className="font-serif text-navy">{notification.title}</div>
        <span className="text-xs text-slate">{timeAgo(notification.created_at)}</span>
      </div>
      <p className="mt-1 text-sm text-slate">{notification.body}</p>
    </div>
  );
}

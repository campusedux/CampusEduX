"use client";

import { useState } from "react";
import Image from "next/image";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { timeAgo } from "@/lib/format";

type Notification = {
  id: string;
  title: string;
  body: string;
  category: string;
  is_read: boolean;
  created_at: string;
  image_url?: string | null;
};

export default function NotificationRow({ notification }: { notification: Notification }) {
  const [isRead, setIsRead] = useState(notification.is_read);

  async function markRead() {
    if (isRead) return;
    setIsRead(true);
    try {
      const { error } = await createBrowserSupabase().from("notifications").update({ is_read: true }).eq("id", notification.id);
      if (error) setIsRead(false);
    } catch {
      setIsRead(false);
    }
  }

  return (
    <button
      type="button"
      onClick={markRead}
      className={`flex w-full gap-3 px-4 py-4 text-left ${isRead ? "" : "bg-primary-50/60"}`}
    >
      {notification.image_url && (
        <span className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-surface">
          <Image src={notification.image_url} alt="" fill className="object-cover" sizes="56px" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold text-ink">{notification.title}</span>
          <span className="flex-shrink-0 text-xs text-ink-faint">{timeAgo(notification.created_at)}</span>
        </span>
        {notification.body && <span className="mt-1 block text-sm text-ink-muted">{notification.body}</span>}
      </span>
      {!isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" aria-hidden />}
    </button>
  );
}

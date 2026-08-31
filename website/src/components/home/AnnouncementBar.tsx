"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { inWindow } from "@/lib/home";

interface Announcement {
  id: string;
  title: string;
  body: string;
}

const DISMISS_KEY = "cex_announcement_dismissed";

/**
 * Site-wide announcement strip driven by the `announcements` table
 * (status='active', within its date window). Dismissable per browser session.
 * Renders nothing when there is no active announcement.
 */
export function AnnouncementBar() {
  const [item, setItem] = useState<Announcement | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createBrowserSupabase();
      const { data } = await supabase
        .from("announcements")
        .select("id,title,body,status,starts_at,ends_at")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(5);
      if (!active || !data) return;
      const now = Date.now();
      const first = data.find((a) => inWindow(a.starts_at, a.ends_at, now));
      if (!first) return;
      let dismissed: string | null = null;
      try {
        dismissed = sessionStorage.getItem(DISMISS_KEY);
      } catch {
        /* storage blocked — show it */
      }
      if (dismissed === first.id) return;
      setItem({ id: first.id, title: first.title, body: first.body });
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!item) return null;

  return (
    <div className="border-b border-primary-100 bg-primary-50">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm sm:px-6">
        <Megaphone className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-primary-900">
          <span className="font-semibold">{item.title}</span>
          {item.body ? <span className="text-primary-800"> — {item.body}</span> : null}
        </p>
        <button
          type="button"
          aria-label="Dismiss announcement"
          className="flex-shrink-0 rounded-md p-1 text-primary/70 hover:bg-primary-100"
          onClick={() => {
            try {
              sessionStorage.setItem(DISMISS_KEY, item.id);
            } catch {
              /* ignore */
            }
            setItem(null);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default AnnouncementBar;

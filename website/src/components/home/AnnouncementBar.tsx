"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

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
 *
 * The active-announcement lookup (status + date window) runs server-side in
 * `/api/announcements` — an anon, CDN-cacheable endpoint — so this island no
 * longer needs a browser Supabase client.
 */
export function AnnouncementBar() {
  const [item, setItem] = useState<Announcement | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/announcements");
        if (!active || !res.ok) return;
        const { announcement } = (await res.json()) as { announcement: Announcement | null };
        if (!active || !announcement) return;
        let dismissed: string | null = null;
        try {
          dismissed = sessionStorage.getItem(DISMISS_KEY);
        } catch {
          /* storage blocked — show it */
        }
        if (dismissed === announcement.id) return;
        setItem(announcement);
      } catch {
        /* offline / network error — no bar (same as no active announcement) */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!item) return null;

  return (
    <div className="border-b border-primary-100 bg-primary-50">
      <div className="container-page flex items-center gap-3 py-2 text-sm">
        <Megaphone className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-primary-900">
          <span className="font-semibold">{item.title}</span>
          {item.body ? <span className="text-primary-800"> — {item.body}</span> : null}
        </p>
        <button
          type="button"
          aria-label="Dismiss announcement"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md p-1 text-primary/70 hover:bg-primary-100"
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { SectionHeader } from "@/components/ui";

interface Note {
  id: string;
  title: string;
  category: string | null;
  topic: string | null;
}

/**
 * "Learning" section — published `prep_notes`. The `prep_notes` SELECT policy is
 * `to authenticated`, so this only populates for signed-in students today; P5's
 * public-catalog migration opens published notes to anon and this becomes
 * visible to everyone. Renders nothing when there is no data (spec: no empty
 * sections).
 */
export function HomeLearning() {
  const [notes, setNotes] = useState<Note[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createBrowserSupabase();
      const { data } = await supabase
        .from("prep_notes")
        .select("id,title,category,topic")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (active && data) setNotes(data as Note[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!notes || notes.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeader title="Learning" viewAllHref="/placement/notes" viewAllLabel="All notes" />
      <div className="grid gap-3 sm:grid-cols-2">
        {notes.map((n) => (
          <Link
            key={n.id}
            href={`/placement/notes/${n.id}`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg"
          >
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
              <FileText className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{n.title}</span>
              <span className="block truncate text-xs text-ink-faint">
                {n.category}
                {n.topic ? ` • ${n.topic}` : ""}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeLearning;

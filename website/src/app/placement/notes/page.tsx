import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import { SearchBar, EmptyState, Chip } from "@/components/ui";
import { NoteCard, type NoteCardData } from "@/components/placement/NoteCard";
import { NOTE_CATEGORIES, noteCategory } from "@/lib/placement";

export const revalidate = 120;
export const metadata: Metadata = {
  title: "Study Notes",
  description: "Placement preparation study notes — aptitude, DSA, HR, coding, technical interview and company prep.",
};

type SP = { q?: string; category?: string };

export default async function NotesPage({ searchParams }: { searchParams: SP }) {
  const supabase = getPublicSupabase();
  const category = noteCategory(searchParams.category);
  const q = searchParams.q?.trim();

  let notes: NoteCardData[] = [];
  if (supabase) {
    let query = supabase
      .from("prep_notes")
      .select("id,title,category,topic,is_premium")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(60);
    if (category) query = query.eq("category", category);
    if (q) query = query.or(`title.ilike.%${q}%,topic.ilike.%${q}%`);
    const { data } = await query;
    notes = (data ?? []) as NoteCardData[];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Study Notes</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Placement preparation notes published by the CampusEduX team. Bookmark the ones you want to revisit — bookmarks
        sync with the app.
      </p>

      <div className="mt-6 max-w-xl">
        <SearchBar
          action="/placement/notes"
          defaultValue={q}
          placeholder="Search notes…"
          hiddenParams={category ? { category } : undefined}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Chip href="/placement/notes" active={!category}>
          All
        </Chip>
        {NOTE_CATEGORIES.map((c) => (
          <Chip key={c} href={`/placement/notes?category=${encodeURIComponent(c)}`} active={category === c}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="mt-8">
        {notes.length === 0 ? (
          <EmptyState
            title={category || q ? "No notes match this filter" : "No notes published yet"}
            subtitle={
              category || q
                ? "Try another category or clear the search."
                : "Study notes appear here once published from the admin panel."
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

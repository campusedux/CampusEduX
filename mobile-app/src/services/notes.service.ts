import { supabase } from "@/lib/supabase";
import { rankByAcademicRelevance, type AcademicProfile } from "@/lib/personalization";
import type { NoteCategory, NoteFilter, PrepNote } from "@/types";
import { SAMPLE_NOTES } from "@/data/sampleNotesContent";

function mapNoteRow(row: any, bookmarkedIds: Set<string>): PrepNote {
  return {
    id: row.id,
    title: row.title ?? "",
    content: row.content ?? "",
    category: (row.category ?? "General Placement") as NoteCategory,
    topic: row.topic ?? "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    fileUrl: row.file_url ?? null,
    thumbnailUrl: row.thumbnail_url ?? null,
    isPremium: row.is_premium ?? false,
    isPublished: row.is_published ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    isBookmarked: bookmarkedIds.has(row.id),
  };
}

function applyClientFilter(notes: PrepNote[], filter: NoteFilter): PrepNote[] {
  let out = notes;
  if (filter.category && filter.category !== "All") {
    out = out.filter((n) => n.category === filter.category);
  }
  if (filter.bookmarkedOnly) {
    out = out.filter((n) => n.isBookmarked);
  }
  const q = filter.search?.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.topic.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return out;
}

export const notesService = {
  async listNotes(
    userId: string,
    filter: NoteFilter = {},
    academic?: AcademicProfile
  ): Promise<PrepNote[]> {
    try {
      const [notesRes, bookmarksRes] = await Promise.all([
        (() => {
          let query = supabase
            .from("prep_notes")
            .select("*")
            .eq("is_published", true)
            .order("created_at", { ascending: false });
          if (filter.category && filter.category !== "All") {
            query = query.eq("category", filter.category);
          }
          const q = filter.search?.trim();
          if (q) {
            // title / topic substring, plus tag array contains the term
            query = query.or(
              `title.ilike.%${q}%,topic.ilike.%${q}%,tags.cs.{${q}}`
            );
          }
          return query;
        })(),
        supabase.from("prep_note_bookmarks").select("note_id").eq("user_id", userId),
      ]);

      if (notesRes.error) throw new Error(notesRes.error.message);

      const bookmarkedIds = new Set<string>(
        (bookmarksRes.data ?? []).map((r: any) => r.note_id)
      );
      // Prioritise material that matches the student's course / branch / year,
      // keeping general notes available as the fallback (spec §26, §27).
      const ordered = academic
        ? rankByAcademicRelevance(notesRes.data ?? [], academic)
        : notesRes.data ?? [];
      const notes = ordered.map((row: any) => mapNoteRow(row, bookmarkedIds));
      return filter.bookmarkedOnly ? notes.filter((n) => n.isBookmarked) : notes;
    } catch (error) {
      console.info(`[notes.service] listNotes: using sample content (${(error as Error).message})`);
      return applyClientFilter(SAMPLE_NOTES, filter);
    }
  },

  async getNote(noteId: string, userId: string): Promise<PrepNote> {
    try {
      const [noteRes, bookmarkRes] = await Promise.all([
        supabase.from("prep_notes").select("*").eq("id", noteId).single(),
        supabase
          .from("prep_note_bookmarks")
          .select("note_id")
          .eq("user_id", userId)
          .eq("note_id", noteId)
          .maybeSingle(),
      ]);
      if (noteRes.error) throw new Error(noteRes.error.message);
      const set = new Set<string>(bookmarkRes.data ? [noteId] : []);
      return mapNoteRow(noteRes.data, set);
    } catch (error) {
      const sample = SAMPLE_NOTES.find((n) => n.id === noteId);
      if (sample) return sample;
      throw error instanceof Error ? error : new Error("Note not found.");
    }
  },

  async setBookmark(
    userId: string,
    noteId: string,
    shouldBookmark: boolean
  ): Promise<void> {
    if (shouldBookmark) {
      const { error } = await supabase
        .from("prep_note_bookmarks")
        .upsert({ user_id: userId, note_id: noteId }, { onConflict: "user_id,note_id" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("prep_note_bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("note_id", noteId);
      if (error) throw new Error(error.message);
    }
  },
};

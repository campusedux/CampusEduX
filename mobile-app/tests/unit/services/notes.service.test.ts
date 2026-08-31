jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { notesService } from "@/services/notes.service";
import { resetSupabaseMock, setTableResult, supabase } from "../../mocks/supabase.mock";
import { SAMPLE_NOTES } from "@/data/sampleNotesContent";

beforeEach(() => resetSupabaseMock());

const noteRow = {
  id: "n-1",
  title: "Big-O cheat sheet",
  content: "…",
  category: "DSA",
  topic: "Complexity",
  tags: ["arrays", "sorting"],
  is_premium: false,
  is_published: true,
  created_at: "2025-06-01T00:00:00.000Z",
};

describe("notesService.listNotes", () => {
  it("marks a note bookmarked when the join table has a row for the user", async () => {
    setTableResult("prep_notes", { data: [noteRow, { ...noteRow, id: "n-2", title: "Recursion" }] });
    setTableResult("prep_note_bookmarks", { data: [{ note_id: "n-2" }] });

    const notes = await notesService.listNotes("u-1");

    expect(notes.map((n) => n.id)).toEqual(["n-1", "n-2"]);
    expect(notes.find((n) => n.id === "n-2")?.isBookmarked).toBe(true);
    expect(notes.find((n) => n.id === "n-1")?.isBookmarked).toBe(false);
  });

  it("filters to bookmarked notes only when asked", async () => {
    setTableResult("prep_notes", { data: [noteRow, { ...noteRow, id: "n-2" }] });
    setTableResult("prep_note_bookmarks", { data: [{ note_id: "n-2" }] });

    const notes = await notesService.listNotes("u-1", { bookmarkedOnly: true });

    expect(notes.map((n) => n.id)).toEqual(["n-2"]);
  });

  it("falls back to sample notes (client-filtered) when the query fails", async () => {
    setTableResult("prep_notes", { error: { message: "relation \"prep_notes\" does not exist" } });

    const notes = await notesService.listNotes("u-1", { category: "DSA" });

    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((n) => n.category === "DSA")).toBe(true);
    expect(notes.length).toBe(SAMPLE_NOTES.filter((n) => n.category === "DSA").length);
  });
});

describe("notesService.getNote", () => {
  it("returns the mapped note with its bookmark state", async () => {
    setTableResult("prep_notes", { data: [noteRow] });
    setTableResult("prep_note_bookmarks", { data: { note_id: "n-1" } });

    const note = await notesService.getNote("n-1", "u-1");

    expect(note.title).toBe("Big-O cheat sheet");
    expect(note.isBookmarked).toBe(true);
  });

  it("falls back to a matching sample note when the query fails", async () => {
    const sampleId = SAMPLE_NOTES[0].id;
    setTableResult("prep_notes", { error: { message: "no table" } });

    const note = await notesService.getNote(sampleId, "u-1");

    expect(note.id).toBe(sampleId);
  });

  it("re-throws when the query fails and there is no matching sample note", async () => {
    setTableResult("prep_notes", { error: { message: "boom" } });

    await expect(notesService.getNote("not-a-sample-id", "u-1")).rejects.toThrow("boom");
  });
});

describe("notesService.setBookmark", () => {
  it("upserts the bookmark when adding", async () => {
    setTableResult("prep_note_bookmarks", { data: null });

    await notesService.setBookmark("u-1", "n-1", true);

    expect(supabase.from).toHaveBeenCalledWith("prep_note_bookmarks");
  });

  it("throws when the upsert fails", async () => {
    setTableResult("prep_note_bookmarks", { error: { message: "rls" } });
    await expect(notesService.setBookmark("u-1", "n-1", true)).rejects.toThrow("rls");
  });

  it("throws when the delete fails", async () => {
    setTableResult("prep_note_bookmarks", { error: { message: "rls" } });
    await expect(notesService.setBookmark("u-1", "n-1", false)).rejects.toThrow("rls");
  });
});

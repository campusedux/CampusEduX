import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import { getPublicSupabase } from "@/lib/supabase/server";
import { Badge, TagPill, SectionHeader } from "@/components/ui";
import { NoteCard, type NoteCardData } from "@/components/placement/NoteCard";
import BookmarkButton from "./BookmarkButton";

export const revalidate = 300;

const getNote = cache(async (id: string) => {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data: note } = await supabase
    .from("prep_notes")
    .select("id,title,content,category,topic,tags,file_url,is_premium,is_published,created_at")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  if (!note) return { note: null, related: [] as NoteCardData[] };

  const { data: related } = await supabase
    .from("prep_notes")
    .select("id,title,category,topic,is_premium")
    .eq("is_published", true)
    .eq("category", note.category)
    .neq("id", id)
    .limit(4);

  return { note, related: (related ?? []) as NoteCardData[] };
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await getNote(params.id);
  if (!result?.note) return { title: "Note not found" };
  const { note } = result;
  return {
    title: note.title,
    description: (note.content || `${note.category} study note`).slice(0, 155),
  };
}

export default async function NoteDetailPage({ params }: { params: { id: string } }) {
  const result = await getNote(params.id);
  if (!result?.note) notFound();
  const { note, related } = result;
  const tags: string[] = Array.isArray(note.tags) ? note.tags : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/placement/notes" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All notes
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {note.category && <Badge tone="neutral">{note.category}</Badge>}
        {note.is_premium && <Badge tone="premium">Premium</Badge>}
      </div>
      <h1 className="mt-2 text-3xl font-bold text-ink">{note.title}</h1>
      {note.topic ? <p className="mt-1 text-ink-muted">{note.topic}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <BookmarkButton noteId={note.id} />
        {note.file_url && (
          <Link href={note.file_url} target="_blank" rel="noopener noreferrer" className="btn-ghost h-11 px-4 text-sm">
            <Download className="h-4 w-4" aria-hidden />
            Download attachment
          </Link>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <TagPill key={t}>{t}</TagPill>
          ))}
        </div>
      )}

      {/* Plain-text render — never dangerouslySetInnerHTML of admin content. */}
      <article className="mt-8 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-muted">
        {note.content || "This note has no written content — check the attachment above."}
      </article>

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeader title={`More in ${note.category}`} viewAllHref={`/placement/notes?category=${encodeURIComponent(note.category)}`} viewAllLabel="See all" />
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((n) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

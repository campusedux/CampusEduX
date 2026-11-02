import { permanentRedirect } from "next/navigation";
import { resolveLegacyNotePath } from "@/lib/learning";

export const revalidate = 300;

/**
 * Old per-note URL. "Study Notes" was merged into the single Learning system
 * (migration 0043/020 stamps `learning_topics.source_prep_note_id`), so this
 * resolves the legacy `prep_notes` id to its canonical
 * `/learning/<grid>/<topic>` page — or `/learning` when the note has no
 * published Learning topic yet.
 */
export default async function LegacyNoteRedirect({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  permanentRedirect(await resolveLegacyNotePath(params.id));
}

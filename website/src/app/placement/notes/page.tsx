import { permanentRedirect } from "next/navigation";

// Force dynamic rendering: statically caching this single-page redirect has
// been observed in production serving a stale 308 with no Location header
// (the sibling dynamic route /placement/notes/[id] never showed this).
export const dynamic = "force-dynamic";

/**
 * "Study Notes" was merged into the single Learning system (Grids → Sections →
 * Topics → Content). This route only 308s old links to /learning.
 * See migration 0043/020.
 */
export default function NotesIndexRedirect() {
  permanentRedirect("/learning");
}

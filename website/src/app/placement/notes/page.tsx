import { permanentRedirect } from "next/navigation";

/**
 * "Study Notes" was merged into the single Learning system (Grids → Sections →
 * Topics → Content). This route only 308s old links to /learning.
 * See migration 0043/020.
 */
export default function NotesIndexRedirect() {
  permanentRedirect("/learning");
}

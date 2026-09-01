import { permanentRedirect } from "next/navigation";

/**
 * Placement / Placement Prep / Placement Preparation are consolidated into the
 * single user-facing "Learning" system (Grid → Topic → Content, plus the
 * Aptitude / DSA / Mock Test / HR Interview / Company Specific grids). This
 * route only 308s legacy links to /learning.
 */
export default function PlacementRedirect() {
  permanentRedirect("/learning");
}

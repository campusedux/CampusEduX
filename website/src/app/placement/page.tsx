import { permanentRedirect } from "next/navigation";

/**
 * Placement / Placement Prep / Placement Preparation are consolidated into the
 * single user-facing "Learning" system (Grid → Section → Topic → Content). This
 * route only 308s legacy links to /learning.
 */
export default function PlacementRedirect() {
  permanentRedirect("/learning");
}

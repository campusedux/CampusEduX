import { LegalDocView } from "@/legal/LegalDocView";
import { legalMetadata } from "@/legal/seo";

export const metadata = legalMetadata("cookie-policy");

export default function Page() {
  // Website-only document — the mobile app has no cookies, so no "shown in the app" note.
  return <LegalDocView docId="cookie-policy" appNote={false} />;
}

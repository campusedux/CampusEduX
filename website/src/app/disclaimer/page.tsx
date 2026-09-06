import { LegalDocView } from "@/legal/LegalDocView";
import { legalMetadata } from "@/legal/seo";

export const metadata = legalMetadata("disclaimer");

export default function Page() {
  return <LegalDocView docId="disclaimer" />;
}

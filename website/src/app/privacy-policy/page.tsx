import { LegalDocView } from "@/legal/LegalDocView";
import { legalMetadata } from "@/legal/seo";

export const metadata = legalMetadata("privacy-policy");

export default function Page() {
  return <LegalDocView docId="privacy-policy" />;
}

import { LegalDocView } from "@/legal/LegalDocView";
import { legalMetadata } from "@/legal/seo";

export const metadata = legalMetadata("community-guidelines");

export default function Page() {
  return <LegalDocView docId="community-guidelines" />;
}

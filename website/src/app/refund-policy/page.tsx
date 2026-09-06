import { LegalDocView } from "@/legal/LegalDocView";
import { legalMetadata } from "@/legal/seo";

export const metadata = legalMetadata("refund-policy");

export default function Page() {
  return <LegalDocView docId="refund-policy" />;
}

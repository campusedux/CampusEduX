import { LegalDocView } from "@/legal/LegalDocView";
import { legalMetadata } from "@/legal/seo";

export const metadata = legalMetadata("terms");

export default function Page() {
  return <LegalDocView docId="terms" />;
}

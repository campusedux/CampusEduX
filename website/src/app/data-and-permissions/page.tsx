import { LegalDocView } from "@/legal/LegalDocView";
import { legalMetadata } from "@/legal/seo";

export const metadata = legalMetadata("data-and-permissions");

export default function Page() {
  return <LegalDocView docId="data-and-permissions" />;
}

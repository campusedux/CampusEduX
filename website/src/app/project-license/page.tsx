import { LegalDocView } from "@/legal/LegalDocView";
import { legalMetadata } from "@/legal/seo";

export const metadata = legalMetadata("project-license");

export default function Page() {
  return <LegalDocView docId="project-license" />;
}

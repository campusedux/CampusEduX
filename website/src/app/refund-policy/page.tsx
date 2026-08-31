import CmsLegalPage from "@/components/CmsLegalPage";
export const metadata = { title: "Refund Policy" };
export default function Page() {
  return <CmsLegalPage cmsKey="refund_policy" fallbackTitle="Refund Policy" />;
}

import CmsLegalPage from "@/components/CmsLegalPage";
export const metadata = { title: "Terms & Conditions" };
export default function Page() {
  return <CmsLegalPage cmsKey="terms" fallbackTitle="Terms & Conditions" />;
}

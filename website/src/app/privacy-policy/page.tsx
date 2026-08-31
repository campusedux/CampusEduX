import CmsLegalPage from "@/components/CmsLegalPage";
export const metadata = { title: "Privacy Policy" };
export default function Page() {
  return <CmsLegalPage cmsKey="privacy" fallbackTitle="Privacy Policy" />;
}

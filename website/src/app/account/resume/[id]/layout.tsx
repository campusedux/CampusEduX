import { ResumeSteps, ResumeStepFooter } from "./ResumeSteps";

/**
 * Shared frame for every per-résumé page: step indicator on top, Back / Next
 * at the bottom. Navigation only — no data is read here, and each page keeps
 * its own fetching and auth check.
 */
export default async function ResumeStepLayout({ children, params: paramsPromise }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  return (
    <div>
      <ResumeSteps resumeId={params.id} />
      {children}
      <ResumeStepFooter resumeId={params.id} />
    </div>
  );
}

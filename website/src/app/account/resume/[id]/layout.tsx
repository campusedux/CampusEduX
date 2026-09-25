import { ResumeSteps, ResumeStepFooter } from "./ResumeSteps";

/**
 * Shared frame for every per-résumé page: step indicator on top, Back / Next
 * at the bottom. Navigation only — no data is read here, and each page keeps
 * its own fetching and auth check.
 */
export default function ResumeStepLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  return (
    <div>
      <ResumeSteps resumeId={params.id} />
      {children}
      <ResumeStepFooter resumeId={params.id} />
    </div>
  );
}

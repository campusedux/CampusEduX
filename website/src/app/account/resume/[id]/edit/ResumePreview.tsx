import { buildResumeRenderModel } from "@/lib/resumeBuilder/renderModel";
import { templateSpec } from "@/lib/resumeBuilder/templateSpecs";
import { resolveDesign, effectiveAccent } from "@/lib/resumeBuilder/design";
import type { ResumeContent } from "@/lib/resumeBuilder/content";
import type { ResumeDesign, ResumePersonalDetails } from "@/lib/resumeBuilder/types";
import { ResumeDocumentView } from "@/components/resumeBuilder/ResumeDocumentView";
import { ResumeSheetScaler } from "@/components/resumeBuilder/ResumeSheetScaler";

/**
 * Live A4 preview — the same <ResumeDocumentView> the share page, the gallery
 * and the PDF/DOCX exports render from (via buildResumeRenderModel +
 * resolveDesign), so what you see here is what downloads.
 */
export default function ResumePreview({
  personalDetails,
  content,
  template,
  accentColor,
  design,
}: {
  personalDetails: ResumePersonalDetails;
  content: ResumeContent;
  template: string;
  accentColor: string;
  design: ResumeDesign;
}) {
  const model = buildResumeRenderModel({ personalDetails, content });
  const spec = resolveDesign(templateSpec(template), design);

  return (
    <ResumeSheetScaler>
      <ResumeDocumentView model={model} spec={spec} accentColor={effectiveAccent(accentColor, design)} />
    </ResumeSheetScaler>
  );
}

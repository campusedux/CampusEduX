"use client";

import { memo, useMemo } from "react";
import { buildResumeRenderModel } from "@/lib/resumeBuilder/renderModel";
import { templateSpec } from "@/lib/resumeBuilder/templateSpecs";
import { resolveDesign, effectiveAccent } from "@/lib/resumeBuilder/design";
import type { ResumeContent } from "@/lib/resumeBuilder/content";
import type { ResumeDesign, ResumePersonalDetails } from "@/lib/resumeBuilder/types";
import { ResumeDocumentView } from "@/components/resumeBuilder/ResumeDocumentView";
import { ResumeSheetScaler } from "@/components/resumeBuilder/ResumeSheetScaler";

// Pure renderer — skip the whole document subtree when the memoised model /
// spec / accent haven't changed (i.e. during useDeferredValue's catch-up).
const MemoResumeDocumentView = memo(ResumeDocumentView);

/**
 * Live A4 preview — the same <ResumeDocumentView> the share page, the gallery
 * and the PDF/DOCX exports render from (via buildResumeRenderModel +
 * resolveDesign), so what you see here is what downloads.
 *
 * The editor feeds this deferred copies of `content` / `personalDetails`
 * (useDeferredValue), so between a keystroke and the preview catching up the
 * props are referentially stable — memoising the model here lets the memo'd
 * <ResumeDocumentView> skip re-rendering the whole document tree.
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
  const model = useMemo(
    () => buildResumeRenderModel({ personalDetails, content }),
    [personalDetails, content],
  );
  const spec = useMemo(() => resolveDesign(templateSpec(template), design), [template, design]);
  const accent = useMemo(() => effectiveAccent(accentColor, design), [accentColor, design]);

  return (
    <ResumeSheetScaler>
      <MemoResumeDocumentView model={model} spec={spec} accentColor={accent} />
    </ResumeSheetScaler>
  );
}

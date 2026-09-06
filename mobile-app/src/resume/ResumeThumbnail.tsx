import React, { useState } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { ResumeDocument, A4_WIDTH } from "@/resume/ResumeDocument";
import { buildResumeRenderModel } from "@/services/resumeContent";
import type { ResolvedTemplate } from "@/services/resumeTemplateSpecs";
import type { ResumeContent, ResumePersonalDetails } from "@/types";

/** Full A4 portrait proportions (210mm × 297mm) — the default preview window. */
export const A4_ASPECT = 210 / 297;

/**
 * A real miniature render of a résumé in this template — the actual
 * <ResumeDocument> scaled to the container width and clipped to a controlled
 * aspect-ratio window. Structural mirror of the website's <ResumeThumbnail>.
 *
 * The document is pinned to the window's TOP-LEFT and scaled from there
 * (`transformOrigin: "top left"`), so the header is always visible and any
 * content past the window's bottom edge is cleanly clipped by `overflow:
 * "hidden"` — it can never bleed down into the card footer. The window sizes
 * itself from `aspectRatio` alone; callers must NOT wrap it in a fixed-height
 * box (that is what used to cause the footer overlap).
 */
export function ResumeThumbnail({
  template,
  personalDetails,
  content,
  aspectRatio = A4_ASPECT,
  style,
}: {
  template: ResolvedTemplate;
  personalDetails: ResumePersonalDetails;
  content: ResumeContent;
  /** width ÷ height of the preview window. Default = a full A4 page. */
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [w, setW] = useState(0);
  const scale = w > 0 ? w / A4_WIDTH : 0;
  const model = buildResumeRenderModel({ personalDetails, content });

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[{ width: "100%", aspectRatio, overflow: "hidden", backgroundColor: "#fff" }, style]}
    >
      {scale > 0 && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: A4_WIDTH,
            transform: [{ scale }],
            transformOrigin: "top left",
          }}
          pointerEvents="none"
        >
          <ResumeDocument model={model} spec={template} accentColor={template.accentColor} />
        </View>
      )}
    </View>
  );
}

export default ResumeThumbnail;

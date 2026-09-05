"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui";
import { updateResumeFreeformSectionAction } from "@/lib/actions/resumeBuilder";
import { FREEFORM_PLACEHOLDERS, type ResumeFreeformSectionKey } from "@/lib/resumeBuilder/types";
import { SECTION_LABELS } from "@/lib/resumeBuilder/sections";
import { useAutosaveField, type SaveStatus } from "./useAutosaveField";

export default function FreeformSectionEditor({
  resumeId,
  sectionKey,
  initial,
  currentSections,
  onChange,
  onStatusChange,
}: {
  resumeId: string;
  sectionKey: ResumeFreeformSectionKey;
  initial: string;
  currentSections: Record<string, string>;
  onChange: (content: string) => void;
  onStatusChange: (status: SaveStatus) => void;
}) {
  const [content, setContent] = useState(initial);

  useAutosaveField(content, (value) => updateResumeFreeformSectionAction(resumeId, sectionKey, value, currentSections), onStatusChange);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-ink">{SECTION_LABELS[sectionKey]}</h2>
      <Textarea
        rows={12}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={FREEFORM_PLACEHOLDERS[sectionKey]}
      />
    </div>
  );
}

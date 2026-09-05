"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui";
import { updateResumeFreeformSectionAction } from "@/lib/actions/resumeBuilder";
import { FREEFORM_PLACEHOLDERS, type ResumeFreeformSectionKey } from "@/lib/resumeBuilder/types";
import { SECTION_LABELS } from "@/lib/resumeBuilder/sections";
import type { AssistSection } from "@/lib/resumeBuilder/aiAssist";
import ResumeAIAssistPanel, { type AssistQuickAction } from "@/components/resumeBuilder/ResumeAIAssistPanel";
import { useAutosaveField, type SaveStatus } from "./useAutosaveField";

const QUICK_ACTIONS: Partial<Record<ResumeFreeformSectionKey, AssistQuickAction[]>> = {
  summary: [
    { label: "Generate", instruction: "Generate a professional summary from the rest of my resume content." },
    { label: "Improve", instruction: "Improve this summary — sharper phrasing, same facts." },
    { label: "Shorten", instruction: "Shorten this summary to 2-3 sentences without losing the key points." },
    { label: "Make ATS-friendly", instruction: "Rewrite this to use clearer, more standard ATS-friendly phrasing." },
  ],
  experience: [
    { label: "Improve bullets", instruction: "Improve these bullet points — stronger action verbs, achievement-focused." },
    { label: "Add measurable impact", instruction: "Suggest where measurable impact could be added to these bullets, without inventing specific numbers." },
    { label: "Improve action verbs", instruction: "Replace weak or repeated verbs at the start of each bullet with stronger action verbs." },
  ],
  projects: [
    { label: "Generate description", instruction: "Generate a resume-ready project description from this content." },
    { label: "Improve description", instruction: "Improve this project description — clearer, more impact-focused." },
    { label: "Suggest technologies", instruction: "Based on what's described, suggest technologies that might be relevant to mention (clearly marked as suggestions)." },
  ],
};

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

  const quickActions = QUICK_ACTIONS[sectionKey];

  function handleAccept(newText: string) {
    setContent(newText);
    onChange(newText);
  }

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
      {quickActions && (
        <ResumeAIAssistPanel
          resumeId={resumeId}
          section={sectionKey as AssistSection}
          currentText={content}
          quickActions={quickActions}
          onAccept={handleAccept}
        />
      )}
    </div>
  );
}

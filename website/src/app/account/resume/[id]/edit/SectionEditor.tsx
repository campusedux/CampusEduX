"use client";

import { Eye, EyeOff } from "lucide-react";
import { Input, Textarea } from "@/components/ui";
import type { ResumeSectionBlock } from "@/lib/resumeBuilder/content";
import EntryListEditor from "./EntryListEditor";
import TagGroupsEditor from "./TagGroupsEditor";
import LinkListEditor from "./LinkListEditor";
import ResumeAIAssistPanel, { type AssistQuickAction } from "@/components/resumeBuilder/ResumeAIAssistPanel";
import type { AssistSection } from "@/lib/resumeBuilder/aiAssist";

const TEXT_PLACEHOLDERS: Record<string, string> = {
  summary: "A short 2–3 sentence pitch: who you are, your strongest skills, what you're looking for.",
  objective: "One or two sentences on the role you want and what you bring to it.",
  achievements: "One achievement per line — quantify where you can.\ne.g. Winner, Smart India Hackathon 2025 (1,200+ teams)",
  references: "Available on request.",
  custom: "Write this section's content. One point per line.",
};

const TEXT_AI: Partial<Record<string, { section: AssistSection; actions: AssistQuickAction[] }>> = {
  summary: {
    section: "summary",
    actions: [
      { label: "Generate", instruction: "Generate a professional summary from the rest of my resume content." },
      { label: "Improve", instruction: "Improve this summary — sharper phrasing, same facts." },
      { label: "Shorten", instruction: "Shorten this summary to 2–3 sentences without losing the key points." },
      { label: "Make ATS-friendly", instruction: "Rewrite this to use clearer, more standard ATS-friendly phrasing." },
    ],
  },
};

export default function SectionEditor({
  block,
  resumeId,
  onChange,
  onToggleHide,
}: {
  block: ResumeSectionBlock;
  resumeId: string;
  onChange: (patch: Partial<ResumeSectionBlock>) => void;
  onToggleHide: () => void;
}) {
  const ai = block.variant === "text" ? TEXT_AI[block.type] : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
          aria-label="Section heading"
          className="max-w-xs text-lg font-bold"
        />
        <button
          type="button"
          onClick={onToggleHide}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface"
        >
          {block.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {block.hidden ? "Hidden — click to show" : "Visible"}
        </button>
      </div>

      {block.variant === "text" && (
        <div className="space-y-2">
          <Textarea
            rows={10}
            value={block.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={TEXT_PLACEHOLDERS[block.type] ?? TEXT_PLACEHOLDERS.custom}
          />
          {ai && (
            <ResumeAIAssistPanel
              resumeId={resumeId}
              section={ai.section}
              currentText={block.text ?? ""}
              quickActions={ai.actions}
              onAccept={(text) => onChange({ text })}
            />
          )}
        </div>
      )}

      {block.variant === "entries" && (
        <EntryListEditor
          entries={block.entries ?? []}
          sectionType={block.type}
          resumeId={resumeId}
          onChange={(entries) => onChange({ entries })}
        />
      )}

      {block.variant === "tags" && (
        <TagGroupsEditor groups={block.groups ?? []} sectionType={block.type} resumeId={resumeId} onChange={(groups) => onChange({ groups })} />
      )}

      {block.variant === "links" && <LinkListEditor links={block.links ?? []} onChange={(links) => onChange({ links })} />}
    </div>
  );
}

"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui";
import { emptyGroup, type ResumeTagGroup, type SectionType } from "@/lib/resumeBuilder/content";
import { TagInput } from "./TagInput";
import ResumeAIAssistPanel from "@/components/resumeBuilder/ResumeAIAssistPanel";

const SKILLS_AI = [{ label: "Suggest skills", instruction: "Suggest additional technical and soft skills based on my resume content." }];

/**
 * Named tag groups. Skills use several ("Technical", "Soft", "Tools", …);
 * interests / languages typically use one unlabelled group.
 */
export default function TagGroupsEditor({
  groups,
  sectionType,
  resumeId,
  onChange,
}: {
  groups: ResumeTagGroup[];
  sectionType: SectionType;
  resumeId: string;
  onChange: (groups: ResumeTagGroup[]) => void;
}) {
  const list = groups.length > 0 ? groups : [emptyGroup(sectionType === "skills" ? "Technical" : "")];
  const showLabels = sectionType === "skills";

  function patch(id: string, changes: Partial<ResumeTagGroup>) {
    onChange(list.map((g) => (g.id === id ? { ...g, ...changes } : g)));
  }

  return (
    <div className="space-y-5">
      {list.map((group) => (
        <div key={group.id} className="rounded-2xl border border-line p-4">
          <div className="mb-2 flex items-center gap-2">
            {showLabels ? (
              <Input value={group.label} onChange={(e) => patch(group.id, { label: e.target.value })} placeholder="Group name (e.g. Tools)" className="max-w-[220px]" />
            ) : (
              <span className="text-sm font-medium text-ink">Items</span>
            )}
            {list.length > 1 && (
              <button type="button" aria-label="Remove group" onClick={() => onChange(list.filter((g) => g.id !== group.id))} className="ml-auto rounded p-1 text-ink-faint hover:text-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <TagInput tags={group.items} onChange={(items) => patch(group.id, { items })} />
        </div>
      ))}

      {showLabels && (
        <button type="button" onClick={() => onChange([...list, emptyGroup("")])} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <Plus className="h-4 w-4" /> Add group
        </button>
      )}

      {sectionType === "skills" && (
        <ResumeAIAssistPanel
          resumeId={resumeId}
          section="skills"
          currentText={list.flatMap((g) => g.items).join(", ")}
          quickActions={SKILLS_AI}
          onAccept={(text) => {
            const suggested = text
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s && !list.some((g) => g.items.includes(s)));
            if (suggested.length === 0) return;
            const first = list[0] ?? emptyGroup("Technical");
            onChange([{ ...first, items: [...first.items, ...suggested] }, ...list.slice(1)]);
          }}
        />
      )}
    </div>
  );
}

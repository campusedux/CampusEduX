"use client";

import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui";
import { emptyEntry, makeId, type ResumeEntry, type SectionType } from "@/lib/resumeBuilder/content";
import { TagInput } from "./TagInput";
import ResumeAIAssistPanel, { type AssistQuickAction } from "@/components/resumeBuilder/ResumeAIAssistPanel";
import type { AssistSection } from "@/lib/resumeBuilder/aiAssist";

/** Per-type wording so "Work Experience" and "Education" read naturally with the same underlying fields. */
const FIELD_LABELS: Partial<Record<SectionType, { title: string; subtitle: string; showDates: boolean; showGrade: boolean }>> = {
  experience: { title: "Role / title", subtitle: "Company", showDates: true, showGrade: false },
  internships: { title: "Role / title", subtitle: "Company", showDates: true, showGrade: false },
  education: { title: "Degree / qualification", subtitle: "Institution", showDates: true, showGrade: true },
  projects: { title: "Project name", subtitle: "Tech / role", showDates: false, showGrade: false },
  certifications: { title: "Certification", subtitle: "Issuer", showDates: true, showGrade: false },
  awards: { title: "Award", subtitle: "Awarded by", showDates: true, showGrade: false },
  publications: { title: "Title", subtitle: "Publisher / venue", showDates: true, showGrade: false },
  research: { title: "Title", subtitle: "Lab / advisor", showDates: true, showGrade: false },
  volunteer: { title: "Role", subtitle: "Organisation", showDates: true, showGrade: false },
  leadership: { title: "Role", subtitle: "Organisation", showDates: true, showGrade: false },
};

const DEFAULT_LABELS = { title: "Title", subtitle: "Subtitle", showDates: true, showGrade: false };

const AI_ACTIONS: AssistQuickAction[] = [
  { label: "Improve bullets", instruction: "Improve these bullet points — stronger action verbs, achievement-focused." },
  { label: "Add measurable impact", instruction: "Suggest where measurable impact could be added, without inventing specific numbers." },
];

export default function EntryListEditor({
  entries,
  sectionType,
  resumeId,
  onChange,
}: {
  entries: ResumeEntry[];
  sectionType: SectionType;
  resumeId: string;
  onChange: (entries: ResumeEntry[]) => void;
}) {
  const labels = FIELD_LABELS[sectionType] ?? DEFAULT_LABELS;
  const aiSection: AssistSection | null = sectionType === "experience" || sectionType === "internships" ? "experience" : sectionType === "projects" ? "projects" : null;

  const list = entries.length > 0 ? entries : [emptyEntry()];

  function patch(id: string, changes: Partial<ResumeEntry>) {
    onChange(list.map((e) => (e.id === id ? { ...e, ...changes } : e)));
  }
  function add() {
    onChange([...list, emptyEntry()]);
  }
  function remove(id: string) {
    const next = list.filter((e) => e.id !== id);
    onChange(next.length > 0 ? next : [emptyEntry()]);
  }
  function duplicate(id: string) {
    const i = list.findIndex((e) => e.id === id);
    if (i === -1) return;
    const copy = { ...list[i], id: makeId("ent") };
    onChange([...list.slice(0, i + 1), copy, ...list.slice(i + 1)]);
  }
  function move(id: string, dir: "up" | "down") {
    const i = list.findIndex((e) => e.id === id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i === -1 || j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {list.map((entry, index) => (
        <div key={entry.id} className="rounded-2xl border border-line p-4">
          <div className="mb-2 flex items-center justify-end gap-1">
            <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(entry.id, "up")} className="rounded p-1 text-ink-faint hover:bg-surface hover:text-ink disabled:opacity-30">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Move down" disabled={index === list.length - 1} onClick={() => move(entry.id, "down")} className="rounded p-1 text-ink-faint hover:bg-surface hover:text-ink disabled:opacity-30">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Duplicate entry" onClick={() => duplicate(entry.id)} className="rounded p-1 text-ink-faint hover:bg-surface hover:text-ink">
              <Copy className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Delete entry" onClick={() => remove(entry.id)} className="rounded p-1 text-ink-faint hover:bg-surface hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.title} htmlFor={`e-title-${entry.id}`}>
              <Input id={`e-title-${entry.id}`} value={entry.title} onChange={(e) => patch(entry.id, { title: e.target.value })} />
            </Field>
            <Field label={labels.subtitle} htmlFor={`e-sub-${entry.id}`}>
              <Input id={`e-sub-${entry.id}`} value={entry.subtitle} onChange={(e) => patch(entry.id, { subtitle: e.target.value })} />
            </Field>
            <Field label="Location" htmlFor={`e-loc-${entry.id}`}>
              <Input id={`e-loc-${entry.id}`} value={entry.location} onChange={(e) => patch(entry.id, { location: e.target.value })} />
            </Field>
            {labels.showDates && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start" htmlFor={`e-start-${entry.id}`}>
                  <Input id={`e-start-${entry.id}`} value={entry.startDate} onChange={(e) => patch(entry.id, { startDate: e.target.value })} placeholder="2024" />
                </Field>
                <Field label="End" htmlFor={`e-end-${entry.id}`}>
                  <Input id={`e-end-${entry.id}`} value={entry.endDate} onChange={(e) => patch(entry.id, { endDate: e.target.value })} placeholder="Present" />
                </Field>
              </div>
            )}
            <Field label="Link (optional)" htmlFor={`e-url-${entry.id}`}>
              <Input id={`e-url-${entry.id}`} value={entry.url} onChange={(e) => patch(entry.id, { url: e.target.value })} placeholder="github.com/…" />
            </Field>
          </div>

          <div className="mt-3">
            <Field label={labels.showGrade ? "Details (score, coursework, one line per point)" : "Bullet points (one per line)"} htmlFor={`e-desc-${entry.id}`}>
              <Textarea id={`e-desc-${entry.id}`} rows={4} value={entry.description} onChange={(e) => patch(entry.id, { description: e.target.value })} />
            </Field>
            {aiSection && (
              <ResumeAIAssistPanel
                resumeId={resumeId}
                section={aiSection}
                currentText={entry.description}
                quickActions={AI_ACTIONS}
                onAccept={(text) => patch(entry.id, { description: text })}
              />
            )}
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-sm font-medium text-ink">Tags / tech</p>
            <TagInput tags={entry.tags} onChange={(tags) => patch(entry.id, { tags })} placeholder="e.g. React" />
          </div>
        </div>
      ))}

      <button type="button" onClick={add} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <Plus className="h-4 w-4" /> Add entry
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Input, Button } from "@/components/ui";
import { updateResumeEducationAction } from "@/lib/actions/resumeBuilder";
import type { ResumeEducationEntry } from "@/lib/resumeBuilder/types";
import { useAutosaveField, type SaveStatus } from "./useAutosaveField";

function emptyEntry(): ResumeEducationEntry {
  return { id: `${Date.now()}`, degree: "", institution: "", startYear: "", endYear: "", percentage: "" };
}

export default function EducationEditor({
  resumeId,
  initial,
  onChange,
  onStatusChange,
}: {
  resumeId: string;
  initial: ResumeEducationEntry[];
  onChange: (education: ResumeEducationEntry[]) => void;
  onStatusChange: (status: SaveStatus) => void;
}) {
  const [entries, setEntries] = useState<ResumeEducationEntry[]>(initial.length > 0 ? initial : [emptyEntry()]);

  useAutosaveField(entries, (value) => updateResumeEducationAction(resumeId, value.filter((e) => e.degree.trim() || e.institution.trim())), onStatusChange);

  function update(id: string, field: keyof ResumeEducationEntry, value: string) {
    const next = entries.map((e) => (e.id === id ? { ...e, [field]: value } : e));
    setEntries(next);
    onChange(next);
  }

  function addEntry() {
    setEntries((list) => [...list, emptyEntry()]);
  }

  function removeEntry(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Education</h2>
        <button type="button" onClick={addEntry} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <Plus className="h-4 w-4" /> Add education
        </button>
      </div>

      {entries.map((entry) => (
        <div key={entry.id} className="rounded-2xl border border-line p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field label="Degree" htmlFor={`edu-degree-${entry.id}`}>
                <Input id={`edu-degree-${entry.id}`} value={entry.degree} onChange={(e) => update(entry.id, "degree", e.target.value)} />
              </Field>
              <Field label="Institution" htmlFor={`edu-institution-${entry.id}`}>
                <Input id={`edu-institution-${entry.id}`} value={entry.institution} onChange={(e) => update(entry.id, "institution", e.target.value)} />
              </Field>
              <Field label="Start year" htmlFor={`edu-start-${entry.id}`}>
                <Input id={`edu-start-${entry.id}`} value={entry.startYear} onChange={(e) => update(entry.id, "startYear", e.target.value)} />
              </Field>
              <Field label="End year" htmlFor={`edu-end-${entry.id}`}>
                <Input id={`edu-end-${entry.id}`} value={entry.endYear} onChange={(e) => update(entry.id, "endYear", e.target.value)} />
              </Field>
              <Field label="Percentage / CGPA" htmlFor={`edu-pct-${entry.id}`}>
                <Input id={`edu-pct-${entry.id}`} value={entry.percentage} onChange={(e) => update(entry.id, "percentage", e.target.value)} />
              </Field>
            </div>
            {entries.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} aria-label="Remove this education entry">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

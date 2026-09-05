"use client";

import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui";
import { updateResumeSkillsAction } from "@/lib/actions/resumeBuilder";
import type { ResumeSkills } from "@/lib/resumeBuilder/types";
import ResumeAIAssistPanel from "@/components/resumeBuilder/ResumeAIAssistPanel";
import { useAutosaveField, type SaveStatus } from "./useAutosaveField";

const SKILLS_QUICK_ACTIONS = [
  { label: "Suggest skills", instruction: "Suggest additional technical and soft skills based on my resume content." },
];

function SkillTagInput({ label, skills, onAdd, onRemove }: { label: string; skills: string[]; onAdd: (skill: string) => void; onRemove: (skill: string) => void }) {
  const [text, setText] = useState("");

  function submit() {
    const value = text.trim();
    if (value) onAdd(value);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink">{label}</h3>
      <div className="mb-2 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-sm text-ink-muted">
            {skill}
            <button type="button" onClick={() => onRemove(skill)} aria-label={`Remove ${skill}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Add a ${label.toLowerCase()} skill`} />
        <button type="button" onClick={submit} className="rounded-xl border border-line p-2.5 text-primary hover:bg-primary-50">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function SkillsEditor({
  resumeId,
  initial,
  onChange,
  onStatusChange,
}: {
  resumeId: string;
  initial: ResumeSkills;
  onChange: (skills: ResumeSkills) => void;
  onStatusChange: (status: SaveStatus) => void;
}) {
  const [skills, setSkills] = useState<ResumeSkills>(initial);

  useAutosaveField(skills, (value) => updateResumeSkillsAction(resumeId, value), onStatusChange);

  function addSkill(category: keyof ResumeSkills, skill: string) {
    if (skills[category].includes(skill)) return;
    const next = { ...skills, [category]: [...skills[category], skill] };
    setSkills(next);
    onChange(next);
  }

  function removeSkill(category: keyof ResumeSkills, skill: string) {
    const next = { ...skills, [category]: skills[category].filter((s) => s !== skill) };
    setSkills(next);
    onChange(next);
  }

  // The AI panel always returns one comma-separated string — parse it back
  // into individual tags and merge into technical, skipping anything already listed.
  function handleAcceptSuggestedSkills(suggestionText: string) {
    const suggested = suggestionText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !skills.technical.includes(s) && !skills.soft.includes(s));
    if (suggested.length === 0) return;
    const next = { ...skills, technical: [...skills.technical, ...suggested] };
    setSkills(next);
    onChange(next);
  }

  const currentSkillsText = [...skills.technical, ...skills.soft].join(", ");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-ink">Skills</h2>
      <SkillTagInput label="Technical Skills" skills={skills.technical} onAdd={(s) => addSkill("technical", s)} onRemove={(s) => removeSkill("technical", s)} />
      <SkillTagInput label="Soft Skills" skills={skills.soft} onAdd={(s) => addSkill("soft", s)} onRemove={(s) => removeSkill("soft", s)} />
      <ResumeAIAssistPanel
        resumeId={resumeId}
        section="skills"
        currentText={currentSkillsText}
        quickActions={SKILLS_QUICK_ACTIONS}
        onAccept={handleAcceptSuggestedSkills}
      />
    </div>
  );
}

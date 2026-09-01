"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  PROJECT_LEVELS,
  PROJECT_TYPES,
  LEVEL_LABELS,
  TYPE_LABELS,
  type Platform,
  type ProjectLevel,
  type ProjectType,
} from "@/lib/customProjects";
import { Button, Field, Input, Select, Textarea, OptionChips } from "@/components/ui";
import { useDraft } from "../_builder/useDraft";

const TEXT_FIELDS: {
  key: "objective" | "problemStatement" | "description" | "targetUsers" | "technologyPreference";
  label: string;
  hint: string;
}[] = [
  { key: "objective", label: "Objective", hint: "What should this project achieve?" },
  { key: "problemStatement", label: "Problem statement", hint: "What problem does it solve?" },
  { key: "description", label: "Description", hint: "Describe the project in your own words." },
  { key: "targetUsers", label: "Target users", hint: "Who will use it?" },
  { key: "technologyPreference", label: "Technology preference", hint: "Any stack / language you'd like (optional)." },
];

export default function BuilderStart() {
  const router = useRouter();
  const { draft, patch, update, saveNow, clearDraft, loaded, userId } = useDraft();
  const [going, setGoing] = useState(false);
  const [reqText, setReqText] = useState("");

  if (!loaded) return <p className="text-sm text-ink-muted">Loading your draft…</p>;

  const canContinue = !!(draft.projectType && draft.projectLevel && draft.platform && draft.title.trim());

  async function handleContinue() {
    setGoing(true);
    await saveNow();
    router.push("/custom-projects/features");
  }

  return (
    <div className="space-y-7">
      <Field label="Project type">
        <OptionChips
          options={PROJECT_TYPES}
          value={draft.projectType}
          onSelect={(t) => patch({ projectType: t as ProjectType })}
          getLabel={(t) => TYPE_LABELS[t as ProjectType]}
        />
      </Field>

      <Field label="Level">
        <OptionChips
          options={PROJECT_LEVELS}
          value={draft.projectLevel}
          onSelect={(l) => patch({ projectLevel: l as ProjectLevel })}
          getLabel={(l) => LEVEL_LABELS[l as ProjectLevel]}
        />
      </Field>

      <Field label="Platform" htmlFor="cp-platform" className="max-w-sm">
        <Select
          id="cp-platform"
          value={draft.platform ?? ""}
          onChange={(e) => patch({ platform: (e.target.value || null) as Platform | null })}
        >
          <option value="">Choose a platform…</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Project title" htmlFor="cp-title">
        <Input
          id="cp-title"
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          maxLength={200}
          placeholder="e.g. Hostel management system"
        />
      </Field>

      {TEXT_FIELDS.map((f) => (
        <Field key={f.key} label={f.label} hint={f.hint} htmlFor={`cp-${f.key}`}>
          <Textarea
            id={`cp-${f.key}`}
            value={draft[f.key]}
            onChange={(e) => patch({ [f.key]: e.target.value } as Partial<typeof draft>)}
            rows={3}
            maxLength={4000}
          />
        </Field>
      ))}

      <Field
        label="Custom requirements"
        hint="Anything specific that isn't a standard feature. Add as many as you need."
      >
        {draft.customRequirements.length > 0 && (
          <ul className="mb-2 space-y-2">
            {draft.customRequirements.map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink">
                  {r.text}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      customRequirements: d.customRequirements.filter((_, j) => j !== i),
                    }))
                  }
                  className="text-xs font-medium text-ink-muted underline hover:text-danger"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            value={reqText}
            onChange={(e) => setReqText(e.target.value)}
            maxLength={400}
            placeholder="Add a requirement…"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const t = reqText.trim();
              if (!t || draft.customRequirements.length >= 30) return;
              update((d) => ({ ...d, customRequirements: [...d.customRequirements, { text: t }] }));
              setReqText("");
            }}
          >
            Add
          </Button>
        </div>
      </Field>

      <div className="flex items-center justify-between border-t border-line pt-6">
        <button
          type="button"
          onClick={() => {
            if (confirm("Discard this draft and start over?")) clearDraft();
          }}
          className="text-xs font-medium text-ink-muted underline hover:text-danger disabled:opacity-50"
          disabled={!userId}
        >
          Discard draft
        </button>
        <Button type="button" onClick={handleContinue} disabled={!canContinue || going} loading={going}>
          {going ? "Saving…" : "Continue to features"}
        </Button>
      </div>
      {!canContinue && (
        <p className="text-xs text-ink-muted">Choose a project type, level, platform and a title to continue.</p>
      )}
    </div>
  );
}

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
import { useDraft } from "../_builder/useDraft";

const TEXT_FIELDS: { key: "objective" | "problemStatement" | "description" | "targetUsers" | "technologyPreference"; label: string; hint: string }[] = [
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
    <div className="space-y-8">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Project type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROJECT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => patch({ projectType: t as ProjectType })}
              className={`rounded-lg border px-4 py-2 text-sm ${
                draft.projectType === t ? "border-primary bg-primary text-white" : "border-line text-ink hover:border-line"
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Level</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROJECT_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => patch({ projectLevel: l as ProjectLevel })}
              className={`rounded-lg border px-4 py-2 text-sm ${
                draft.projectLevel === l ? "border-primary bg-primary text-white" : "border-line text-ink hover:border-line"
              }`}
            >
              {LEVEL_LABELS[l]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="text-sm font-semibold text-ink">Platform</label>
        <select
          value={draft.platform ?? ""}
          onChange={(e) => patch({ platform: (e.target.value || null) as Platform | null })}
          className="mt-2 block w-full max-w-sm border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">Choose a platform…</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">Project title</label>
        <input
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          maxLength={200}
          placeholder="e.g. Hostel management system"
          className="mt-2 block w-full border border-line bg-white px-3 py-2 text-sm"
        />
      </div>

      {TEXT_FIELDS.map((f) => (
        <div key={f.key}>
          <label className="text-sm font-semibold text-ink">{f.label}</label>
          <p className="text-xs text-ink-muted">{f.hint}</p>
          <textarea
            value={draft[f.key]}
            onChange={(e) => patch({ [f.key]: e.target.value } as Partial<typeof draft>)}
            rows={3}
            maxLength={4000}
            className="mt-1 block w-full border border-line bg-white px-3 py-2 text-sm"
          />
        </div>
      ))}

      <div>
        <label className="text-sm font-semibold text-ink">Custom requirements</label>
        <p className="text-xs text-ink-muted">Anything specific that isn&apos;t a standard feature. Add as many as you need.</p>
        {draft.customRequirements.length > 0 && (
          <ul className="mt-2 space-y-2">
            {draft.customRequirements.map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="flex-1 border border-line bg-white px-3 py-1.5 text-sm text-ink">{r.text}</span>
                <button
                  type="button"
                  onClick={() => update((d) => ({ ...d, customRequirements: d.customRequirements.filter((_, j) => j !== i) }))}
                  className="text-xs text-ink-muted underline hover:text-ink"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex gap-2">
          <input
            value={reqText}
            onChange={(e) => setReqText(e.target.value)}
            maxLength={400}
            placeholder="Add a requirement…"
            className="flex-1 border border-line bg-white px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              const t = reqText.trim();
              if (!t || draft.customRequirements.length >= 30) return;
              update((d) => ({ ...d, customRequirements: [...d.customRequirements, { text: t }] }));
              setReqText("");
            }}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:bg-primary hover:text-white"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-6">
        <button
          type="button"
          onClick={() => {
            if (confirm("Discard this draft and start over?")) clearDraft();
          }}
          className="text-xs text-ink-muted underline hover:text-ink"
          disabled={!userId}
        >
          Discard draft
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || going}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {going ? "Saving…" : "Continue to features"}
        </button>
      </div>
      {!canContinue && (
        <p className="text-xs text-ink-muted">Choose a project type, level, platform and a title to continue.</p>
      )}
    </div>
  );
}

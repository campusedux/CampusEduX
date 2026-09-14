"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronDown, GraduationCap, Info, User, Briefcase, Layers, Rocket, Globe } from "lucide-react";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  PROJECT_LEVELS,
  PROJECT_TYPES,
  LEVEL_LABELS,
  LEVEL_DESCRIPTIONS,
  TYPE_LABELS,
  TYPE_DESCRIPTIONS,
  type Platform,
  type ProjectLevel,
  type ProjectType,
} from "@/lib/customProjects";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useDraft } from "../_builder/useDraft";
import { SelectCard } from "../_builder/SelectCard";
import { BottomBar } from "../_builder/BottomBar";

const TYPE_ICONS: Record<ProjectType, typeof GraduationCap> = {
  academic: GraduationCap,
  personal: User,
  business: Briefcase,
};

const LEVEL_ICONS: Record<ProjectLevel, typeof Layers> = {
  standard: Layers,
  advanced: Rocket,
};

const MORE_DETAIL_FIELDS: {
  key: "problemStatement" | "description" | "targetUsers" | "technologyPreference";
  label: string;
  hint: string;
}[] = [
  { key: "problemStatement", label: "Problem statement", hint: "What problem does it solve?" },
  { key: "description", label: "Description", hint: "Describe the project in your own words." },
  { key: "targetUsers", label: "Target users", hint: "Who will use it?" },
  { key: "technologyPreference", label: "Technology preference", hint: "Any stack / language you'd like (optional)." },
];

interface UnderstandResponse {
  projectType: ProjectType;
  projectLevel: ProjectLevel;
  platform: Platform;
  overview: string;
  recommendedFeatureIds: string[];
  suggestedExtraFeatureIds: string[];
}

export default function BuilderStart() {
  const router = useRouter();
  const { draft, patch, update, saveNow, clearDraft, loaded, userId } = useDraft();
  const [going, setGoing] = useState(false);
  const [reqText, setReqText] = useState("");
  const [optionalOpen, setOptionalOpen] = useState(false);

  if (!loaded) return <p className="text-sm text-ink-muted">Loading your draft…</p>;

  const canContinue = !!(draft.title.trim() && draft.objective.trim() && draft.projectType && draft.projectLevel && draft.platform);

  async function handleContinue() {
    setGoing(true);
    try {
      const understanding = await understandProject();
      update((d) => ({
        ...d,
        projectType: d.projectType ?? understanding?.projectType ?? "personal",
        projectLevel: d.projectLevel ?? understanding?.projectLevel ?? "standard",
        platform: d.platform ?? understanding?.platform ?? "web",
        aiOverview: understanding?.overview ?? d.aiOverview,
        aiRecommendedFeatureIds: understanding?.recommendedFeatureIds ?? d.aiRecommendedFeatureIds,
        aiSuggestedExtraFeatureIds: understanding?.suggestedExtraFeatureIds ?? d.aiSuggestedExtraFeatureIds,
        // A fresh understanding may change the recommended set — let
        // Features & Files re-seed defaults once more from the new picks.
        featuresSeeded: understanding ? false : d.featuresSeeded,
      }));
      await saveNow();
      router.push("/custom-projects/features");
    } finally {
      setGoing(false);
    }
  }

  async function understandProject(): Promise<UnderstandResponse | null> {
    try {
      const res = await fetch("/api/custom-projects/understand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          objective: draft.objective,
          problemStatement: draft.problemStatement || undefined,
          description: draft.description || undefined,
          targetUsers: draft.targetUsers || undefined,
          technologyPreference: draft.technologyPreference || undefined,
          projectTypeHint: draft.projectType,
          projectLevelHint: draft.projectLevel,
          platformHint: draft.platform,
        }),
      });
      const body = await res.json();
      if (!res.ok || body?.error) return null;
      return body as UnderstandResponse;
    } catch {
      return null;
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <Field label="Project name" required htmlFor="cp-title">
          <Input
            id="cp-title"
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            maxLength={200}
            placeholder="e.g. Online Clothing Store"
            className="h-12 text-base font-medium"
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-bold text-ink">
          What should this project achieve? <span className="text-danger">*</span>
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Tell us what you want your project to do, who will use it, and what problem it should solve. No technical
          terms needed — write it in your own words.
        </p>
        <Textarea
          id="cp-objective"
          value={draft.objective}
          onChange={(e) => patch({ objective: e.target.value })}
          rows={6}
          maxLength={4000}
          placeholder="Tell us what you want your project to do, who will use it, and what problem it should solve…"
          className="mt-4"
        />
      </section>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-bold text-ink">
          Project type <span className="text-danger">*</span>
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Choose the option that best describes your project.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PROJECT_TYPES.map((t) => (
            <SelectCard
              key={t}
              icon={TYPE_ICONS[t]}
              title={TYPE_LABELS[t]}
              description={TYPE_DESCRIPTIONS[t]}
              selected={draft.projectType === t}
              onSelect={() => patch({ projectType: t as ProjectType })}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-bold text-ink">
          Project level <span className="text-danger">*</span>
        </h2>
        <p className="mt-1 text-sm text-ink-muted">How much complexity does this project need?</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PROJECT_LEVELS.map((l) => (
            <SelectCard
              key={l}
              icon={LEVEL_ICONS[l]}
              title={LEVEL_LABELS[l]}
              description={LEVEL_DESCRIPTIONS[l]}
              selected={draft.projectLevel === l}
              onSelect={() => patch({ projectLevel: l as ProjectLevel })}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-bold text-ink">
          Platform <span className="text-danger">*</span>
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Choose the platform where your project will primarily run.</p>
        <div className="relative mt-4 max-w-sm">
          <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <Select
            id="cp-platform"
            value={draft.platform ?? ""}
            onChange={(e) => patch({ platform: (e.target.value || null) as Platform | null })}
            className="pl-10"
          >
            <option value="">Choose a platform…</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary-50/60 px-4 py-3 text-sm text-ink">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
          <p>These three fields are required to continue.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white shadow-card">
        <button
          type="button"
          onClick={() => setOptionalOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left sm:px-8"
        >
          <span>
            <span className="block text-sm font-bold text-ink">Optional information</span>
            <span className="block text-xs text-ink-muted">
              A few more details that help us scope your project accurately.
            </span>
          </span>
          <ChevronDown className={"h-5 w-5 flex-shrink-0 text-ink-faint transition-transform " + (optionalOpen ? "rotate-180" : "")} aria-hidden />
        </button>

        {optionalOpen && (
          <div className="space-y-8 border-t border-line px-6 py-6 sm:px-8">
            <div className="space-y-5">
              {MORE_DETAIL_FIELDS.map((f) => (
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
            </div>

            <div>
              <h3 className="text-sm font-bold text-ink">Additional requirements</h3>
              <p className="mt-1 text-xs text-ink-muted">
                Add any specific design, target users, important workflow or special instructions.
              </p>
              <div className="mt-3">
                {draft.customRequirements.length > 0 && (
                  <ul className="mb-3 space-y-2">
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
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="flex justify-end">
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
      </div>

      {!canContinue && (
        <p className="text-xs text-ink-muted">
          Add a project name, tell us what it should achieve, and choose a project type, level and platform to
          continue.
        </p>
      )}

      <BottomBar
        step={1}
        left={<span className="text-xs font-medium text-ink-faint">Step 1 of 4</span>}
        center={
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Your progress is saved automatically
          </span>
        }
        right={
          <Button type="button" onClick={handleContinue} disabled={!canContinue || going} loading={going} rightIcon={ArrowRight}>
            {going ? "Understanding your project…" : "Continue to features"}
          </Button>
        }
      />
    </div>
  );
}

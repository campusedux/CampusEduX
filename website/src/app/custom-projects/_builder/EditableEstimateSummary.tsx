"use client";

import { LoadError } from "./LoadError";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { formatINR } from "@/lib/format";
import { computeEstimate, type BuilderDraft, type Estimate, type FeatureRow, type PlatformRow, type PricingRow } from "@/lib/customProjects";
import { useDraft } from "./useDraft";
import { SelectionSummary } from "./SelectionSummary";
import { BottomBar } from "./BottomBar";

export function EditableEstimateSummary({ initialDraft, initialEstimate, pricing, platforms, features }: {
  initialDraft: BuilderDraft; initialEstimate: Estimate; pricing: PricingRow[]; platforms: PlatformRow[]; features: FeatureRow[];
}) {
  const router = useRouter();
  const { draft, update, saveNow, loaded, loadError, retryLoad } = useDraft();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const current = loaded ? draft : initialDraft;
  const estimate = loaded ? computeEstimate(current, pricing, platforms, features) : initialEstimate;
  const busy = saving || refreshing || !loaded || saveFailed;
  async function saveSelection() {
    setSaving(true);
    try {
      await saveNow();
      setSaveFailed(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setSaveFailed(true);
      toast({ title: "Could not save", description: error instanceof Error ? error.message : undefined, tone: "error" });
    } finally {
      setSaving(false);
    }
  }
  async function remove(change: (d: BuilderDraft) => BuilderDraft) {
    if (busy) return;
    update(change);
    await saveSelection();
  }
  if (loadError) return <LoadError kind={loadError.kind} onRetry={retryLoad} />;
  return <>
    <SelectionSummary draft={current} estimate={estimate}
      onRemoveFeature={busy ? undefined : (id) => { void remove((d) => ({ ...d, featureIds: d.featureIds.filter((item) => item !== id) })); }}
      onRemoveFile={busy ? undefined : (path) => { void remove((d) => ({ ...d, projectImagePath: d.projectImagePath === path ? null : d.projectImagePath, referenceFiles: d.referenceFiles.filter((file) => file.path !== path) })); }} />
    <BottomBar step={3} total={formatINR(estimate.estimatedTotal)}
      left={<Link href="/custom-projects/features" className="text-sm font-medium text-ink-muted hover:text-ink">← Back</Link>}
      center={saveFailed ? "Save failed. Retry before continuing." : busy ? "Saving your selection…" : undefined}
      right={saveFailed && !saving ? <Button type="button" onClick={() => { void saveSelection(); }}>Retry saving</Button> : busy ? <Button disabled leftIcon={Lock}>Continue to payment →</Button> : <Button href="/custom-projects/checkout" leftIcon={Lock}>Continue to payment →</Button>} />
  </>;
}

"use client";

import Link from "next/link";
import { FileText, X } from "lucide-react";
import { formatINR } from "@/lib/format";
import { LEVEL_LABELS, PLATFORM_LABELS, TYPE_LABELS, type BuilderDraft, type Estimate } from "@/lib/customProjects";

type Props = {
  draft: BuilderDraft;
  estimate: Estimate;
  review?: boolean;
  onRemoveFeature?: (id: string) => void;
  onRemoveFile?: (path: string) => void;
};

export function SelectionSummary({ draft, estimate, review = false, onRemoveFeature, onRemoveFile }: Props) {
  const included = estimate.selectedFeatures.filter((f) => f.isIncluded || f.price === 0 || draft.aiRecommendedFeatureIds.includes(f.id));
  const extras = estimate.selectedFeatures.filter((f) => !f.isIncluded && f.price > 0 && !draft.aiRecommendedFeatureIds.includes(f.id));
  const extraPrice = extras.reduce((sum, feature) => sum + feature.price, 0);
  const files = [...(draft.projectImagePath ? [{ path: draft.projectImagePath, name: "Project image", sizeMb: null }] : []), ...draft.referenceFiles];
  const fields = [
    ["Name", draft.title.trim()], ["Type", draft.projectType && TYPE_LABELS[draft.projectType]],
    ["Level", draft.projectLevel && LEVEL_LABELS[draft.projectLevel]], ["Platform", draft.platform && PLATFORM_LABELS[draft.platform]],
  ];
  const price = (value: number) => estimate.basePrice > 0 ? formatINR(value) : "Not set";
  const section = (title: string, href: string) => <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h3><Link className="rounded text-xs font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" href={href}>Edit</Link></div>;
  const content = <div className="space-y-4 text-sm">
    <section>{section("Project", "/custom-projects/start")}<dl className="mt-2 space-y-1">{fields.map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-ink-muted">{label}</dt><dd key={`${label}-${value}`} className={value ? "selection-value min-w-0 break-words text-right font-medium text-ink" : "text-ink-faint"}>{value || "Not set"}</dd></div>)}</dl></section>
    <section>{section(`Included features · ${included.length}`, "/custom-projects/features")}{included.length > 0 ? <details className="mt-1"><summary className="cursor-pointer text-xs text-primary">View all</summary><ul className="mt-2 space-y-1 text-ink-muted">{included.map((f) => <li key={f.id}>{f.name}</li>)}</ul></details> : <p className="mt-1 text-xs text-ink-faint">No included features selected</p>}</section>
    <section>{section("Extra features", "/custom-projects/features")}{extras.length ? <ul className="mt-2 space-y-2">{extras.map((f) => <li key={f.id} className="flex items-center gap-2"><span className="min-w-0 flex-1 break-words">{f.name}</span><span className="shrink-0 text-xs text-primary">+{formatINR(f.price)}</span>{onRemoveFeature && <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onRemoveFeature(f.id)} className="rounded p-1 text-ink-muted hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><X className="h-4 w-4" /></button>}</li>)}</ul> : <p className="mt-1 text-xs text-ink-faint">No extras added</p>}</section>
    <section>{section(`Files · ${files.length}`, "/custom-projects/features")}{files.length ? <ul className="mt-2 space-y-2">{files.map((f) => <li key={f.path} className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden /><span className="min-w-0 flex-1 break-all">{f.name}{f.sizeMb !== null && <span className="text-xs text-ink-faint"> ({f.sizeMb} MB)</span>}</span>{onRemoveFile && <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onRemoveFile(f.path)} className="rounded p-1 text-ink-muted hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><X className="h-4 w-4" /></button>}</li>)}</ul> : <p className="mt-1 text-xs text-ink-faint">No files uploaded</p>}</section>
    <section>{section("Price", "/custom-projects/estimate")}<dl className="mt-2 space-y-1">{[["Base", price(estimate.basePrice)], ["Platform", price(estimate.platformCharge)], ["Included features", price(estimate.featureTotal - extraPrice)], ["Extras", price(extraPrice)], ["Total estimate", price(estimate.estimatedTotal)], ["Pay now", estimate.tokenAmount ? `${formatINR(estimate.tokenAmount)} token` : "Not set"]].map(([label, value]) => <div key={label} className="flex justify-between gap-2"><dt className="text-ink-muted">{label}</dt><dd key={`${label}-${value}`} className="selection-value text-right font-medium">{value}</dd></div>)}</dl></section>
  </div>;
  return <>
    <style>{`@keyframes selection-change { from { background-color: rgba(79,57,246,.16); } to { background-color: transparent; } } @media (prefers-reduced-motion: no-preference) { .selection-value { animation: selection-change 150ms ease-out; } }`}</style>
    <aside className={`${review ? "block" : "hidden lg:block lg:sticky lg:top-24 lg:self-start"} rounded-xl border border-line bg-card p-4 shadow-sm`}><h2 className="mb-4 text-base font-semibold text-ink">{review ? "Review" : "Your selection"}</h2>{content}</aside>
    <details className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 rounded-xl border border-line bg-card shadow-sm lg:hidden">
      <summary className="flex cursor-pointer items-center justify-between gap-3 p-3 text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><span>Summary</span><span>{price(estimate.estimatedTotal)} ▾</span></summary>
      <div className="max-h-[50vh] overflow-y-auto border-t border-line p-4">{content}</div>
    </details>
  </>;
}

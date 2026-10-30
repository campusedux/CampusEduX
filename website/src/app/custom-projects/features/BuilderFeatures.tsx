"use client";

import { toast } from "@/components/ui/Toast";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, HelpCircle, Image as ImageIcon, Info, Plus, Search, X } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { formatINR } from "@/lib/format";
import { Button, Modal } from "@/components/ui";
import {
  CP_DOC_TYPES,
  CP_IMAGE_TYPES,
  CP_MAX_FILE_BYTES,
  CP_MAX_FILE_MB,
  CP_UPLOADS_BUCKET,
  computeEstimate,
  featuresForTier,
  findConflict,
  groupByCategory,
  isIncludedForTier,
  priceForFeature,
  resolveDependencies,
  type FeatureRow,
  type PlatformRow,
  type PricingRow,
  type ProjectLevel,
  type ProjectType,
  type Platform,
} from "@/lib/customProjects";
import { useDraft } from "../_builder/useDraft";
import { resolveUploadContentType, withContentType } from "@/lib/uploads";
import { BottomBar } from "../_builder/BottomBar";
import { ConfigSummary } from "../_builder/ConfigSummary";
import { CollapsibleCategory } from "../_builder/CollapsibleCategory";
import { Dropzone } from "../_builder/Dropzone";
import { FeatureCard } from "../_builder/FeatureCard";

/** Always considered necessary, whatever the project — see migration 0090. */
const MANDATORY_FEATURE_IDS = ["auth-email-password", "user-profile", "search-basic"];

export default function BuilderFeatures({
  features,
  pricing,
  platforms,
  catalogAvailable,
}: {
  features: FeatureRow[];
  pricing: PricingRow[];
  platforms: PlatformRow[];
  catalogAvailable: boolean;
}) {
  const router = useRouter();
  const { draft, update, patch, saveNow, loaded, userId } = useDraft();
  const [going, setGoing] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseQuery, setBrowseQuery] = useState("");

  const eligible = useMemo(
    () => featuresForTier(features, draft.projectType, draft.projectLevel),
    [features, draft.projectType, draft.projectLevel],
  );
  const featureById = useMemo(() => new Map(features.map((f) => [f.id, f])), [features]);

  // Admin-set "Included by default" for this type:level — always delivered, never charged.
  const tierIncluded = useMemo(
    () => new Set(eligible.filter((f) => isIncludedForTier(f, draft.projectType, draft.projectLevel)).map((f) => f.id)),
    [eligible, draft.projectType, draft.projectLevel],
  );
  // Included = admin-included for this tier, free, or AI flagged it as
  // genuinely necessary (even if paid). Extra = everything else paid.
  const includedBucket = useMemo(
    () =>
      eligible.filter(
        (f) => tierIncluded.has(f.id) || Number(f.price) === 0 || draft.aiRecommendedFeatureIds.includes(f.id),
      ),
    [eligible, tierIncluded, draft.aiRecommendedFeatureIds],
  );
  const extraBucket = useMemo(
    () =>
      eligible.filter(
        (f) => !tierIncluded.has(f.id) && Number(f.price) > 0 && !draft.aiRecommendedFeatureIds.includes(f.id),
      ),
    [eligible, tierIncluded, draft.aiRecommendedFeatureIds],
  );
  const defaultExtras = useMemo(() => {
    if (draft.aiSuggestedExtraFeatureIds.length === 0) return extraBucket;
    const ids = new Set(draft.aiSuggestedExtraFeatureIds);
    return extraBucket.filter((f) => ids.has(f.id));
  }, [extraBucket, draft.aiSuggestedExtraFeatureIds]);

  const groupedIncluded = useMemo(() => groupByCategory(includedBucket), [includedBucket]);
  const groupedExtras = useMemo(() => groupByCategory(defaultExtras), [defaultExtras]);

  const browseResults = useMemo(() => {
    const q = browseQuery.trim().toLowerCase();
    if (!q) return extraBucket;
    return extraBucket.filter((f) => f.name.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }, [extraBucket, browseQuery]);
  const groupedBrowse = useMemo(() => groupByCategory(browseResults), [browseResults]);

  const selectedSet = useMemo(() => new Set(draft.featureIds), [draft.featureIds]);
  const extraSelectedCount = extraBucket.filter((f) => selectedSet.has(f.id)).length;

  const estimate = useMemo(
    () => computeEstimate(draft, pricing, platforms, features),
    [draft, pricing, platforms, features],
  );

  const filesUploaded = draft.referenceFiles.length + (draft.projectImagePath ? 1 : 0);

  // One-time default selection: every included feature, the first time this
  // tier is seen. Re-visits never stomp a user's explicit toggles.
  useEffect(() => {
    if (
      !loaded ||
      draft.projectType === "academic" ||
      draft.featuresSeeded ||
      includedBucket.length === 0
    )
      return;
    patch({
      featureIds: includedBucket.map((f) => f.id),
      featuresSeeded: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, draft.featuresSeeded, includedBucket]);

  if (!loaded) return <p className="text-sm text-ink-muted">Loading your draft…</p>;

  if (draft.projectType === "academic")
    return (
      <section className="card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Project mentoring scope</h2>
        <p className="mt-3 text-sm text-ink-muted">
          We can review code you wrote, help debug it, discuss architecture, and
          give feedback. You write any assessed code, report, slides, and
          answers yourself. Implementation packages and assessment deliverables
          are unavailable.
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          Your objective from the previous step tells the mentor what you want
          to learn. You can share your own draft or code as a reference.
        </p>
        <Button
          className="mt-5"
          onClick={handleContinue}
          loading={going}
        >
          Review mentoring estimate
        </Button>
      </section>
    );

  if (!catalogAvailable || features.length === 0)
    return (
      <div className="empty-state">
        The feature catalog isn&apos;t available right now.{" "}
        <Link href="/custom-projects/estimate" className="text-ink underline">
          Skip to the estimate
        </Link>
        .
      </div>
    );

  if (!draft.projectType || !draft.projectLevel) {
    return (
      <div className="empty-state">
        Choose a project type and level first.{" "}
        <Link href="/custom-projects/start" className="text-ink underline">
          Back to project details
        </Link>
        .
      </div>
    );
  }

  function toggle(id: string) {
    const feature = featureById.get(id);
    if (!feature) return;
    const already = selectedSet.has(id);

    if (already) {
      if (MANDATORY_FEATURE_IDS.includes(id) && !confirm(`"${feature.name}" is commonly essential. Disable it anyway?`)) {
        return;
      }
      update((d) => ({ ...d, featureIds: d.featureIds.filter((x) => x !== id) }));
      setNotice(null);
      return;
    }

    const conflict = findConflict(draft.featureIds, id, features);
    if (conflict) {
      setNotice(`"${feature.name}" and "${conflict.name}" can't be enabled together.`);
      return;
    }

    const { featureIds: withDeps, added } = resolveDependencies(draft.featureIds, id, features);
    const next = withDeps.includes(id) ? withDeps : [...withDeps, id];
    update((d) => ({ ...d, featureIds: next }));
    setNotice(
      added.length > 0
        ? `"${feature.name}" requires ${added.map((a) => `"${a.name}"`).join(", ")}. ${
            added.length > 1 ? "They have" : "It has"
          } been enabled automatically.`
        : null,
    );
  }

  async function handleImage(list: FileList) {
    setUploadError(null);
    const f = list[0];
    if (!f || !userId) return;
    const imageType = resolveUploadContentType(f, CP_IMAGE_TYPES);
    if (!imageType) {
      setUploadError("Project image must be a PNG, JPEG or WebP.");
      return;
    }
    if (f.size > CP_MAX_FILE_BYTES) {
      setUploadError(`That image is over ${CP_MAX_FILE_MB} MB.`);
      return;
    }
    setImageBusy(true);
    try {
      const ext = (f.name.split(".").pop() || "png").toLowerCase();
      const path = `${userId}/uploads/image_${Date.now()}.${ext}`;
      const { error } = await createBrowserSupabase()
        .storage.from(CP_UPLOADS_BUCKET)
        .upload(path, withContentType(f, imageType), { contentType: imageType, upsert: true });
      if (error) {
        setUploadError(`Upload failed: ${error.message}`);
        return;
      }
      patch({ projectImagePath: path });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setImageBusy(false);
    }
  }

  async function handleFiles(list: FileList) {
    setUploadError(null);
    const files = Array.from(list);
    if (files.length === 0 || !userId) return;
    setFileBusy(true);
    try {
      const supabase = createBrowserSupabase();
      for (const f of files) {
        if (f.size > CP_MAX_FILE_BYTES) {
          setUploadError(`"${f.name}" is over ${CP_MAX_FILE_MB} MB and was skipped.`);
          continue;
        }
        const docType = resolveUploadContentType(f, CP_DOC_TYPES);
        if (!docType) {
          setUploadError(`"${f.name}" is not an accepted file type and was skipped.`);
          continue;
        }
        if (draft.referenceFiles.some((r) => r.name === f.name) || draft.referenceFiles.length >= 20) continue;
        const safe = f.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const path = `${userId}/uploads/ref_${Date.now()}_${safe}`;
        const { error } = await supabase.storage
          .from(CP_UPLOADS_BUCKET)
          .upload(path, withContentType(f, docType), { contentType: docType, upsert: true });
        if (error) {
          setUploadError(`Upload failed for "${f.name}": ${error.message}`);
          continue;
        }
        update((d) => ({
          ...d,
          referenceFiles: [
            ...d.referenceFiles,
            { path, name: f.name, sizeMb: Math.round((f.size / (1024 * 1024)) * 100) / 100 },
          ],
        }));
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setFileBusy(false);
    }
  }

  async function handleContinue() {
    setGoing(true);
    try {
      await saveNow();
      router.push("/custom-projects/estimate");
    } catch (err) {
      toast({ title: "Could not save", description: err instanceof Error ? err.message : undefined, tone: "error" });
    } finally {
      setGoing(false);
    }
  }

  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="min-w-0 space-y-8">
        <ConfigSummary
          projectType={draft.projectType as ProjectType}
          projectLevel={draft.projectLevel as ProjectLevel}
          platform={(draft.platform ?? "web") as Platform}
          title={draft.title}
          overview={draft.aiOverview || draft.objective.slice(0, 200)}
        />

        {notice && (
          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary-50/60 px-4 py-3 text-sm text-ink">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
            <p>{notice}</p>
          </div>
        )}

        {/* Included Features */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">Included Features</h2>
              <p className="mt-1 text-sm text-ink-muted">
                These are already part of your project based on what you told us. You can turn any of them off.
              </p>
            </div>
            {includedBucket.length > 0 && (
              <span className="flex-shrink-0 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary">
                {includedBucket.length} included
              </span>
            )}
          </div>
          {groupedIncluded.length === 0 ? (
            <p className="mt-3 text-sm text-ink-faint">No included features are configured for this tier yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {groupedIncluded.map(([category, rows]) => (
                <CollapsibleCategory key={category} title={category} count={rows.length} countLabel={rows.length === 1 ? "feature" : "features"}>
                  {rows.map((f) =>
                    tierIncluded.has(f.id) ? (
                      <FeatureCard key={f.id} feature={{ ...f, price: 0 }} checked readOnly />
                    ) : (
                      <FeatureCard
                        key={f.id}
                        feature={f}
                        checked={selectedSet.has(f.id)}
                        onToggle={() => toggle(f.id)}
                        recommended={MANDATORY_FEATURE_IDS.includes(f.id) || draft.aiRecommendedFeatureIds.includes(f.id)}
                      />
                    ),
                  )}
                </CollapsibleCategory>
              ))}
            </div>
          )}
        </section>

        {/* Extra Features */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                Extra Features
                {defaultExtras.length > 0 && (
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                    {defaultExtras.length} available
                  </span>
                )}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">Optional enhancements you can add to this project.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" leftIcon={Plus} onClick={() => setBrowseOpen(true)}>
              Add extra feature
            </Button>
          </div>

          {groupedExtras.length === 0 ? (
            <button
              type="button"
              onClick={() => setBrowseOpen(true)}
              className="mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface px-4 py-8 text-center transition hover:border-primary/30 hover:bg-primary-50/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <Plus className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-ink">Add extra feature</span>
              <span className="max-w-xs text-xs text-ink-muted">
                Browse additional functionality available for your project.
              </span>
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              {groupedExtras.map(([category, rows]) => (
                <CollapsibleCategory key={category} title={category} count={rows.length} countLabel={rows.length === 1 ? "feature" : "features"}>
                  {rows.map((f) => (
                    <FeatureCard
                      key={f.id}
                      feature={{ ...f, price: priceForFeature(f, draft.projectType, false) }}
                      checked={selectedSet.has(f.id)}
                      onToggle={() => toggle(f.id)}
                    />
                  ))}
                </CollapsibleCategory>
              ))}
            </div>
          )}
        </section>

        {/* Project files & references */}
        <section>
          <h2 className="text-lg font-bold text-ink">Project files &amp; references</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Upload documents, screenshots, PDFs, designs or reference files that help us understand your project.
          </p>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-ink">Project image (optional)</p>
            <Dropzone
              accept={CP_IMAGE_TYPES.join(",")}
              disabled={imageBusy}
              onFiles={handleImage}
              hint="PNG, JPEG or WebP"
            />
            {draft.projectImagePath && (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink">
                <ImageIcon className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
                <span className="flex-1 truncate">Image attached</span>
                <button
                  type="button"
                  onClick={() => patch({ projectImagePath: null })}
                  className="text-ink-faint hover:text-danger"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold text-ink">Requirement / reference files (optional)</p>
            <Dropzone
              accept={CP_DOC_TYPES.join(",")}
              multiple
              disabled={fileBusy}
              onFiles={handleFiles}
              hint={`PDF, DOC, DOCX, images or ZIP · up to ${CP_MAX_FILE_MB} MB each`}
            />
            {draft.referenceFiles.length > 0 && (
              <ul className="space-y-1.5">
                {draft.referenceFiles.map((r, i) => (
                  <li key={r.path} className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink">
                    <FileText className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
                    <span className="flex-1 truncate">
                      {r.name} <span className="text-xs text-ink-muted">({r.sizeMb} MB)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => update((d) => ({ ...d, referenceFiles: d.referenceFiles.filter((_, j) => j !== i) }))}
                      className="text-ink-faint hover:text-danger"
                      aria-label={`Remove ${r.name}`}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
          </div>
        </section>

        <BottomBar
          step={2}
          left={
            <Link href="/custom-projects/start" className="text-sm font-medium text-ink-muted underline hover:text-ink">
              ← Back
            </Link>
          }
          center={<span>{draft.featureIds.length} features selected</span>}
          right={
            <Button type="button" onClick={handleContinue} disabled={going} loading={going}>
              {going ? "Saving…" : "Review estimate →"}
            </Button>
          }
        />
      </div>

      {/* Right sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <h2 className="text-base font-bold text-ink">Your selection</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Included features</dt>
              <dd className="font-medium text-ink">
                {includedBucket.filter((f) => tierIncluded.has(f.id) || selectedSet.has(f.id)).length}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Extra features</dt>
              <dd className="font-medium text-ink">{extraSelectedCount} selected</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Files uploaded</dt>
              <dd className="font-medium text-ink">{filesUploaded}</dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs font-medium text-ink-muted">Estimated price</p>
            <p className="mt-1 text-2xl font-bold text-ink">{formatINR(estimate.estimatedTotal)}</p>
          </div>

          <Link
            href="/custom-projects/estimate"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
          >
            View full estimate <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold text-ink">Need help choosing?</p>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            Not sure which features to choose? You can continue and our team will help you refine the requirements.
          </p>
        </div>
      </aside>

      <Modal open={browseOpen} onClose={() => setBrowseOpen(false)} title="Browse extra features" className="max-w-2xl">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            value={browseQuery}
            onChange={(e) => setBrowseQuery(e.target.value)}
            placeholder="Search all extra features…"
            className="block h-10 w-full rounded-xl border border-line bg-card pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {groupedBrowse.length === 0 ? (
            <p className="text-sm text-ink-faint">No features match &quot;{browseQuery}&quot;.</p>
          ) : (
            groupedBrowse.map(([category, rows]) => (
              <CollapsibleCategory key={category} title={category} count={rows.length} countLabel={rows.length === 1 ? "feature" : "features"}>
                {rows.map((f) => (
                  <FeatureCard
                    key={f.id}
                    feature={{ ...f, price: priceForFeature(f, draft.projectType, false) }}
                    checked={selectedSet.has(f.id)}
                    onToggle={() => toggle(f.id)}
                  />
                ))}
              </CollapsibleCategory>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

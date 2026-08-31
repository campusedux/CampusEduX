"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { formatINR } from "@/lib/format";
import {
  CP_DOC_TYPES,
  CP_IMAGE_TYPES,
  CP_MAX_FILE_BYTES,
  CP_MAX_FILE_MB,
  CP_UPLOADS_BUCKET,
  type FeatureRow,
  TYPE_LABELS,
  LEVEL_LABELS,
  featuresForTier,
} from "@/lib/customProjects";
import { useDraft } from "../_builder/useDraft";

export default function BuilderFeatures({ features }: { features: FeatureRow[] }) {
  const router = useRouter();
  const { draft, update, patch, saveNow, loaded, userId } = useDraft();
  const [going, setGoing] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const eligible = useMemo(
    () => featuresForTier(features, draft.projectType, draft.projectLevel),
    [features, draft.projectType, draft.projectLevel],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, FeatureRow[]>();
    for (const f of eligible) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    return [...map.entries()];
  }, [eligible]);

  const selectedSet = useMemo(() => new Set(draft.featureIds), [draft.featureIds]);
  const featureSubtotal = eligible
    .filter((f) => selectedSet.has(f.id))
    .reduce((s, f) => s + (Number(f.price) || 0), 0);

  if (!loaded) return <p className="text-sm text-ink-muted">Loading your draft…</p>;

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
    update((d) => ({
      ...d,
      featureIds: d.featureIds.includes(id) ? d.featureIds.filter((x) => x !== id) : [...d.featureIds, id],
    }));
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const f = e.target.files?.[0];
    if (!f || !userId) return;
    if (!CP_IMAGE_TYPES.includes(f.type)) {
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
        .upload(path, f, { contentType: f.type || `image/${ext}`, upsert: true });
      if (error) {
        setUploadError(`Upload failed: ${error.message}`);
        return;
      }
      patch({ projectImagePath: path });
    } finally {
      setImageBusy(false);
    }
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const list = Array.from(e.target.files ?? []);
    if (list.length === 0 || !userId) return;
    setFileBusy(true);
    try {
      const supabase = createBrowserSupabase();
      for (const f of list) {
        if (f.size > CP_MAX_FILE_BYTES) {
          setUploadError(`"${f.name}" is over ${CP_MAX_FILE_MB} MB and was skipped.`);
          continue;
        }
        if (f.type && !CP_DOC_TYPES.includes(f.type)) {
          setUploadError(`"${f.name}" is not an accepted file type and was skipped.`);
          continue;
        }
        if (draft.referenceFiles.some((r) => r.name === f.name) || draft.referenceFiles.length >= 20) continue;
        const safe = f.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const path = `${userId}/uploads/ref_${Date.now()}_${safe}`;
        const { error } = await supabase.storage
          .from(CP_UPLOADS_BUCKET)
          .upload(path, f, { contentType: f.type || "application/octet-stream", upsert: true });
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
    } finally {
      setFileBusy(false);
      e.target.value = "";
    }
  }

  async function handleContinue() {
    setGoing(true);
    await saveNow();
    router.push("/custom-projects/estimate");
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-ink-muted">
        Showing features for <strong>{TYPE_LABELS[draft.projectType]}</strong> ·{" "}
        <strong>{LEVEL_LABELS[draft.projectLevel]}</strong>.{" "}
        <Link href="/custom-projects/start" className="underline hover:text-ink">
          Change
        </Link>
      </p>

      {grouped.map(([category, rows]) => (
        <div key={category}>
          <h2 className="text-lg text-ink">{category}</h2>
          <div className="mt-2 divide-y divide-line border-t border-line">
            {rows.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-start gap-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedSet.has(f.id)}
                  onChange={() => toggle(f.id)}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="text-sm text-ink">{f.name}</span>
                  {f.description && <span className="block text-xs text-ink-muted">{f.description}</span>}
                </span>
                <span className="whitespace-nowrap text-sm text-ink">
                  {Number(f.price) > 0 ? `+${formatINR(Number(f.price))}` : "Included"}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="border-t border-line pt-4 text-sm text-ink">
        Selected feature add-ons: <strong>{formatINR(featureSubtotal)}</strong>{" "}
        <span className="text-xs text-ink-muted">(the final estimate is calculated on the next step)</span>
      </div>

      <div>
        <h2 className="text-lg text-ink">Project image (optional)</h2>
        <input
          type="file"
          accept={CP_IMAGE_TYPES.join(",")}
          onChange={handleImage}
          disabled={imageBusy}
          className="mt-2 block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-ink"
        />
        {draft.projectImagePath && <p className="mt-1 text-xs text-success">Image attached.</p>}
      </div>

      <div>
        <h2 className="text-lg text-ink">Requirement / reference files (optional)</h2>
        <p className="text-xs text-ink-muted">PDF, DOC, DOCX, images or ZIP · up to {CP_MAX_FILE_MB} MB each.</p>
        <input
          type="file"
          multiple
          accept={CP_DOC_TYPES.join(",")}
          onChange={handleFiles}
          disabled={fileBusy}
          className="mt-2 block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-ink"
        />
        {draft.referenceFiles.length > 0 && (
          <ul className="mt-2 space-y-1">
            {draft.referenceFiles.map((r, i) => (
              <li key={r.path} className="flex items-center gap-2 text-sm text-ink">
                <span className="flex-1">
                  {r.name} <span className="text-xs text-ink-muted">({r.sizeMb} MB)</span>
                </span>
                <button
                  type="button"
                  onClick={() => update((d) => ({ ...d, referenceFiles: d.referenceFiles.filter((_, j) => j !== i) }))}
                  className="text-xs text-ink-muted underline hover:text-ink"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {uploadError && <p className="mt-2 text-xs text-danger">{uploadError}</p>}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-6">
        <Link href="/custom-projects/start" className="text-sm text-ink underline">
          Back
        </Link>
        <button
          type="button"
          onClick={handleContinue}
          disabled={going}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {going ? "Saving…" : "Continue to estimate"}
        </button>
      </div>
    </div>
  );
}

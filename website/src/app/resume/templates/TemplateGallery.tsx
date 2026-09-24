"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { EmptyState, Chip } from "@/components/ui";
import { createResumeFromTemplateAction } from "@/lib/actions/resumeBuilder";
import type { ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";
import type { ResumeRenderModel } from "@/lib/resumeBuilder/renderModel";
import { TemplateGalleryCard } from "@/components/resumeBuilder/TemplateGalleryCard";

export type TemplateDemo = { model: ResumeRenderModel; persona: string };

// The full-screen preview (with the A4 <ResumeDocumentView>) only mounts when a
// card's "Preview" is clicked — keep it out of the gallery's route bundle.
const TemplatePreviewModal = dynamic(
  () => import("@/components/resumeBuilder/TemplatePreviewModal").then((m) => m.TemplatePreviewModal),
  { ssr: false },
);

type Filter = "all" | "ats" | "modern" | "professional" | "minimal" | "creative";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ats", label: "ATS Friendly" },
  { key: "modern", label: "Modern" },
  { key: "professional", label: "Professional" },
  { key: "minimal", label: "Minimal" },
  { key: "creative", label: "Creative" },
];

export function TemplateGallery({
  templates,
  demos,
}: {
  templates: ResolvedTemplate[];
  demos: Record<string, TemplateDemo>;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [previewing, setPreviewing] = useState<ResolvedTemplate | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (filter === "all") return templates;
    if (filter === "ats") return templates.filter((t) => t.atsFriendly);
    return templates.filter((t) => t.id === filter);
  }, [templates, filter]);

  async function handleUse(templateId: string) {
    setError(null);
    setPendingId(templateId);
    const result = await createResumeFromTemplateAction(templateId);
    if (result.needsAuth) {
      router.push(`/login?next=${encodeURIComponent("/resume/templates")}`);
      return;
    }
    if (result.error || !result.resumeId) {
      setError(result.error ?? "Something went wrong. Please try again.");
      setPendingId(null);
      return;
    }
    router.push(`/account/resume/${result.resumeId}/edit`);
  }

  return (
    <div>
      <p className="eyebrow">Résumé Builder</p>
      <h1 className="h-hero mt-2">Resume templates</h1>
      <p className="lede mt-3 max-w-2xl">
        Choose a professional template and build an ATS-friendly resume. Every template previews with real content,
        and you can switch between them later without losing anything you&apos;ve written.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visible.map((t) => (
          <TemplateGalleryCard
            key={t.id}
            template={t}
            demoModel={demos[t.id]?.model}
            onPreview={setPreviewing}
            onUse={handleUse}
            pending={pendingId === t.id}
          />
        ))}
      </div>

      {visible.length === 0 && <EmptyState className="mt-8" title="No templates match that filter" subtitle="Try another filter to see more templates." />}

      {previewing && (
        <TemplatePreviewModal
          template={previewing}
          model={demos[previewing.id]?.model ?? null}
          persona={demos[previewing.id]?.persona ?? ""}
          onClose={() => setPreviewing(null)}
          onUse={handleUse}
          pending={pendingId != null}
        />
      )}
    </div>
  );
}

export default TemplateGallery;

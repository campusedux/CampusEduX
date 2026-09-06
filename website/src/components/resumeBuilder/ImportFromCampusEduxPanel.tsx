"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Check, DownloadCloud, Loader2 } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { getCampusEduxImportDataAction, type CampusEduxImportData } from "@/lib/actions/resumeBuilder";
import { emptyEntry, emptyLink, makeBlock, type ResumeContent } from "@/lib/resumeBuilder/content";
import type { ResumePersonalDetails } from "@/lib/resumeBuilder/types";

const PERSONAL_KEYS = ["fullName", "email", "phone", "location", "linkedin", "github", "website"] as const;

export interface ImportPanelHandle {
  open: () => void;
}

/**
 * Pulls what the CampusEduX profile actually has into the résumé. In normal
 * mode it only fills blank personal fields / appends sections. In
 * `replaceMode` (the résumé still holds demo content) the personal import
 * overwrites the demo values instead — still never silent, always a click.
 */
const ImportFromCampusEduxPanel = forwardRef<
  ImportPanelHandle,
  {
    personalDetails: ResumePersonalDetails;
    content: ResumeContent;
    replaceMode?: boolean;
    onApplyPersonal: (next: ResumePersonalDetails) => void;
    onApplyContent: (next: ResumeContent) => void;
  }
>(function ImportFromCampusEduxPanel({ personalDetails, content, replaceMode = false, onApplyPersonal, onApplyContent }, ref) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CampusEduxImportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useImperativeHandle(ref, () => ({ open: load }));

  async function load() {
    setOpen(true);
    if (data) return;
    setLoading(true);
    setError(null);
    const res = await getCampusEduxImportDataAction();
    setLoading(false);
    if ("error" in res) setError(res.error);
    else setData(res);
  }

  const importablePersonalKeys = data
    ? PERSONAL_KEYS.filter((k) => (replaceMode ? data.personal[k]?.trim() : !personalDetails[k]?.trim() && data.personal[k]?.trim()))
    : [];

  function fillPersonal() {
    if (!data) return;
    const next = { ...personalDetails };
    for (const k of importablePersonalKeys) next[k] = data.personal[k];
    onApplyPersonal(next);
    setDone((d) => ({ ...d, personal: true }));
  }

  function addEducation() {
    if (!data?.educationSuggestion) return;
    const entry = { ...emptyEntry(), title: data.educationSuggestion.title, subtitle: data.educationSuggestion.subtitle };
    const idx = content.findIndex((b) => b.type === "education");
    if (idx >= 0) {
      const block = content[idx];
      const next = [...content];
      next[idx] = { ...block, entries: [...(block.entries ?? []).filter((e) => e.title.trim() || e.subtitle.trim()), entry] };
      onApplyContent(next);
    } else {
      onApplyContent([...content, { ...makeBlock("education"), entries: [entry] }]);
    }
    setDone((d) => ({ ...d, education: true }));
  }

  function addCodingProfiles() {
    if (!data?.codingProfiles.length) return;
    const links = data.codingProfiles.map((c) => ({ ...emptyLink(), label: c.label || "Profile", url: c.url }));
    const idx = content.findIndex((b) => b.type === "coding_profiles");
    if (idx >= 0) {
      const block = content[idx];
      const existing = new Set((block.links ?? []).map((l) => l.url));
      const merged = [...(block.links ?? []), ...links.filter((l) => !existing.has(l.url))];
      const next = [...content];
      next[idx] = { ...block, links: merged };
      onApplyContent(next);
    } else {
      onApplyContent([...content, { ...makeBlock("coding_profiles"), links }]);
    }
    setDone((d) => ({ ...d, coding: true }));
  }

  function addProject(projectId: string) {
    const project = data?.projects.find((p) => p.id === projectId);
    if (!project) return;
    const entry = {
      ...emptyEntry(),
      title: project.title,
      subtitle: project.technologyPreference,
      description: project.description,
    };
    const idx = content.findIndex((b) => b.type === "projects");
    if (idx >= 0) {
      const block = content[idx];
      const next = [...content];
      next[idx] = { ...block, entries: [...(block.entries ?? []).filter((e) => e.title.trim()), entry] };
      onApplyContent(next);
    } else {
      onApplyContent([...content, { ...makeBlock("projects"), entries: [entry] }]);
    }
    setDone((d) => ({ ...d, [`project-${projectId}`]: true }));
  }

  return (
    <>
      <button type="button" onClick={load} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <DownloadCloud className="h-3.5 w-3.5" /> Import from CampusEduX
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Import from CampusEduX">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
          </p>
        )}
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

        {data && !loading && (
          <div className="space-y-4">
            <Row
              title="Personal details"
              detail={
                importablePersonalKeys.length
                  ? `${replaceMode ? "Replace with" : "Fill"} ${importablePersonalKeys.length} field${importablePersonalKeys.length === 1 ? "" : "s"} from your profile`
                  : "Nothing to import"
              }
              actionLabel={replaceMode ? "Replace" : "Fill"}
              disabled={importablePersonalKeys.length === 0 || done.personal}
              done={done.personal}
              onAction={fillPersonal}
            />
            {data.educationSuggestion && (
              <Row
                title="Education"
                detail={data.educationSuggestion.title}
                actionLabel="Add entry"
                disabled={done.education}
                done={done.education}
                onAction={addEducation}
              />
            )}
            {data.codingProfiles.length > 0 && (
              <Row
                title="Coding profiles"
                detail={data.codingProfiles.map((c) => c.label || c.url).join(", ")}
                actionLabel="Add section"
                disabled={done.coding}
                done={done.coding}
                onAction={addCodingProfiles}
              />
            )}
            {data.projects.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-ink">Projects</p>
                <div className="mt-2 space-y-2">
                  {data.projects.map((p) => (
                    <Row
                      key={p.id}
                      title={p.title}
                      detail={p.technologyPreference || "Finished custom project"}
                      actionLabel="Add to Projects"
                      disabled={done[`project-${p.id}`]}
                      done={done[`project-${p.id}`]}
                      onAction={() => addProject(p.id)}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}
            {!data.educationSuggestion && data.codingProfiles.length === 0 && data.projects.length === 0 && importablePersonalKeys.length === 0 && (
              <p className="text-sm text-ink-faint">Nothing new to import from your profile right now.</p>
            )}
          </div>
        )}

        <Button className="mt-4" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Done
        </Button>
      </Modal>
    </>
  );
});

export default ImportFromCampusEduxPanel;

function Row({
  title,
  detail,
  actionLabel,
  onAction,
  disabled,
  done,
  compact,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  done?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border border-line ${compact ? "px-3 py-2" : "p-3"}`}>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        <p className="truncate text-xs text-ink-faint">{detail}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary-50 disabled:opacity-40"
      >
        {done ? <Check className="h-3.5 w-3.5 text-success" /> : null}
        {done ? "Added" : actionLabel}
      </button>
    </div>
  );
}

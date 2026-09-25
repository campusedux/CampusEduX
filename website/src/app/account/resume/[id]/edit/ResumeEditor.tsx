"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, Download, Eye, Loader2, PencilRuler } from "lucide-react";
import { Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  updateResumeTemplateAction,
  updateResumeContentAction,
  updateResumePersonalDetailsAction,
  updateResumeDesignAction,
  type ResumeShare,
} from "@/lib/actions/resumeBuilder";
import {
  makeBlock,
  moveBlock,
  reorderBlocks,
  duplicateBlock,
  deleteBlock,
  updateBlock,
  toggleBlockHidden,
  decodeSectionTarget,
  type CompletionTarget,
  type ResumeContent,
  type ResumeSectionBlock,
  type SectionType,
} from "@/lib/resumeBuilder/content";
import { isEmptyDesign, type ResumeDesign } from "@/lib/resumeBuilder/design";
import type { ResumeDocument, ResumePersonalDetails } from "@/lib/resumeBuilder/types";
import SectionManagerRail from "./SectionManagerRail";
import SectionEditor from "./SectionEditor";
import ResumePreview from "./ResumePreview";
import PersonalDetailsForm from "./PersonalDetailsForm";
import CompletionChecklist from "./CompletionChecklist";
import DesignPanel from "./DesignPanel";
import ShareModal from "@/components/resumeBuilder/ShareModal";
import ImportFromCampusEduxPanel from "@/components/resumeBuilder/ImportFromCampusEduxPanel";
import DemoContentBanner from "@/components/resumeBuilder/DemoContentBanner";
import { useAutosaveField, type SaveStatus } from "./useAutosaveField";

type TemplateOption = { id: string; name: string; accentColor: string };
type ActiveId = "personal" | string;

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-danger">
        <AlertTriangle className="h-3.5 w-3.5" /> Unable to save
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-success">
      <Check className="h-3.5 w-3.5" /> Saved
    </span>
  );
}

export default function ResumeEditor({
  resume,
  templates,
  shares,
}: {
  resume: ResumeDocument;
  templates: TemplateOption[];
  shares: ResumeShare[];
}) {
  const [content, setContent] = useState<ResumeContent>(resume.content);
  const [personalDetails, setPersonalDetails] = useState<ResumePersonalDetails>(resume.personalDetails);
  const [template, setTemplate] = useState(resume.template);
  const [design, setDesign] = useState<ResumeDesign>(resume.design);
  const [isDemo, setIsDemo] = useState(resume.isDemo);
  const [activeId, setActiveId] = useState<ActiveId>("personal");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const importRef = useRef<{ open: () => void } | null>(null);
  const searchParams = useSearchParams();

  // Deep-link from the ATS "Improve …" buttons — view-state only, never mutates content.
  useEffect(() => {
    const target = decodeSectionTarget(searchParams.get("section"));
    if (target?.kind === "personal") setActiveId("personal");
    else if (target?.kind === "block" && resume.content.some((b) => b.id === target.blockId)) {
      setActiveId(target.blockId);
      setMobileTab("edit");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAutosaveField(content, (value) => updateResumeContentAction(resume.id, value), setStatus);
  useAutosaveField(personalDetails, (value) => updateResumePersonalDetailsAction(resume.id, value), setStatus);
  useAutosaveField(design, (value) => updateResumeDesignAction(resume.id, value), setStatus);

  const accentColor = templates.find((t) => t.id === template)?.accentColor ?? "#4F39F6";
  const activeBlock = activeId === "personal" ? null : content.find((b) => b.id === activeId) ?? null;

  // Keep typing at full speed: the live A4 preview re-renders the whole
  // document (buildResumeRenderModel + <ResumeDocumentView>) on every change,
  // so let React paint the keystroke first and catch the preview up at lower
  // priority. No UX change — the preview still tracks edits, just deferred.
  const previewContent = useDeferredValue(content);
  const previewDetails = useDeferredValue(personalDetails);

  async function handleTemplateChange(next: string) {
    setTemplate(next);
    setStatus("saving");
    try {
      const result = await updateResumeTemplateAction(resume.id, next);
      setStatus("ok" in result ? "saved" : "error");
    } catch {
      // Transport failure calling the Server Action — don't leave the status
      // pinned on "Saving…" (and don't throw an unhandled rejection).
      setStatus("error");
    }
  }

  function apply(next: ResumeContent) {
    setContent(next);
  }
  const patchBlock = (id: string, patch: Partial<ResumeSectionBlock>) => apply(updateBlock(content, id, patch));
  function handleAdd(type: SectionType) {
    const block = makeBlock(type);
    apply([...content, block]);
    setActiveId(block.id);
    setMobileTab("edit");
    return block.id;
  }
  function handleDelete(id: string) {
    apply(deleteBlock(content, id));
    if (activeId === id) setActiveId("personal");
  }
  function handleDuplicate(id: string) {
    apply(duplicateBlock(content, id));
  }
  function handleJump(target: CompletionTarget) {
    setMobileTab("edit");
    if (target.kind === "personal") setActiveId("personal");
    else if (target.kind === "block") setActiveId(target.blockId);
    else handleAdd(target.sectionType);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line pb-4">
        <div className="min-w-0">
          <h1 className="font-display text-[1.6rem] font-bold tracking-tight text-ink">
            {personalDetails.fullName ? `${personalDetails.fullName}'s Resume` : resume.title}
          </h1>
          <div className="mt-1">
            <SaveStatusBadge status={status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {templates.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-ink-muted">
              <PencilRuler className="h-3.5 w-3.5" />
              <Select value={template} onChange={(e) => handleTemplateChange(e.target.value)} className="w-40" aria-label="Change template">
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <DesignPanel design={design} onChange={setDesign} />
          <a href={`/api/resume/export/pdf?resumeId=${resume.id}`} className="btn-ghost h-9 px-3 text-xs">
            <Download className="h-3.5 w-3.5" aria-hidden /> PDF
          </a>
          <a href={`/api/resume/export/docx?resumeId=${resume.id}`} className="btn-ghost h-9 px-3 text-xs">
            <Download className="h-3.5 w-3.5" aria-hidden /> DOCX
          </a>
          <ImportFromCampusEduxPanel
            ref={importRef}
            replaceMode={isDemo}
            personalDetails={personalDetails}
            content={content}
            onApplyPersonal={(next) => {
              setPersonalDetails(next);
              setIsDemo(false);
            }}
            onApplyContent={(next) => {
              apply(next);
              setIsDemo(false);
            }}
          />
          <ShareModal resumeId={resume.id} initialShares={shares} />
        </div>
      </div>

      {isDemo && (
        <div className="mt-4">
          <DemoContentBanner resumeId={resume.id} onImport={() => importRef.current?.open()} onDismiss={() => setIsDemo(false)} />
        </div>
      )}

      {/* Mobile Edit / Preview toggle */}
      <div className="mt-4 flex rounded-xl border border-line p-1 lg:hidden">
        {(["edit", "preview"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold capitalize transition",
              mobileTab === tab ? "bg-primary text-white" : "text-ink-muted",
            )}
          >
            {tab === "preview" ? <Eye className="h-4 w-4" /> : <PencilRuler className="h-4 w-4" />}
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className={cn("space-y-3 lg:block", mobileTab === "edit" ? "block" : "hidden")}>
          <CompletionChecklist content={content} personal={personalDetails} onJump={handleJump} />
          <SectionManagerRail
            content={content}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id);
              setMobileTab("edit");
            }}
            onReorder={(from, to) => apply(reorderBlocks(content, from, to))}
            onMove={(id, dir) => apply(moveBlock(content, id, dir))}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onToggleHide={(id) => apply(toggleBlockHidden(content, id))}
            onRename={(id, heading) => patchBlock(id, { heading })}
            onAdd={handleAdd}
          />
        </div>

        <div className={cn("min-w-0 lg:block", mobileTab === "edit" ? "block" : "hidden")}>
          {activeId === "personal" ? (
            <PersonalDetailsForm value={personalDetails} onChange={setPersonalDetails} />
          ) : activeBlock ? (
            <SectionEditor
              key={activeBlock.id}
              block={activeBlock}
              resumeId={resume.id}
              onChange={(patch) => patchBlock(activeBlock.id, patch)}
              onToggleHide={() => apply(toggleBlockHidden(content, activeBlock.id))}
            />
          ) : (
            <p className="text-sm text-ink-faint">Select a section on the left, or add one.</p>
          )}
        </div>

        <div className={cn("min-w-0 lg:block", mobileTab === "preview" ? "block" : "hidden")}>
          <div className="lg:sticky lg:top-20">
            <ResumePreview
              personalDetails={previewDetails}
              content={previewContent}
              template={template}
              accentColor={accentColor}
              design={design}
            />
            {!isEmptyDesign(design) && <p className="mt-2 text-center text-xs text-ink-faint">Custom design applied</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

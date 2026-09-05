"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, AlertTriangle } from "lucide-react";
import { Select } from "@/components/ui";
import { updateResumeTemplateAction, updateResumeLayoutAction } from "@/lib/actions/resumeBuilder";
import { normalizeLayout, moveSection, toggleHidden, type ManageableSectionKey, type ResumeLayout } from "@/lib/resumeBuilder/sections";
import type { ResumeDocument, ResumeFreeformSectionKey } from "@/lib/resumeBuilder/types";
import { RESUME_FREEFORM_SECTIONS } from "@/lib/resumeBuilder/types";
import SectionSidebar from "./SectionSidebar";
import ResumePreview from "./ResumePreview";
import PersonalDetailsForm from "./PersonalDetailsForm";
import EducationEditor from "./EducationEditor";
import SkillsEditor from "./SkillsEditor";
import FreeformSectionEditor from "./FreeformSectionEditor";
import type { SaveStatus } from "./useAutosaveField";

type ActiveSection = "personal" | ManageableSectionKey;
type TemplateOption = { id: string; name: string; accentColor: string };

const FREEFORM_KEY_SET = new Set<string>(RESUME_FREEFORM_SECTIONS);

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

export default function ResumeEditor({ resume: initialResume, templates }: { resume: ResumeDocument; templates: TemplateOption[] }) {
  const [resume, setResume] = useState(initialResume);
  const [layout, setLayout] = useState<ResumeLayout>(() => normalizeLayout(initialResume.layout));
  const [active, setActive] = useState<ActiveSection>("personal");
  const [status, setStatus] = useState<SaveStatus>("idle");

  const activeTemplate = templates.find((t) => t.id === resume.template) ?? templates[0];

  async function handleTemplateChange(templateId: string) {
    setResume((r) => ({ ...r, template: templateId }));
    setStatus("saving");
    const result = await updateResumeTemplateAction(resume.id, templateId);
    setStatus("ok" in result ? "saved" : "error");
  }

  function persistLayout(next: ResumeLayout) {
    setLayout(next);
    setStatus("saving");
    updateResumeLayoutAction(resume.id, next).then((result) => setStatus("ok" in result ? "saved" : "error"));
  }

  const handleMove = (key: ManageableSectionKey, direction: "up" | "down") => persistLayout({ ...layout, order: moveSection(layout.order, key, direction) });
  const handleToggleHide = (key: ManageableSectionKey) => persistLayout({ ...layout, hidden: toggleHidden(layout.hidden, key) });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <Link href="/account/resume" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to your resumes
          </Link>
          <h1 className="mt-1 text-xl font-bold text-ink">{resume.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <SaveStatusBadge status={status} />
          {templates.length > 0 && (
            <Select value={resume.template} onChange={(e) => handleTemplateChange(e.target.value)} className="w-44">
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr_1fr]">
        <SectionSidebar active={active} onSelect={setActive} layout={layout} onMove={handleMove} onToggleHide={handleToggleHide} />

        <div key={active}>
          {active === "personal" && (
            <PersonalDetailsForm
              resumeId={resume.id}
              initial={resume.personalDetails}
              onStatusChange={setStatus}
              onChange={(details) => setResume((r) => ({ ...r, personalDetails: details }))}
            />
          )}
          {active === "education" && (
            <EducationEditor
              resumeId={resume.id}
              initial={resume.education}
              onStatusChange={setStatus}
              onChange={(education) => setResume((r) => ({ ...r, education }))}
            />
          )}
          {active === "skills" && (
            <SkillsEditor resumeId={resume.id} initial={resume.skills} onStatusChange={setStatus} onChange={(skills) => setResume((r) => ({ ...r, skills }))} />
          )}
          {FREEFORM_KEY_SET.has(active) && (
            <FreeformSectionEditor
              resumeId={resume.id}
              sectionKey={active as ResumeFreeformSectionKey}
              initial={resume.sections[active as ResumeFreeformSectionKey]}
              currentSections={resume.sections}
              onStatusChange={setStatus}
              onChange={(content) => setResume((r) => ({ ...r, sections: { ...r.sections, [active]: content } }))}
            />
          )}
        </div>

        <div className="hidden lg:block">
          <ResumePreview resume={resume} layout={layout} accentColor={activeTemplate?.accentColor ?? "#4F39F6"} />
        </div>
      </div>
    </div>
  );
}

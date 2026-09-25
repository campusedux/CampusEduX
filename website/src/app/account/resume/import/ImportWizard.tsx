"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Plus } from "lucide-react";
import { Field, Input, Textarea, Button } from "@/components/ui";
import { createResumeFromImportAction } from "@/lib/actions/resumeBuilder";
import { RESUME_MAX_MB } from "@/lib/resume";
import type { ParsedResumeResult } from "@/lib/resumeBuilder/parser";
import type { ResumeEducationEntry } from "@/lib/resumeBuilder/types";

const MAX_FILE_MB = RESUME_MAX_MB;

type ReviewState = {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  education: ResumeEducationEntry[];
  skillsText: string;
  sections: Record<string, string>;
  unrecognizedText: string;
};

function toReviewState(parsed: ParsedResumeResult): ReviewState {
  return {
    fullName: parsed.contact.fullName ?? "",
    jobTitle: "",
    email: parsed.contact.email ?? "",
    phone: parsed.contact.phone ?? "",
    location: "",
    linkedin: parsed.contact.linkedin ?? "",
    website: parsed.contact.website ?? parsed.contact.github ?? "",
    education: parsed.education,
    skillsText: parsed.skills.join(", "),
    sections: parsed.sections as Record<string, string>,
    unrecognizedText: parsed.unrecognizedText,
  };
}

const SECTION_LABELS: Record<string, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
  references: "References",
};

export default function ImportWizard() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setExtractError(null);
    const picked = e.target.files?.[0] ?? null;
    if (picked && picked.size > MAX_FILE_MB * 1024 * 1024) {
      setExtractError(`That file is over ${MAX_FILE_MB} MB. Please upload a smaller file.`);
      setFile(null);
      return;
    }
    setFile(picked);
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) {
        setExtractError(body.error ?? "Couldn't read that file. Please try again.");
        return;
      }
      setReview(toReviewState(body.parsed));
    } catch {
      setExtractError("Couldn't read that file. Please try again.");
    } finally {
      setExtracting(false);
    }
  }

  function updateEducation(id: string, field: keyof ResumeEducationEntry, value: string) {
    setReview((r) => (r ? { ...r, education: r.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)) } : r));
  }

  function removeEducation(id: string) {
    setReview((r) => (r ? { ...r, education: r.education.filter((e) => e.id !== id) } : r));
  }

  function addEducation() {
    setReview((r) =>
      r
        ? { ...r, education: [...r.education, { id: `manual-${Date.now()}`, degree: "", institution: "", startYear: "", endYear: "", percentage: "" }] }
        : r,
    );
  }

  function updateSection(key: string, value: string) {
    setReview((r) => (r ? { ...r, sections: { ...r.sections, [key]: value } } : r));
  }

  async function handleImport() {
    if (!review) return;
    setImporting(true);
    setImportError(null);
    const result = await createResumeFromImportAction({
      fullName: review.fullName,
      jobTitle: review.jobTitle,
      email: review.email,
      phone: review.phone,
      location: review.location,
      linkedin: review.linkedin,
      website: review.website,
      education: review.education,
      technicalSkills: review.skillsText.split(",").map((s) => s.trim()).filter(Boolean),
      sections: review.sections,
    });
    setImporting(false);
    if ("error" in result) {
      setImportError(result.error);
      return;
    }
    router.push(`/account/resume/${result.resumeId}/edit`);
  }

  if (!review) {
    return (
      <div className="mt-6 space-y-4 rounded-2xl border border-line bg-card p-6">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line px-6 py-10 text-center hover:border-primary/40">
          <Upload className="h-6 w-6 text-ink-faint" />
          <span className="text-sm font-medium text-ink">{file ? file.name : "Choose a PDF or DOCX file"}</span>
          <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} />
        </label>
        {extractError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{extractError}</p>}
        <Button onClick={handleExtract} loading={extracting} disabled={!file}>
          {extracting ? "Reading file…" : "Extract resume data"}
        </Button>
      </div>
    );
  }

  const sectionKeys = Object.keys(review.sections).filter((k) => review.sections[k]?.trim());

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-line bg-card p-6">
        <h2 className="text-lg font-bold text-ink">Review before importing</h2>
        <p className="mt-1 text-sm text-ink-muted">Edit anything that looks wrong — nothing is saved until you import.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="im-name">
            <Input id="im-name" value={review.fullName} onChange={(e) => setReview({ ...review, fullName: e.target.value })} />
          </Field>
          <Field label="Job title" htmlFor="im-title">
            <Input id="im-title" value={review.jobTitle} onChange={(e) => setReview({ ...review, jobTitle: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="im-email">
            <Input id="im-email" value={review.email} onChange={(e) => setReview({ ...review, email: e.target.value })} />
          </Field>
          <Field label="Phone" htmlFor="im-phone">
            <Input id="im-phone" value={review.phone} onChange={(e) => setReview({ ...review, phone: e.target.value })} />
          </Field>
          <Field label="Location" htmlFor="im-location">
            <Input id="im-location" value={review.location} onChange={(e) => setReview({ ...review, location: e.target.value })} />
          </Field>
          <Field label="LinkedIn" htmlFor="im-linkedin">
            <Input id="im-linkedin" value={review.linkedin} onChange={(e) => setReview({ ...review, linkedin: e.target.value })} />
          </Field>
          <Field label="Website / portfolio" htmlFor="im-website">
            <Input id="im-website" value={review.website} onChange={(e) => setReview({ ...review, website: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink">Education</h3>
          <button type="button" onClick={addEducation} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {review.education.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">None detected — add entries manually if needed.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {review.education.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <Input placeholder="Degree" value={entry.degree} onChange={(e) => updateEducation(entry.id, "degree", e.target.value)} />
                  <Input placeholder="Institution" value={entry.institution} onChange={(e) => updateEducation(entry.id, "institution", e.target.value)} />
                  <Input placeholder="Start year" value={entry.startYear} onChange={(e) => updateEducation(entry.id, "startYear", e.target.value)} />
                  <Input placeholder="End year" value={entry.endYear} onChange={(e) => updateEducation(entry.id, "endYear", e.target.value)} />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeEducation(entry.id)} aria-label="Remove entry">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-card p-6">
        <h3 className="font-bold text-ink">Skills</h3>
        <p className="mt-1 text-xs text-ink-muted">Comma-separated. You can re-categorize technical vs. soft skills after importing.</p>
        <Textarea
          rows={2}
          className="mt-2"
          value={review.skillsText}
          onChange={(e) => setReview({ ...review, skillsText: e.target.value })}
        />
      </div>

      {sectionKeys.map((key) => (
        <div key={key} className="rounded-2xl border border-line bg-card p-6">
          <h3 className="font-bold text-ink">{SECTION_LABELS[key] ?? key}</h3>
          <Textarea rows={6} className="mt-2" value={review.sections[key]} onChange={(e) => updateSection(key, e.target.value)} />
        </div>
      ))}

      {review.unrecognizedText && (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-bold text-ink">Couldn&apos;t categorize this text</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Copy anything relevant into the right section above — nothing from your file is discarded automatically.
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{review.unrecognizedText}</pre>
        </div>
      )}

      {importError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{importError}</p>}

      <div className="flex items-center gap-4">
        <Button onClick={handleImport} loading={importing}>
          {importing ? "Importing…" : "Import into Resume Builder"}
        </Button>
        <button type="button" onClick={() => setReview(null)} className="text-sm text-ink-muted hover:text-ink">
          Start over
        </button>
      </div>
    </div>
  );
}

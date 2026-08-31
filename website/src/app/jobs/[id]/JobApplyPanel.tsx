"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { applyToJobAction, toggleSaveJobAction } from "@/lib/actions/jobs";
import {
  RESUME_EXTENSIONS,
  RESUME_MAX_BYTES,
  RESUME_MAX_MB,
  RESUME_MIME_TYPES,
  RESUME_STORAGE_BUCKET,
  fileExtension,
  resumeStoragePath,
} from "@/lib/resume";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui";

type ResumeRow = { id: string; file_name: string; uploaded_at: string };
type AppliedInfo = { status: string; created_at: string };

const STATUS_LABEL: Record<string, string> = {
  in_review: "In review",
  shortlisted: "Shortlisted",
  rejected: "Not selected",
  hired: "Hired",
};

const ACCEPT_ATTR = [...RESUME_EXTENSIONS, ...RESUME_MIME_TYPES].join(",");

export default function JobApplyPanel({ jobId }: { jobId: string }) {
  const [phase, setPhase] = useState<"loading" | "anon" | "ready">("loading");
  const userIdRef = useRef<string | null>(null);

  const [applied, setApplied] = useState<AppliedInfo | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [mode, setMode] = useState<"existing" | "upload">("upload");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPhase("anon");
      return;
    }
    userIdRef.current = user.id;

    const [appliedRes, savedRes, resumesRes] = await Promise.all([
      supabase.from("applications").select("status,created_at").eq("job_id", jobId).eq("user_id", user.id).maybeSingle(),
      supabase.from("saved_jobs").select("job_id").eq("job_id", jobId).eq("user_id", user.id).maybeSingle(),
      supabase.from("resumes").select("id,file_name,uploaded_at").eq("user_id", user.id).order("uploaded_at", { ascending: false }),
    ]);

    if (appliedRes.data) setApplied({ status: appliedRes.data.status, created_at: appliedRes.data.created_at });
    setIsSaved(!!savedRes.data);
    const rows = (resumesRes.data ?? []) as ResumeRow[];
    setResumes(rows);
    if (rows.length > 0) {
      setMode("existing");
      setSelectedResumeId(rows[0].id);
    }
    setPhase("ready");
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleSave() {
    setSavePending(true);
    setSaveError(null);
    const result = await toggleSaveJobAction(jobId);
    setSavePending(false);
    if ("error" in result) {
      setSaveError(result.error);
      return;
    }
    setIsSaved(result.saved);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    setSubmitError(null);
    const picked = e.target.files?.[0] ?? null;
    if (!picked) {
      setFile(null);
      return;
    }
    if (!(RESUME_EXTENSIONS as readonly string[]).includes(fileExtension(picked.name))) {
      setFile(null);
      setFileError("Please choose a PDF, DOC or DOCX file.");
      return;
    }
    if (picked.size > RESUME_MAX_BYTES) {
      setFile(null);
      setFileError(`That file is over ${RESUME_MAX_MB} MB. Please upload a smaller file.`);
      return;
    }
    setFile(picked);
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      let result;
      if (mode === "existing") {
        if (!selectedResumeId) {
          setSubmitError("Pick a resume to apply with.");
          return;
        }
        result = await applyToJobAction({ jobId, resumeId: selectedResumeId });
      } else {
        if (!file) {
          setSubmitError("Choose a resume file to upload.");
          return;
        }
        const userId = userIdRef.current;
        if (!userId) {
          setSubmitError("Your session expired. Please sign in again.");
          return;
        }
        const supabase = createBrowserSupabase();
        const path = resumeStoragePath(userId, file.name);
        const { error: uploadError } = await supabase.storage
          .from(RESUME_STORAGE_BUCKET)
          .upload(path, file, { contentType: file.type || "application/pdf", upsert: true });
        if (uploadError) {
          setSubmitError(`Upload failed: ${uploadError.message}`);
          return;
        }
        result = await applyToJobAction({ jobId, newResume: { storagePath: path, fileName: file.name } });
      }

      if ("error" in result) {
        setSubmitError(result.error);
        return;
      }
      setApplied({ status: "in_review", created_at: new Date().toISOString() });
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  // ---- render ------------------------------------------------------------
  if (phase === "loading") {
    return <div className="mt-10 border-t border-line pt-6 text-sm text-ink-muted">Loading your application options…</div>;
  }

  if (phase === "anon") {
    return (
      <div className="mt-10 border-t border-line pt-6">
        <p className="text-sm text-ink-muted">Sign in to apply for this role or save it for later.</p>
        <div className="mt-3">
          <Button href={`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`}>Sign in to apply</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-line pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          onClick={handleToggleSave}
          disabled={savePending}
          leftIcon={isSaved ? BookmarkCheck : Bookmark}
        >
          {savePending ? "Saving…" : isSaved ? "Saved — remove" : "Save job"}
        </Button>
        {isSaved && (
          <Link href="/account/saved-jobs" className="text-xs text-ink-muted underline hover:text-ink">
            View saved jobs
          </Link>
        )}
      </div>
      {saveError && <p className="mt-2 text-sm text-danger">{saveError}</p>}

      <div className="mt-6">
        {applied ? (
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="font-bold text-ink">Application submitted</div>
            <p className="mt-1 text-sm text-ink-muted">
              Status: {STATUS_LABEL[applied.status] ?? applied.status} · Applied {timeAgo(applied.created_at)}.
            </p>
            <Link href="/account/applications" className="mt-2 inline-block text-xs font-semibold text-primary underline">
              Track it in your account
            </Link>
          </div>
        ) : (
          <form onSubmit={handleApply} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="font-bold text-ink">Apply with your resume</div>

            {resumes.length > 0 && (
              <label className="mt-3 flex items-center gap-2 text-sm text-ink">
                <input type="radio" name="resume-mode" checked={mode === "existing"} onChange={() => setMode("existing")} />
                Use a resume already on your account
              </label>
            )}

            {resumes.length > 0 && mode === "existing" && (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.file_name} — uploaded {timeAgo(r.uploaded_at)}
                  </option>
                ))}
              </select>
            )}

            {resumes.length > 0 && (
              <label className="mt-3 flex items-center gap-2 text-sm text-ink">
                <input type="radio" name="resume-mode" checked={mode === "upload"} onChange={() => setMode("upload")} />
                Upload a new file
              </label>
            )}

            {(resumes.length === 0 || mode === "upload") && (
              <div className="mt-2">
                <input
                  type="file"
                  accept={ACCEPT_ATTR}
                  onChange={handleFileChange}
                  className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
                />
                <p className="mt-1 text-xs text-ink-faint">PDF, DOC or DOCX · up to {RESUME_MAX_MB} MB</p>
                {fileError && <p className="mt-1 text-xs text-danger">{fileError}</p>}
              </div>
            )}

            {submitError && <p className="mt-3 text-sm text-danger">{submitError}</p>}

            <div className="mt-4">
              <Button type="submit" loading={submitting}>
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              Your resume is stored privately and shared only with this employer&apos;s review team.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

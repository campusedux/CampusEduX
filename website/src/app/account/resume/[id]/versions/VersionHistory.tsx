"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, RotateCcw, Save } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { createResumeVersionAction, restoreResumeVersionAction, type ResumeVersion } from "@/lib/actions/resumeBuilder";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function VersionHistory({ resumeId, initialVersions }: { resumeId: string; initialVersions: ResumeVersion[] }) {
  const router = useRouter();
  const [versions, setVersions] = useState(initialVersions);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { listResumeVersionsAction } = await import("@/lib/actions/resumeBuilder");
    const result = await listResumeVersionsAction(resumeId);
    if (!("error" in result)) setVersions(result);
  }

  async function handleSaveVersion() {
    setSaving(true);
    setError(null);
    const result = await createResumeVersionAction(resumeId, label.trim() || "Manual save");
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setLabel("");
    await refresh();
  }

  async function handleRestore(versionId: string) {
    if (!window.confirm("Restore this version? Your current content will be saved as a new version first, so you can undo this.")) {
      return;
    }
    setRestoringId(versionId);
    setError(null);
    const result = await restoreResumeVersionAction(versionId);
    setRestoringId(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/account/resume/${resumeId}/edit`);
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4">
        <div className="flex-1">
          <Input
            placeholder="Optional label (e.g. Before applying to Acme)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={handleSaveVersion} loading={saving}>
          <Save className="h-3.5 w-3.5" /> Save current as a version
        </Button>
      </div>

      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      {versions.length === 0 ? (
        <p className="text-sm text-ink-faint">No versions saved yet.</p>
      ) : (
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-ink-faint" />
                <div>
                  <p className="text-sm font-medium text-ink">{v.label || "Untitled version"}</p>
                  <p className="text-xs text-ink-faint">{formatDate(v.createdAt)}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={restoringId === v.id}
                onClick={() => handleRestore(v.id)}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" /> {restoringId === v.id ? "Restoring…" : "Restore"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

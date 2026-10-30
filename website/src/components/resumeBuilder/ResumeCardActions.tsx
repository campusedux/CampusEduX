"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { duplicateResumeAction, deleteResumeAction } from "@/lib/actions/resumeBuilder";

/** Duplicate / Delete for a resume card. Delete is behind a confirm modal; both refresh the list. */
export default function ResumeCardActions({ resumeId, title }: { resumeId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"dup" | "del" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function duplicate() {
    if (busy) return;
    setBusy("dup");
    setError(null);
    try {
      const res = await duplicateResumeAction(resumeId);
      setBusy(null);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push(`/account/resume/${res.resumeId}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy("del");
    setError(null);
    try {
      const res = await deleteResumeAction(resumeId);
      setBusy(null);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button type="button" onClick={duplicate} disabled={busy != null} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50">
        {busy === "dup" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />} Duplicate
      </button>
      <button type="button" onClick={() => setConfirmOpen(true)} disabled={busy != null} className="flex items-center gap-1 text-xs font-semibold text-danger hover:underline disabled:opacity-50">
        <Trash2 className="h-3 w-3" /> Delete
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete this resume?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={remove} loading={busy === "del"}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          &ldquo;{title}&rdquo; and its version history will be permanently removed. This can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}

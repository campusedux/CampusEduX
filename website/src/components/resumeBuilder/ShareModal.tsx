"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Check, Trash2, Share2 } from "lucide-react";

// `qrcode.react` (~8 kB gz) is only ever painted inside this modal, on an
// active share row — load it on demand instead of shipping it in the résumé
// editor's route bundle.
const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="h-[120px] w-[120px] animate-pulse rounded bg-line/50" aria-hidden />,
});
import { Button, Modal } from "@/components/ui";
import {
  createResumeShareAction,
  toggleResumeShareAction,
  deleteResumeShareAction,
  type ResumeShare,
} from "@/lib/actions/resumeBuilder";
import { absoluteUrl } from "@/lib/seo";

function shareUrl(token: string): string {
  return absoluteUrl(`/r/${token}`);
}

function ShareRow({ share, onChange, onError }: { share: ResumeShare; onChange: () => Promise<void>; onError: (message: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = shareUrl(share.token);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await toggleResumeShareAction(share.id, !share.isActive);
      if ("error" in result) { onError(result.error); return; }
      await onChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await deleteResumeShareAction(share.id);
      if ("error" in result) { onError(result.error); return; }
      await onChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink">{url}</p>
          <p className="text-xs text-ink-faint">
            {share.isActive ? "Active" : "Disabled"} · {share.viewCount} view{share.viewCount === 1 ? "" : "s"}
          </p>
        </div>
        <button type="button" onClick={copy} className="rounded-lg border border-line p-2 text-ink hover:bg-surface" aria-label="Copy link">
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      {share.isActive && (
        <div className="mt-3 flex justify-center rounded-lg bg-white p-3">
          <QRCodeSVG value={url} size={120} />
        </div>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button type="button" disabled={busy} onClick={toggle} className="text-xs font-semibold text-primary hover:underline disabled:opacity-50">
          {share.isActive ? "Disable link" : "Re-enable link"}
        </button>
        <button type="button" disabled={busy} onClick={remove} className="flex items-center gap-1 text-xs font-semibold text-danger hover:underline disabled:opacity-50">
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>
    </div>
  );
}

export default function ShareModal({ resumeId, initialShares }: { resumeId: string; initialShares: ResumeShare[] }) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState(initialShares);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    // Re-fetching the full list keeps view counts/active state accurate after any change.
    const { listResumeSharesAction } = await import("@/lib/actions/resumeBuilder");
    const result = await listResumeSharesAction(resumeId);
    if ("error" in result) setError(result.error);
    else setShares(result);
  }

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const result = await createResumeShareAction(resumeId);
      setCreating(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setShares((prev) => [result, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <Share2 className="h-3.5 w-3.5" /> Share
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Share this resume">
        <p className="text-sm text-ink-muted">
          Anyone with a link can view a read-only version of this resume — no CampusEduX account needed. Disable or delete a
          link anytime to revoke access immediately.
        </p>

        <div className="mt-4 space-y-3">
          {shares.length === 0 ? (
            <p className="text-sm text-ink-faint">No share links yet.</p>
          ) : (
            shares.map((share) => <ShareRow key={share.id} share={share} onChange={refresh} onError={setError} />)
          )}
        </div>

        {error && <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

        <Button className="mt-4" size="sm" onClick={handleCreate} loading={creating}>
          Create new link
        </Button>
      </Modal>
    </>
  );
}

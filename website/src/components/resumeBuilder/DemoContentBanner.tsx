"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2 } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { clearResumeContentAction, setResumeDemoDismissedAction } from "@/lib/actions/resumeBuilder";

/**
 * Shown while a résumé still holds a template's demo persona. Gives the
 * student explicit control — Clear / Import their real profile / "it's mine
 * now" — so demo and real data are never silently mixed.
 */
export default function DemoContentBanner({
  resumeId,
  onImport,
  onDismiss,
}: {
  resumeId: string;
  /** open the Import-from-CampusEduX flow */
  onImport: () => void;
  /** called after "This is mine" / "Clear" so the editor can drop the banner (+ reload on clear) */
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"clear" | "keep" | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  async function clearDemo() {
    setBusy("clear");
    await clearResumeContentAction(resumeId);
    setBusy(null);
    setConfirmClear(false);
    onDismiss();
    router.refresh();
  }

  async function keep() {
    setBusy("keep");
    await setResumeDemoDismissedAction(resumeId);
    setBusy(null);
    onDismiss();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-ink">
          <Info className="h-4 w-4 text-warning" /> This is demo content — replace it with your own.
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onImport} className="font-semibold text-primary hover:underline">
            Import my CampusEduX profile
          </button>
          <button type="button" onClick={() => setConfirmClear(true)} className="font-semibold text-primary hover:underline">
            Clear demo content
          </button>
          <button type="button" onClick={keep} disabled={busy != null} className="inline-flex items-center gap-1 font-semibold text-ink-muted hover:text-ink disabled:opacity-50">
            {busy === "keep" && <Loader2 className="h-3 w-3 animate-spin" />} This is mine
          </button>
        </div>
      </div>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear the demo content?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={clearDemo} loading={busy === "clear"}>
              Clear everything
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Every section resets to empty and the personal details are wiped, so you can start from scratch. The
          template and any design changes stay. This can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}

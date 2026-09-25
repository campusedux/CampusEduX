"use client";

import { useState } from "react";
import { Sparkles, Check, X, Pencil } from "lucide-react";
import { Textarea, Button } from "@/components/ui";
import type { AssistSection } from "@/lib/resumeBuilder/aiAssist";

export interface AssistQuickAction {
  label: string;
  instruction: string;
}

/**
 * Shared AI-assist UI: pick a quick action, review the suggestion next to
 * the original, then Accept / Reject / Edit-then-accept. This is the ONLY
 * place a suggestion can flow into the resume — it never happens silently.
 */
export default function ResumeAIAssistPanel({
  resumeId,
  section,
  currentText,
  quickActions,
  jdText,
  onAccept,
}: {
  resumeId: string;
  section: AssistSection;
  currentText: string;
  quickActions: AssistQuickAction[];
  jdText?: string;
  onAccept: (newText: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [editedSuggestion, setEditedSuggestion] = useState("");
  const [editing, setEditing] = useState(false);

  async function requestSuggestion(instruction: string) {
    setOpen(true);
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setEditing(false);
    try {
      const res = await fetch("/api/resume/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, section, currentText, instruction, jdText }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't get a suggestion. Please try again.");
        return;
      }
      setSuggestion(body.suggestion);
      setEditedSuggestion(body.suggestion);
    } catch {
      setError("Couldn't get a suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    onAccept(editing ? editedSuggestion : suggestion ?? "");
    reset();
  }

  function reset() {
    setOpen(false);
    setSuggestion(null);
    setError(null);
    setEditing(false);
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => requestSuggestion(action.instruction)}
            className="flex items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-medium text-ink hover:border-primary/40 hover:bg-primary-50"
          >
            <Sparkles className="h-3 w-3 text-primary" /> {action.label}
          </button>
        ))}
      </div>

      {open && (
        <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
          {loading && <p className="text-sm text-ink-muted">Thinking…</p>}
          {error && <p className="text-sm font-medium text-danger">{error}</p>}

          {suggestion && !loading && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Original</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{currentText || "(empty)"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Suggested</p>
                {editing ? (
                  <Textarea rows={5} className="mt-1" value={editedSuggestion} onChange={(e) => setEditedSuggestion(e.target.value)} />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{suggestion}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={handleAccept}>
                  <Check className="h-3.5 w-3.5" /> Accept
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing((v) => !v)}>
                  <Pencil className="h-3.5 w-3.5" /> {editing ? "Preview" : "Edit"}
                </Button>
                <Button size="sm" variant="ghost" onClick={reset}>
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { Check, CircleAlert } from "lucide-react";
import { completionItems, type CompletionTarget, type ResumeContent } from "@/lib/resumeBuilder/content";
import type { ResumePersonalDetails } from "@/lib/resumeBuilder/types";

/**
 * The résumé-completion checklist. Every unfinished item is a button that
 * jumps the editor straight to the section that needs work.
 */
export default function CompletionChecklist({
  content,
  personal,
  onJump,
}: {
  content: ResumeContent;
  personal: ResumePersonalDetails;
  onJump: (target: CompletionTarget) => void;
}) {
  const items = completionItems(content, personal);
  const done = items.filter((i) => i.done).length;

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="flex items-center justify-between text-xs font-semibold text-ink">
        <span>Completion</span>
        <span className="tabular-nums text-ink-muted">
          {done}/{items.length}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round((done / items.length) * 100)}%` }} />
      </div>
      <ul className="mt-2.5 space-y-1">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => onJump(item.target)}
              disabled={item.done}
              className="flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs disabled:cursor-default enabled:hover:bg-surface"
            >
              {item.done ? (
                <Check className="h-3.5 w-3.5 flex-shrink-0 text-success" />
              ) : (
                <CircleAlert className="h-3.5 w-3.5 flex-shrink-0 text-warning" />
              )}
              <span className={item.done ? "text-ink-faint" : "font-medium text-ink"}>{item.label}</span>
              {!item.done && <span className="ml-auto text-[0.65rem] text-primary">Fix →</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

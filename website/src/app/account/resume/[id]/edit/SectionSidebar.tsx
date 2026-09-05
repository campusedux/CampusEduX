"use client";

import { ChevronUp, ChevronDown, Eye, EyeOff, User } from "lucide-react";
import { SECTION_LABELS, type ManageableSectionKey, type ResumeLayout } from "@/lib/resumeBuilder/sections";
import { cn } from "@/lib/cn";

type ActiveSection = "personal" | ManageableSectionKey;

export default function SectionSidebar({
  active,
  onSelect,
  layout,
  onMove,
  onToggleHide,
}: {
  active: ActiveSection;
  onSelect: (key: ActiveSection) => void;
  layout: ResumeLayout;
  onMove: (key: ManageableSectionKey, direction: "up" | "down") => void;
  onToggleHide: (key: ManageableSectionKey) => void;
}) {
  return (
    <nav className="space-y-1 lg:sticky lg:top-20 lg:self-start">
      <button
        type="button"
        onClick={() => onSelect("personal")}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
          active === "personal" ? "bg-primary text-white" : "text-ink hover:bg-surface",
        )}
      >
        <User className="h-4 w-4" aria-hidden />
        Personal Details
      </button>

      <div className="pt-2">
        {layout.order.map((key, index) => {
          const isHidden = layout.hidden.includes(key);
          const isActive = active === key;
          return (
            <div
              key={key}
              className={cn(
                "group flex items-center gap-1 rounded-xl px-1.5 py-1 text-sm transition",
                isActive ? "bg-primary/10" : "hover:bg-surface",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(key)}
                className={cn("flex-1 truncate rounded-lg px-2 py-1 text-left", isActive ? "font-semibold text-primary" : "text-ink", isHidden && "text-ink-faint")}
              >
                {SECTION_LABELS[key]}
                {isHidden && <span className="ml-1.5 text-xs text-ink-faint">(hidden)</span>}
              </button>
              <button
                type="button"
                aria-label={isHidden ? `Show ${SECTION_LABELS[key]}` : `Hide ${SECTION_LABELS[key]}`}
                onClick={() => onToggleHide(key)}
                className="rounded p-1 text-ink-faint hover:bg-white hover:text-ink"
              >
                {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                aria-label={`Move ${SECTION_LABELS[key]} up`}
                disabled={index === 0}
                onClick={() => onMove(key, "up")}
                className="rounded p-1 text-ink-faint hover:bg-white hover:text-ink disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Move ${SECTION_LABELS[key]} down`}
                disabled={index === layout.order.length - 1}
                onClick={() => onMove(key, "down")}
                className="rounded p-1 text-ink-faint hover:bg-white hover:text-ink disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

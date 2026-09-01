"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Slide-in panel. Used by the mobile navigation drawer (P3) and `FilterSheet`.
 * Handles Esc-to-close, backdrop click, and body-scroll lock.
 */
export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right" | "bottom";
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const panelPos =
    side === "left"
      ? cn("inset-y-0 left-0 h-full w-[86%] max-w-sm", open ? "translate-x-0" : "-translate-x-full")
      : side === "right"
        ? cn("inset-y-0 right-0 h-full w-[86%] max-w-sm", open ? "translate-x-0" : "translate-x-full")
        : cn("inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl", open ? "translate-y-0" : "translate-y-full");

  return (
    <div
      className={cn("fixed inset-0 z-[100]", open ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute flex flex-col bg-white shadow-card-lg transition-transform duration-200 ease-out motion-reduce:transition-none",
          panelPos,
          className,
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-bold text-ink">{title}</span>
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-ink-muted hover:bg-surface">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Drawer;

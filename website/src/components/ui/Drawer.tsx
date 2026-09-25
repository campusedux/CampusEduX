"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Slide-in panel. Used by the mobile navigation drawer (P3) and `FilterSheet`.
 * Handles Esc-to-close, backdrop click, and body-scroll lock.
 *
 * Portals to `document.body`: the header (its parent chain for `MobileNav`)
 * has `backdrop-blur`, and any ancestor with `backdrop-filter`/`filter`
 * establishes a containing block for `position: fixed` descendants — without
 * the portal this panel is clipped to the header's own box instead of
 * covering the viewport.
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  if (!mounted) return null;

  const panelPos =
    side === "left"
      ? cn("inset-y-0 left-0 h-full w-[86%] max-w-sm", open ? "translate-x-0" : "-translate-x-full")
      : side === "right"
        ? cn("inset-y-0 right-0 h-full w-[86%] max-w-sm", open ? "translate-x-0" : "translate-x-full")
        : cn("inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl", open ? "translate-y-0" : "translate-y-full");

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100]",
        // Closed: invisible (after the slide-out finishes) so nothing inside is focusable.
        open ? "pointer-events-auto visible" : "pointer-events-none invisible transition-[visibility] duration-200",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-scrim/60 backdrop-blur-[2px] transition-opacity motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute flex flex-col bg-card shadow-card-lg transition-transform duration-200 ease-out motion-reduce:transition-none",
          panelPos,
          className,
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-bold text-ink">{title}</span>
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-2.5 text-ink-muted hover:bg-surface">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default Drawer;

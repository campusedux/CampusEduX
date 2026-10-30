"use client";

import { X } from "lucide-react";
import { useDialog } from "@/lib/useDialog";
import { cn } from "@/lib/cn";

/**
 * Centered dialog. Esc-to-close, backdrop click, body-scroll lock,
 * `role="dialog" aria-modal`. Keep content short — this is for confirmations
 * and small forms, not full pages.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  ariaLabel,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Accessible name when there's no visible `title`. */
  ariaLabel?: string;
  className?: string;
}) {
  const dialogRef = useDialog(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-scrim/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? ariaLabel}
        className={cn(
          "relative max-h-[100dvh] overflow-y-auto sm:max-h-[calc(100dvh-3rem)] w-full max-w-lg animate-slide-up rounded-t-3xl border border-line bg-card shadow-card-lg sm:animate-scale-in sm:rounded-3xl",
          className,
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-2.5 text-ink-muted hover:bg-surface">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;

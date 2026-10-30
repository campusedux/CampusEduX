"use client";

import { useEffect, useRef, type RefObject } from "react";

const dialogs: HTMLElement[] = [];
let previousOverflow = "";

/** Share the lock and focus stack so closing one overlay cannot unlock another. */
export function useDialog(open: boolean, onClose: () => void, returnFocus?: RefObject<HTMLElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const panel = ref.current;
    if (!open || !panel) return;
    // Auto-focused children can receive focus before this effect runs.
    const previousFocus = returnFocus?.current ?? document.activeElement as HTMLElement | null;
    if (!dialogs.length) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialogs.push(panel);
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]',
    )).filter((el) => el.tabIndex >= 0 && !el.matches(':disabled') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
    const focusFirst = () => (focusable()[0] ?? panel).focus({ preventScroll: true });
    if (!panel.contains(document.activeElement)) focusFirst();
    const onFocus = (event: FocusEvent) => {
      if (dialogs.at(-1) === panel && !panel.contains(event.target as Node)) focusFirst();
    };
    const onKey = (event: KeyboardEvent) => {
      if (dialogs.at(-1) !== panel || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      } else if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements.at(-1);
        if (!first || (event.shiftKey ? document.activeElement === first || document.activeElement === panel : document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last ?? panel : first ?? panel).focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      const wasTop = dialogs.at(-1) === panel;
      dialogs.splice(dialogs.indexOf(panel), 1);
      if (!dialogs.length) document.body.style.overflow = previousOverflow;
      if (wasTop && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, returnFocus]);

  return ref;
}

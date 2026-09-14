import { cn } from "@/lib/cn";

/**
 * ON/OFF toggle control (no Radix/Headless UI in this codebase — a small
 * native `role="switch"` button). Sized to sit inline in a feature card.
 */
export function Switch({
  checked,
  onChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Accessible label — the control has no visible text of its own. */
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border p-0.5 transition motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "border-primary bg-primary" : "border-line bg-white",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-4 w-4 transform rounded-full shadow-sm transition motion-reduce:transition-none",
          checked ? "translate-x-5 bg-white" : "translate-x-0 bg-ink-faint",
        )}
      />
    </button>
  );
}

export default Switch;

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Shared form primitives (spec §14). One input language across login / register /
 * contact / profile / the custom-project wizard — sized to match `<Button>`
 * (h-10, rounded-xl, indigo focus ring) so controls line up on every screen.
 */

const control =
  "block w-full rounded-xl border border-line bg-card px-3.5 text-sm text-ink shadow-sm outline-none transition " +
  "placeholder:text-ink-faint focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-70";
const invalidRing = "border-danger focus:border-danger focus:ring-danger/20";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-10 max-md:h-11", invalid && invalidRing, className)} {...rest} />;
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(control, "py-2.5 leading-relaxed", invalid && invalidRing, className)}
      {...rest}
    />
  );
});

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(control, "h-10 appearance-none pr-9 max-md:h-11", invalid && invalidRing, className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
    </div>
  );
});

/** Label + optional hint + error shell around any control. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  className,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
      {children}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/**
 * Single/multi-select pill group. `onSelect` fires with the tapped value;
 * the caller decides how to fold it into state (replace vs toggle). Fixes the
 * dead `hover:border-line` pattern the wizard steps hand-rolled.
 */
export function OptionChips<T extends string>({
  options,
  value,
  onSelect,
  getLabel,
  className,
}: {
  options: readonly T[];
  value: T | readonly T[] | null | undefined;
  onSelect: (value: T) => void;
  getLabel?: (value: T) => string;
  className?: string;
}) {
  const isSelected = (o: T) => (Array.isArray(value) ? value.includes(o) : value === o);
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const selected = isSelected(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(o)}
            className={cn(
              "min-h-10 rounded-xl border px-4 py-2 text-sm font-medium transition active:scale-[.98] motion-reduce:transform-none",
              selected
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-line bg-card text-ink hover:border-primary/40 hover:bg-primary-50/60",
            )}
          >
            {getLabel ? getLabel(o) : o}
          </button>
        );
      })}
    </div>
  );
}

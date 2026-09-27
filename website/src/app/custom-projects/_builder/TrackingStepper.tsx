import { Check, XCircle } from "lucide-react";
import { trackingStepStates } from "@/lib/customProjects";
import { cn } from "@/lib/cn";

/**
 * Status timeline for a custom project request. Driven only by the request's
 * `status` (which the admin panel updates through custom_project_set_status),
 * so it never shows progress the admin has not recorded.
 */
export function TrackingStepper({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="mt-5 flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
        <XCircle className="h-4 w-4 shrink-0" aria-hidden /> This request was cancelled.
      </div>
    );
  }
  const steps = trackingStepStates(status);
  return (
    <ol className="mt-5 grid gap-x-2 gap-y-3 sm:grid-cols-7" aria-label="Project progress">
      {steps.map((s, i) => (
        <li
          key={s.key}
          aria-current={s.state === "current" ? "step" : undefined}
          className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
        >
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
              s.state === "done" && "border-success bg-success text-white",
              s.state === "current" && "border-primary bg-primary-50 text-primary",
              s.state === "upcoming" && "border-line bg-card text-ink-faint",
            )}
          >
            {s.state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
          </span>
          <span
            className={cn(
              "text-xs leading-tight sm:max-w-[6rem]",
              s.state === "upcoming" ? "text-ink-faint" : "font-semibold text-ink",
            )}
          >
            {s.label}
            <span className="sr-only"> — {s.state === "done" ? "completed" : s.state === "current" ? "in progress" : "not started"}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default TrackingStepper;

import { CheckCircle2, CircleDot, Code2, FlaskConical, PackageCheck, XCircle } from "lucide-react";
import { STATUS_LABELS, type CustomProjectStatus } from "@/lib/customProjects";
import { cn } from "@/lib/cn";

/** Literal class strings so Tailwind keeps them; tints read in both themes. */
const TONE: Record<CustomProjectStatus, { cls: string; icon: typeof CircleDot }> = {
  new: { cls: "bg-primary-50 text-primary", icon: CircleDot },
  in_development: { cls: "bg-accent-sky/15 text-blue-700 dark:text-blue-300", icon: Code2 },
  testing: { cls: "bg-accent-violet/15 text-violet-700 dark:text-violet-300", icon: FlaskConical },
  ready: { cls: "bg-accent-teal/15 text-teal-700 dark:text-teal-300", icon: PackageCheck },
  delivered: { cls: "bg-success/15 text-success", icon: CheckCircle2 },
  cancelled: { cls: "bg-danger/10 text-danger", icon: XCircle },
};

/** Status pill for a custom project request — label text from STATUS_LABELS. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = TONE[status as CustomProjectStatus] ?? { cls: "bg-surface text-ink-muted", icon: CircleDot };
  const Icon = tone.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", tone.cls, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {STATUS_LABELS[status as CustomProjectStatus] ?? status}
    </span>
  );
}

export default StatusBadge;

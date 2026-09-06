import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "./Badge";
import { TagPill } from "./Chip";

export type ResourceCardData = {
  href: string;
  icon: React.ReactNode;
  title: string;
  typeLabel: string;
  topicCount: number;
  description?: string | null;
  accentColor?: string | null;
  isPremium?: boolean;
};

const DEFAULT_ACCENT = "#4F39F6"; // primary indigo, same fallback the badge used before per-topic tints existed

/**
 * Resource / learning-grid tile — icon badge tinted by `accentColor` (e.g.
 * amber for Java, blue for Python), a type + topic-count pill row, and a
 * footer divider before the "View resource" link. One data entry (icon,
 * title, type, count, description, link) is all a new resource needs to get
 * this same styling.
 */
export function ResourceCard({ resource, className }: { resource: ResourceCardData; className?: string }) {
  const accent = resource.accentColor || DEFAULT_ACCENT;
  return (
    <Link
      href={resource.href}
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-lg motion-reduce:transform-none",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          {resource.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-1.5 font-semibold text-ink group-hover:text-primary">
            <span className="truncate">{resource.title}</span>
            {resource.isPremium ? <Badge tone="premium">Premium</Badge> : null}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center rounded-lg px-2 py-0.5 text-[0.68rem] font-medium"
              style={{ backgroundColor: `${accent}1a`, color: accent }}
            >
              {resource.typeLabel}
            </span>
            <TagPill>
              {resource.topicCount} topic{resource.topicCount === 1 ? "" : "s"}
            </TagPill>
          </div>
        </div>
      </div>
      {resource.description ? (
        <p className="mt-3 line-clamp-3 flex-1 text-sm text-ink-muted">{resource.description}</p>
      ) : (
        <span className="flex-1" />
      )}
      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3 text-sm font-semibold text-primary">
        View resource
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </div>
    </Link>
  );
}

export default ResourceCard;

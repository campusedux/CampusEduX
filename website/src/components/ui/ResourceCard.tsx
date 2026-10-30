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
      className={cn("card card-hover card-pad group flex h-full min-w-0 flex-col", className)}
    >
      <div className="flex items-start gap-3">
        <span
          className="icon-box text-lg font-bold"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          {resource.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-1.5 text-base font-semibold text-ink group-hover:text-primary">
            <span className="truncate">{resource.title}</span>
            {resource.isPremium ? <Badge tone="premium">Premium</Badge> : null}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[0.68rem] font-medium text-ink"
              style={{ backgroundColor: `${accent}1a` }}
            >
              {/* Admin-chosen accent can be any colour — keep it to the dot, text stays ink for contrast. */}
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
              {resource.typeLabel}
            </span>
            <TagPill>
              {resource.topicCount} topic{resource.topicCount === 1 ? "" : "s"}
            </TagPill>
          </div>
        </div>
      </div>
      {resource.description ? (
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-muted">{resource.description}</p>
      ) : (
        <span className="flex-1" />
      )}
      <div className="mt-3 flex items-center gap-1 border-t border-line pt-3 text-sm font-semibold text-primary">
        View resource
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </div>
    </Link>
  );
}

export default ResourceCard;

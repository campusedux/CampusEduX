import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Folder } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Home / catalog category tile — mirrors the mobile Home category tiles
 * (coloured icon tile + label on a white rounded-2xl card).
 */
export function CategoryCard({
  href,
  label,
  count,
  icon: Icon = Folder,
  tint = "#4F39F6",
  bg = "#EEF0FF",
  className,
}: {
  href: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
  tint?: string;
  bg?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "card card-hover card-pad group flex min-w-0 flex-col items-center text-center",
        className,
      )}
    >
      <span
        className="icon-box transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none"
        style={{ backgroundColor: bg }}
      >
        <Icon style={{ color: tint }} aria-hidden />
      </span>
      <span className="mt-2 line-clamp-2 text-[0.8rem] font-semibold text-ink">{label}</span>
      {typeof count === "number" && <span className="mt-0.5 text-xs text-ink-faint">{count} projects</span>}
    </Link>
  );
}

export default CategoryCard;

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
        "card card-hover group flex flex-col items-center p-4 text-center",
        className,
      )}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none"
        style={{ backgroundColor: bg }}
      >
        <Icon className="h-6 w-6" style={{ color: tint }} aria-hidden />
      </span>
      <span className="mt-2 line-clamp-2 text-[0.8rem] font-semibold text-ink">{label}</span>
      {typeof count === "number" && <span className="mt-0.5 text-xs text-ink-faint">{count} projects</span>}
    </Link>
  );
}

export default CategoryCard;

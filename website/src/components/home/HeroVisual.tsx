import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, LayoutGrid, Briefcase, GraduationCap, Code2, FileText } from "lucide-react";

/**
 * Right-hand hero composition — a UI-only "product" panel. Every row is a real
 * <Link> to an existing module route; there is no data fetch and no fabricated
 * content. Icons / tints mirror the `MODULES` set in `ModuleGrid.tsx` so the
 * hero and the grid below it read as one system.
 */
type Row = { label: string; desc: string; href: string; icon: LucideIcon; tint: string; bg: string };

const ROWS: Row[] = [
  { label: "Projects", desc: "Buy & sell final-year projects", href: "/projects", icon: LayoutGrid, tint: "#4F39F6", bg: "#EEF0FF" },
  { label: "Jobs", desc: "Roles & internships for students", href: "/jobs", icon: Briefcase, tint: "#3B82F6", bg: "#DBEAFE" },
  { label: "Learning", desc: "Structured prep & study material", href: "/learning", icon: GraduationCap, tint: "#16A34A", bg: "#DCFCE7" },
  { label: "Practice", desc: "Practice coding problems and improve your programming skills", href: "/practice", icon: Code2, tint: "#DB2777", bg: "#FCE7F3" },
  { label: "Resume", desc: "ATS-friendly builder & templates", href: "/resume", icon: FileText, tint: "#EA580C", bg: "#FFEDD5" },
];

export function HeroVisual() {
  return (
    <div className="relative rounded-3xl border border-line bg-card p-4 shadow-card-lg sm:p-5">
      <div className="mb-3 flex items-center gap-1.5 px-1" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="ml-2 text-xs font-medium text-ink-faint">CampusEduX</span>
      </div>
      <div className="grid gap-2.5">
        {ROWS.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.href}
              href={r.href}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5 transition hover:border-primary/30 hover:bg-surface active:scale-[.99] motion-reduce:transform-none"
            >
              <span
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: r.bg }}
              >
                <Icon className="h-[22px] w-[22px]" style={{ color: r.tint }} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">{r.label}</span>
                <span className="block truncate text-xs text-ink-muted">{r.desc}</span>
              </span>
              <ArrowRight
                className="h-4 w-4 flex-shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default HeroVisual;

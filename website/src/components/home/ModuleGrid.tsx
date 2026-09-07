import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, LayoutGrid, GraduationCap, Briefcase, FileText, Wrench } from "lucide-react";
import { cn } from "@/lib/cn";

type Accent = "indigo" | "emerald" | "sky" | "amber" | "pink";

interface ModuleTile {
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  accent: Accent;
}

/** Literal class strings so Tailwind's JIT keeps them. */
const ACCENT: Record<Accent, { tile: string; fg: string }> = {
  indigo: { tile: "bg-primary-50", fg: "text-primary" },
  emerald: { tile: "bg-accent-emerald/10", fg: "text-accent-emerald" },
  sky: { tile: "bg-accent-sky/10", fg: "text-accent-sky" },
  amber: { tile: "bg-accent-amber/10", fg: "text-accent-amber" },
  pink: { tile: "bg-accent-pink/10", fg: "text-accent-pink" },
};

/**
 * "Explore" quick-access grid under the hero. Curated + static (the primary
 * modules don't change per request). One consistent white card language with a
 * tinted icon tile — no per-tile gradients.
 */
const MODULES: ModuleTile[] = [
  { label: "Projects", desc: "Explore and buy final year projects", href: "/projects", icon: LayoutGrid, accent: "indigo" },
  { label: "Learning", desc: "Courses, tutorials and study material", href: "/learning", icon: GraduationCap, accent: "emerald" },
  { label: "Jobs", desc: "Find jobs & internships", href: "/jobs", icon: Briefcase, accent: "sky" },
  { label: "Resume", desc: "Build ATS-friendly resumes", href: "/resume", icon: FileText, accent: "amber" },
  { label: "Custom Projects", desc: "Get your custom project built", href: "/custom-projects", icon: Wrench, accent: "pink" },
];

export function ModuleGrid() {
  return (
    <section className="container-page pt-8" aria-label="Explore CampusEduX">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const a = ACCENT[m.accent];
          return (
            <Link
              key={m.label}
              href={m.href}
              className="card card-hover group relative flex min-h-[132px] flex-col p-4"
            >
              <span
                className={cn(
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none",
                  a.tile,
                )}
              >
                <Icon className={cn("h-[22px] w-[22px]", a.fg)} aria-hidden />
              </span>
              <span className="mt-3 text-[15px] font-bold leading-tight text-ink group-hover:text-primary">
                {m.label}
              </span>
              <span className="mt-1 pr-7 text-[13px] leading-snug text-ink-muted">{m.desc}</span>
              <ArrowRight
                className="absolute bottom-4 right-4 h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ModuleGrid;

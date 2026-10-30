import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Briefcase, Code2, FileText, GraduationCap, LayoutGrid, Wrench } from "lucide-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui";

type Accent = "indigo" | "emerald" | "sky" | "amber" | "pink" | "teal";

/** Literal class strings so Tailwind's JIT keeps them. */
const ACCENT: Record<Accent, { tile: string; fg: string }> = {
  indigo: { tile: "bg-primary-50", fg: "text-primary" },
  emerald: { tile: "bg-accent-emerald/10", fg: "text-accent-emerald" },
  sky: { tile: "bg-accent-sky/10", fg: "text-accent-sky" },
  amber: { tile: "bg-accent-amber/10", fg: "text-accent-amber" },
  pink: { tile: "bg-accent-pink/10", fg: "text-accent-pink" },
  teal: { tile: "bg-accent-teal/10", fg: "text-accent-teal" },
};

interface Feature {
  label: string;
  benefit: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  accent: Accent;
}

/** Curated + static — the primary modules don't change per request. */
const FEATURES: Feature[] = [
  { label: "Learning", benefit: "Structured tutorials from basics to advanced — Java, Python, DBMS, AI/ML and more.", href: "/learning", cta: "Start learning", icon: GraduationCap, accent: "emerald" },
  { label: "Coding practice", benefit: "Solve problems in Java, Python, C, C++ or JavaScript with instant feedback.", href: "/practice", cta: "Practise now", icon: Code2, accent: "pink" },
  { label: "Jobs & internships", benefit: "Fresh roles for students and freshers — apply straight from the listing.", href: "/jobs", cta: "Find jobs", icon: Briefcase, accent: "sky" },
  { label: "Project marketplace", benefit: "Explore source-code examples with explanations, or share your own learning project.", href: "/projects", cta: "Browse projects", icon: LayoutGrid, accent: "indigo" },
  { label: "Resume builder", benefit: "ATS-friendly templates, a score check and one-click PDF export.", href: "/resume", cta: "Build my resume", icon: FileText, accent: "amber" },
  { label: "Custom projects", benefit: "Get project mentoring or commission software for personal and business use.", href: "/custom-projects", cta: "Explore options", icon: Wrench, accent: "teal" },
];

/** Home "What you get" — one card per module, each a real link. */
export function ModuleGrid() {
  return (
    <section className="container-page pt-10 md:pt-14 max-md:pt-8" aria-labelledby="home-features-title">
      <SectionHeader
        id="home-features-title"
        eyebrow="What you get"
        title="Everything you need, from first lesson to first offer"
        description="One account for learning, practice, projects and your job search — on the web and the CampusEduX app."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 max-md:!grid-cols-2 max-md:gap-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const a = ACCENT[f.accent];
          return (
            <Link key={f.href} href={f.href} className="card card-hover group flex min-h-[120px] min-w-0 items-start gap-3 overflow-hidden p-4 max-md:relative max-md:min-h-[136px] max-md:flex-col max-md:gap-2 max-md:p-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl max-md:h-9 max-md:w-9",
                  a.tile,
                )}
              >
                <Icon className={cn("h-5 w-5", a.fg)} aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="line-clamp-1 font-display text-base font-semibold text-ink max-md:line-clamp-2 max-md:text-[15px] max-md:leading-snug">{f.label}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-muted max-md:text-[13px] max-md:leading-4">{f.benefit}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary max-md:hidden">
                  {f.cta}
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
                </span>
                <ArrowRight className="hidden h-4 w-4 text-primary max-md:absolute max-md:right-3 max-md:top-3 max-md:block" aria-hidden />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ModuleGrid;

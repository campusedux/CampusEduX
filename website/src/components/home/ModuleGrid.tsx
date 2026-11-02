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
        eyebrow="WHAT YOU GET"
        title="Everything you need, from first lesson to first offer"
        description="One account for learning, practice, projects and your job search — on the web and the CampusEduX app."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const a = ACCENT[f.accent];
          return (
            <Link key={f.href} href={f.href} className="card card-hover group flex min-h-[180px] min-w-0 items-start gap-4 p-5 focus-visible:border-primary/50 motion-reduce:!transform-none md:p-6">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  a.tile,
                )}
              >
                <Icon className={cn("h-5 w-5", a.fg)} aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col self-stretch">
                <h3 className="font-display text-base font-semibold text-ink">{f.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{f.benefit}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-primary">
                  {f.cta}
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:!transform-none" aria-hidden />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ModuleGrid;

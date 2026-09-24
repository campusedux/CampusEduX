import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Briefcase, Code2, FileText, GraduationCap, LayoutGrid, Wrench } from "lucide-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui";

type Accent = "indigo" | "emerald" | "sky" | "amber" | "pink" | "teal";

/** Literal class strings so Tailwind's JIT keeps them. */
const ACCENT: Record<Accent, { tile: string; fg: string; glow: string }> = {
  indigo: { tile: "bg-primary-50", fg: "text-primary", glow: "bg-primary/10" },
  emerald: { tile: "bg-accent-emerald/10", fg: "text-accent-emerald", glow: "bg-accent-emerald/10" },
  sky: { tile: "bg-accent-sky/10", fg: "text-accent-sky", glow: "bg-accent-sky/10" },
  amber: { tile: "bg-accent-amber/10", fg: "text-accent-amber", glow: "bg-accent-amber/10" },
  pink: { tile: "bg-accent-pink/10", fg: "text-accent-pink", glow: "bg-accent-pink/10" },
  teal: { tile: "bg-accent-teal/10", fg: "text-accent-teal", glow: "bg-accent-teal/10" },
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
  { label: "Project marketplace", benefit: "Ready final-year projects with source code, or sell your own.", href: "/projects", cta: "Browse projects", icon: LayoutGrid, accent: "indigo" },
  { label: "Resume builder", benefit: "ATS-friendly templates, a score check and one-click PDF export.", href: "/resume", cta: "Build my resume", icon: FileText, accent: "amber" },
  { label: "Custom projects", benefit: "Tell us your idea — we build and deliver it with full source code.", href: "/custom-projects", cta: "Get it built", icon: Wrench, accent: "teal" },
];

/** Home "What you get" — one card per module, each a real link. */
export function ModuleGrid() {
  return (
    <section className="container-page pt-14 sm:pt-20" aria-labelledby="home-features-title">
      <SectionHeader
        id="home-features-title"
        eyebrow="What you get"
        title="Everything you need, from first lesson to first offer"
        description="One account for learning, practice, projects and your job search — on the web and the CampusEduX app."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const a = ACCENT[f.accent];
          return (
            <Link key={f.href} href={f.href} className="card card-hover group relative flex flex-col overflow-hidden p-6">
              <span aria-hidden className={cn("pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity group-hover:opacity-100 opacity-60", a.glow)} />
              <span
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105 motion-reduce:transform-none",
                  a.tile,
                )}
              >
                <Icon className={cn("h-6 w-6", a.fg)} aria-hidden />
              </span>
              <h3 className="relative mt-4 font-display text-lg font-bold tracking-tight text-ink">{f.label}</h3>
              <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{f.benefit}</p>
              <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {f.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ModuleGrid;

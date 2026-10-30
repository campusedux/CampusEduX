import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, AppWindow, CheckCircle2, Code2, Globe, GraduationCap, Lightbulb, Smartphone, Wrench } from "lucide-react";

interface ProjectType {
  title: string;
  icon: LucideIcon;
}

const PROJECT_TYPES: ProjectType[] = [
  { title: "Websites", icon: Globe },
  { title: "Mobile apps", icon: Smartphone },
  { title: "Web applications", icon: AppWindow },
  { title: "Project mentoring", icon: GraduationCap },
  { title: "Custom software", icon: Code2 },
  { title: "Your own idea", icon: Lightbulb },
];

const TRUST_POINTS = ["Student friendly", "Clear pricing", "Code review available", "Support throughout"];

/**
 * "Custom Project Development" home banner — sits directly under the hero.
 * Real HTML/CSS (no baked image). `/projects` keeps its own image banner
 * (`components/CustomProjectBanner`). Same destinations as before:
 * /custom-projects/start and /custom-projects.
 */
export function CustomProjectPromo() {
  return (
    <section className="container-page pt-10 md:pt-14 max-md:pt-8" aria-labelledby="custom-project-promo-title">
      <div className="relative overflow-hidden rounded-xl bg-[#0F0B2E] text-white shadow-card">
        {/* Colour washes — fixed dark panel in both themes (a deliberate accent block). */}
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/50 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-0 h-72 w-80 rounded-full bg-accent-pink/30 blur-3xl" />

        <div className="relative grid gap-4 p-5 md:gap-5 md:p-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-inset ring-white/15">
              <Wrench className="h-3.5 w-3.5" aria-hidden />
              Project mentoring and custom software
            </span>
            <h2 id="custom-project-promo-title" className="mt-2 font-display text-xl font-semibold leading-tight tracking-tight md:text-2xl">
              Working on a project? <span className="text-[#B7ADFF]">Get guidance or commission software.</span>
            </h2>
            <p className="mt-2 text-sm leading-5 text-white/75 max-md:line-clamp-3">
              Get mentoring, code review and debugging help for your own work, or commission a personal or business software project.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 max-md:grid max-md:grid-cols-2 max-md:gap-2">
              {TRUST_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-1.5 text-sm text-white/80 max-md:min-h-10 max-md:text-xs max-md:leading-4">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#9EF0C4]" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 max-md:flex-col">
              <Link
                href="/custom-projects/start"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#2A1FA8] transition hover:-translate-y-px motion-reduce:transform-none max-md:h-11"
              >
                Explore project options <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/custom-projects"
                className="inline-flex h-10 items-center rounded-xl border border-white/25 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 max-md:h-11"
              >
                Ask about mentoring
              </Link>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 max-md:gap-3">
            {PROJECT_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <li
                  key={t.title}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur max-md:min-h-12 max-md:p-2 max-md:leading-4"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-4 w-4 text-[#C9C2FF]" aria-hidden />
                  </span>
                  {t.title}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default CustomProjectPromo;

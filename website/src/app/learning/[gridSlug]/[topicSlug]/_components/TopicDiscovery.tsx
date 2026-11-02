import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, Boxes, Briefcase, Clock, GraduationCap } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import JobCard from "@/components/JobCard";
import { Chip, ResourceCard } from "@/components/ui";
import { getTopicDiscovery } from "@/lib/learning";

/**
 * Internal-linking / content-discovery block shown at the very bottom of a
 * Learning topic page — AFTER the topic content, Test, Problems and the
 * Previous / Next navigation. Five sections, each hidden when it has nothing
 * real to show (master prompt "DATA FALLBACKS"):
 *
 *   1. Other Tutorials        — other published learning grids (current excluded)
 *   2. Related Projects       — projects whose tech_stack matches this tech
 *   3. Related Jobs           — jobs whose skills match this tech
 *   4. Latest Jobs            — newest roles (minus anything shown as "related")
 *   5. Other Learning Topics  — grid overflow + the learning hubs on CampusEduX
 *
 * Server Component — zero added client JS. All data comes from one request-memoized
 * `getTopicDiscovery()` call (see `src/lib/learning.ts`): a single `Promise.all`
 * of bounded anonymous catalog reads. Fresh publication checks keep withdrawn
 * tutorials out of the next server render without relying on a refresh webhook.
 */

/** Curated, real CampusEduX learning routes for "Other Learning Topics". Kept
 *  in code the same way the header / drawer nav lists are — every href is a
 *  verified existing route, never a query-string or private page. */
const LEARNING_HUBS: { label: string; href: string }[] = [
  { label: "All learning resources", href: "/learning" },
  { label: "Online code compiler", href: "/compiler" },
  { label: "Programming blog", href: "/blog" },
];

const EMOJI = /\p{Extended_Pictographic}/u;

function DiscoverySection({
  id,
  title,
  icon: Icon,
  subtitle,
  viewAllHref,
  viewAllLabel,
  children,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="flex items-center gap-2 text-lg font-bold text-ink">
          <Icon className="h-5 w-5 text-primary" aria-hidden /> {title}
        </h2>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {viewAllLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export async function TopicDiscovery({ gridSlug, gridName }: { gridSlug: string; gridName: string }) {
  const { techLabel, tutorials, overflowTutorials, relatedProjects, relatedJobs, latestJobs } =
    await getTopicDiscovery(gridSlug, gridName);

  const otherTopics = [
    ...overflowTutorials.map((g) => ({ label: g.name, href: `/learning/${g.slug}` })),
    ...LEARNING_HUBS,
  ];

  const hasAnything =
    tutorials.length > 0 ||
    relatedProjects.length > 0 ||
    relatedJobs.length > 0 ||
    latestJobs.length > 0 ||
    otherTopics.length > 0;
  if (!hasAnything) return null;

  return (
    <aside className="mt-12 space-y-10 border-t border-line pt-8" aria-label="Explore more on CampusEduX">
      {tutorials.length > 0 ? (
        <DiscoverySection
          id="discovery-tutorials"
          title="Other Tutorials"
          icon={BookOpen}
          subtitle="More step-by-step tutorials to learn next on CampusEduX."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tutorials.map((g) => (
              <ResourceCard
                key={g.id}
                resource={{
                  href: `/learning/${g.slug}`,
                  icon: g.icon && EMOJI.test(g.icon) ? g.icon : <BookOpen className="h-5 w-5" aria-hidden />,
                  title: g.name,
                  typeLabel: "Tutorial",
                  topicCount: g.topic_count,
                  accentColor: g.accent_color,
                  isPremium: g.is_premium,
                }}
              />
            ))}
          </div>
        </DiscoverySection>
      ) : null}

      {relatedProjects.length > 0 ? (
        <DiscoverySection
          id="discovery-projects"
          title="Related Projects"
          icon={Boxes}
          subtitle={`${techLabel} and educational project examples with source code to study and adapt.`}
          viewAllHref="/projects"
          viewAllLabel="View all projects"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </DiscoverySection>
      ) : null}

      {relatedJobs.length > 0 ? (
        <DiscoverySection
          id="discovery-related-jobs"
          title="Related Jobs"
          icon={Briefcase}
          subtitle={`${techLabel} developer, software engineer and fresher roles.`}
          viewAllHref="/jobs"
          viewAllLabel="View all jobs"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedJobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </DiscoverySection>
      ) : null}

      {latestJobs.length > 0 ? (
        <DiscoverySection
          id="discovery-latest-jobs"
          title="Latest Jobs"
          icon={Clock}
          subtitle="Newest roles and internships posted on CampusEduX."
          viewAllHref="/jobs"
          viewAllLabel="View all jobs"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {latestJobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </DiscoverySection>
      ) : null}

      {otherTopics.length > 0 ? (
        <DiscoverySection
          id="discovery-more"
          title="Other Learning Topics"
          icon={GraduationCap}
          subtitle="Keep exploring learning resources across CampusEduX."
        >
          <div className="flex flex-wrap gap-2">
            {otherTopics.map((o) => (
              <Chip key={o.href} href={o.href}>
                {o.label}
              </Chip>
            ))}
          </div>
        </DiscoverySection>
      ) : null}
    </aside>
  );
}

export default TopicDiscovery;

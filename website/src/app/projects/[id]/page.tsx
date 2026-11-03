import { completeSeoMetadata } from "@/lib/seo";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import { Badge, Rating, PriceDisplay, TagPill, ReviewCard, SectionHeader, EmptyState, Breadcrumb } from "@/components/ui";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { authoredDescription } from "@/lib/metaDescription";
import { plainTitle } from "@/lib/seoTitles";
import { getCachedProjectDetail, getCachedTopProjectIds } from "@/lib/cache";
import ProjectPurchasePanel from "./ProjectPurchasePanel";
import Gallery from "./Gallery";

// Request-specific CSP nonces cannot be reused in statically cached HTML.
// Existing data-layer caches still serve public content reads.
export const dynamic = "force-dynamic";
export const revalidate = 300;

// Known project enumeration; HTML renders per request for nonce safety.
export async function generateStaticParams() {
  return (await getCachedTopProjectIds(40)).map((id) => ({ id }));
}

type RawProfile = { full_name: string | null } | { full_name: string | null }[] | null;

// Thin per-request memo (shared by generateMetadata + the page) over the
// cross-request cached read in lib/cache.ts.
const getProject = cache(async (id: string) => {
  const result = await getCachedProjectDetail(id);
  if (!result) return null;
  if (!result.project) return { project: null, reviews: [], related: [] as ProjectCardData[] };

  const mappedReviews = (result.reviews as Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    profile: RawProfile;
  }>).map((r) => {
    const p = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      author_name: p?.full_name ?? "CampusEduX student",
    };
  });

  return { project: result.project, reviews: mappedReviews, related: result.related as ProjectCardData[] };
});

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const result = await getProject(params.id);
  if (!result?.project) return completeSeoMetadata({ title: "Project not found", robots: { index: false, follow: false } });
  const { project } = result;
  const image = project.thumbnail_url ? [{ url: project.thumbnail_url }] : [DEFAULT_OG_IMAGE];
  return completeSeoMetadata({
    title: { absolute: plainTitle(project.title) },
    description: authoredDescription(project.description, `${project.title} — a project on CampusEduX.`),
    alternates: { canonical: absoluteUrl(`/projects/${params.id}`) },
    openGraph: { title: project.title, images: image, url: absoluteUrl(`/projects/${params.id}`), type: "website" },
    twitter: { card: "summary_large_image", title: project.title, images: project.thumbnail_url ? [project.thumbnail_url] : undefined },
  });
}

export default async function ProjectDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const result = await getProject(params.id);
  if (!result?.project) notFound();
  const { project, reviews, related } = result;

  const gallery: string[] = [
    ...(project.thumbnail_url ? [project.thumbnail_url] : []),
    ...((project.images ?? []) as string[]),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.title,
    description: (project.description || "").slice(0, 500),
    ...(project.thumbnail_url ? { image: project.thumbnail_url } : {}),
    offers: { "@type": "Offer", price: project.price, priceCurrency: "INR", availability: "https://schema.org/InStock" },
  };
  if (project.review_count > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: project.rating,
      reviewCount: project.review_count,
    };
  }

  return (
    <div className="container-page pb-32 pt-8 sm:pt-10 md:pb-12">
      <JsonLd data={productJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${project.id}` },
        ])}
      />

      <Breadcrumb className="mb-6" items={[{ label: "Projects", href: "/projects" }, { label: project.title }]} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start xl:gap-12">
        <div className="min-w-0">
          <header>
            {project.category_name && (
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{project.category_name}</p>
            )}
            <h1 className="mt-2 font-display text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-[2.3rem]">
              {project.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Rating value={project.rating} count={project.review_count} showEmpty />
              {project.is_premium && <Badge tone="premium">Premium</Badge>}
              {project.is_best_seller && <Badge tone="success">Best seller</Badge>}
            </div>
          </header>

          <div className="mt-6">
            <Gallery images={gallery} title={project.title} />
          </div>

          {(project.tech_stack ?? []).length > 0 && (
            <section className="mt-8" aria-labelledby="tech-title">
              <h2 id="tech-title" className="text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
                Tech stack
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(project.tech_stack as string[]).map((t) => (
                  <TagPill key={t}>{t}</TagPill>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10 max-w-3xl">
            <h2 className="h-section">About this project</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-ink-muted">{project.description || "No description provided yet."}</p>
          </section>

          <section className="mt-12">
            <h2 className="h-section">Reviews</h2>
            {reviews.length === 0 ? (
              <EmptyState className="mt-4" title="No reviews yet" subtitle="Be the first to review this project after buying it." />
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Buy box — sticky beside the content on desktop */}
        <aside id="buy" className="scroll-mt-24 lg:sticky lg:top-24" aria-label="Buy this project">
          <div className="card p-6">
            <PriceDisplay price={project.price} size="lg" />
            <ProjectPurchasePanel projectId={project.id} price={Number(project.price) || 0} title={project.title} />
            <dl className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">License</dt>
                <dd className="font-medium text-ink">{project.license || "Standard"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Platform fee</dt>
                <dd className="font-medium text-ink">{project.platform_fee_percent ?? 0}%</dd>
              </div>
              {(project.tech_stack ?? []).length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Tech</dt>
                  <dd className="truncate text-right font-medium text-ink">{(project.tech_stack as string[]).slice(0, 3).join(", ")}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="Related projects" viewAllHref={project.category_id ? `/projects/category/${project.category_id}` : "/projects"} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* Phone: price + jump to the buy box (the purchase flow itself lives there, unchanged). */}
      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-line/70 bg-card/95 px-4 py-3 backdrop-blur-xl md:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <PriceDisplay price={project.price} size="lg" />
          <a href="#buy" className="btn-primary h-11 px-6">
            {Number(project.price) > 0 ? "Buy now" : "Get it free"}
          </a>
        </div>
      </div>
    </div>
  );
}

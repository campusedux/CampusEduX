import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import ProjectCard, { ProjectCardData } from "@/components/ProjectCard";
import { Badge, Rating, PriceDisplay, TagPill, ReviewCard, SectionHeader, EmptyState, Breadcrumb } from "@/components/ui";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { getCachedProjectDetail, getCachedTopProjectIds } from "@/lib/cache";
import ProjectPurchasePanel from "./ProjectPurchasePanel";
import Gallery from "./Gallery";

export const revalidate = 300;

// Registering generateStaticParams (even a bounded list) is what flips this
// dynamic-segment route from "rendered on every request" to ISR: the params
// below are prerendered at build, and `dynamicParams` (default true) renders
// the long tail on demand and then caches it for `revalidate` seconds.
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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await getProject(params.id);
  if (!result?.project) return { title: "Project not found" };
  const { project } = result;
  const image = project.thumbnail_url ? [{ url: project.thumbnail_url }] : undefined;
  return {
    title: project.title,
    description: (project.description || "").slice(0, 155),
    alternates: { canonical: absoluteUrl(`/projects/${params.id}`) },
    openGraph: { title: project.title, images: image, url: absoluteUrl(`/projects/${params.id}`), type: "website" },
    twitter: { card: "summary_large_image", title: project.title, images: project.thumbnail_url ? [project.thumbnail_url] : undefined },
  };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
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
    <div className="container-page py-8 sm:py-10">
      <JsonLd data={productJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${project.id}` },
        ])}
      />

      <Breadcrumb className="mb-6" items={[{ label: "Projects", href: "/projects" }, { label: project.title }]} />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        {/* Gallery */}
        <Gallery images={gallery} title={project.title} />

        {/* Buy box — sticks alongside the gallery on desktop */}
        <div className="lg:sticky lg:top-24">
          <div className="text-sm text-ink-muted">{project.category_name || "Uncategorised"}</div>
          <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{project.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Rating value={project.rating} count={project.review_count} showEmpty />
            {project.is_premium && <Badge tone="premium">Premium</Badge>}
            {project.is_best_seller && <Badge tone="success">Best seller</Badge>}
          </div>

          {(project.tech_stack ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(project.tech_stack as string[]).map((t) => (
                <TagPill key={t}>{t}</TagPill>
              ))}
            </div>
          )}

          <div className="card mt-5 p-5">
            <PriceDisplay price={project.price} size="lg" />
            <p className="mt-1 text-xs text-ink-faint">
              License: {project.license || "Standard"} · Platform fee {project.platform_fee_percent ?? 0}%
            </p>
            <ProjectPurchasePanel projectId={project.id} price={Number(project.price) || 0} title={project.title} />
          </div>
        </div>
      </div>

      {/* About */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-ink">About this project</h2>
        <p className="mt-3 whitespace-pre-line text-ink-muted">{project.description || "No description provided yet."}</p>
      </section>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink">Reviews</h2>
        {reviews.length === 0 ? (
          <EmptyState className="mt-4" title="No reviews yet" subtitle="Be the first to review this project after buying it." />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </section>

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
    </div>
  );
}

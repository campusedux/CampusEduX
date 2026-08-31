import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getPublicSupabase } from "@/lib/supabase/server";
import { formatINR, timeAgo } from "@/lib/format";
import JsonLd from "@/components/JsonLd";

export const revalidate = 300;

async function getProject(id: string) {
  const supabase = getPublicSupabase();
  if (!supabase) return null;

  const [{ data: project }, { data: reviews }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase
      .from("reviews")
      .select("id,rating,comment,created_at,profile:profiles(full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return { project, reviews: reviews ?? [] };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await getProject(params.id);
  if (!result?.project) return { title: "Project not found" };
  return {
    title: result.project.title,
    description: (result.project.description || "").slice(0, 155),
  };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const result = await getProject(params.id);
  if (!result?.project) notFound();
  const { project, reviews } = result;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.title,
    description: (project.description || "").slice(0, 500),
    ...(project.thumbnail_url ? { image: project.thumbnail_url } : {}),
    offers: {
      "@type": "Offer",
      price: project.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  };
  // Only attach aggregateRating when real reviews exist — never fabricate one.
  if (project.review_count > 0) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: project.rating,
      reviewCount: project.review_count,
    };
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <JsonLd data={productJsonLd} />
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-video border border-navy/10 bg-navy/5">
          {project.thumbnail_url ? (
            <Image src={project.thumbnail_url} alt={project.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate">No preview image</div>
          )}
        </div>
        <div>
          <div className="text-sm text-slate">{project.category_name}</div>
          <h1 className="mt-1 font-serif text-3xl text-navy">{project.title}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(project.tech_stack ?? []).map((t: string) => (
              <span key={t} className="rounded-sm border border-navy/10 bg-paper px-2 py-0.5 text-xs text-navy">{t}</span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span>{project.rating > 0 ? `★ ${project.rating.toFixed(1)} (${project.review_count})` : "No ratings yet"}</span>
            {project.is_premium && <span className="rounded-sm bg-marigold px-2 py-0.5 text-xs font-semibold text-navy">Premium</span>}
          </div>
          <div className="mt-6 font-serif text-2xl text-navy">
            {project.price > 0 ? formatINR(project.price) : "Free"}
          </div>
          <p className="mt-1 text-xs text-slate">License: {project.license} · Platform fee: {project.platform_fee_percent}%</p>
          <button className="mt-5 w-full rounded-sm bg-navy py-2.5 text-sm text-paper hover:bg-navy/90 md:w-auto md:px-8">
            Get this project in the app
          </button>
          <p className="mt-2 text-xs text-slate">Purchase, source code and documentation are handled inside the CampusEduX app, tied to your account.</p>
        </div>
      </div>

      <div className="mt-12 max-w-2xl">
        <h2 className="font-serif text-xl text-navy">About this project</h2>
        <p className="mt-3 whitespace-pre-line text-slate">{project.description || "No description provided yet."}</p>
      </div>

      <div className="mt-12">
        <h2 className="font-serif text-xl text-navy">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="empty-state mt-4">No reviews yet — be the first to try this project.</div>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((r: any) => (
              <div key={r.id} className="border-b border-navy/10 pb-4">
                <div className="text-sm text-navy">★ {r.rating} — {r.profile?.full_name || "CampusEduX User"}</div>
                <p className="mt-1 text-sm text-slate">{r.comment}</p>
                <div className="mt-1 text-xs text-slate">{timeAgo(r.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

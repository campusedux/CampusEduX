import type { MetadataRoute } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import { onlyActiveJobs } from "@/lib/jobsActive";
import { isTemplatedGenerativeAiBody, isThinCodingProblemRow } from "@/lib/contentQuality";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.campusedux.com";

const STATIC_ROUTES = [
  "", "/projects", "/projects/trending",
  "/jobs", "/jobs/companies", "/learning", "/blog", "/compiler", "/resume", "/resume/templates", "/custom-projects",
  "/practice", "/practice/problems", "/practice/interview-questions", "/practice/interview-questions/java",
  "/premium", "/referral", "/faq", "/about", "/contact", "/support",
  "/legal", "/privacy-policy", "/terms", "/refund-policy", "/project-license", "/community-guidelines",
  "/disclaimer", "/data-and-permissions", "/cookie-policy", "/grievance", "/delete-account",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const supabase = getPublicSupabase();
  if (supabase) {
    const [
      { data: projects },
      { data: jobs },
      { data: categories },
      { data: companies },
      { data: learning },
      { data: codingProblems },
      { data: practiceProblems },
      { data: blogPosts },
      { data: interviewTopics },
    ] = await Promise.all([
      supabase.from("projects").select("id,updated_at").limit(1000),
      onlyActiveJobs(supabase.from("jobs").select("id,updated_at")).limit(1000),
      supabase.from("categories").select("id,updated_at").limit(200),
      supabase.from("companies").select("id,updated_at").limit(500),
      supabase.rpc("learning_sitemap", { p_platform: "website" }),
      supabase.rpc("coding_problems_sitemap", { p_platform: "website" }),
      supabase.rpc("practice_problems_sitemap", { p_platform: "website" }),
      supabase
        .from("blog_posts")
        .select("slug,updated_at")
        .eq("status", "published")
        .limit(1000),
      supabase.rpc("interview_questions_sitemap", { p_platform: "website" }),
    ]);

    // Content-quality exclusions — mirror each route's own per-page `noindex`
    // decision here so a deliberately-noindexed page is never also promoted
    // through the sitemap (see src/lib/contentQuality.ts).
    // A `.in("slug", codingProblemSlugs)` filter here would build a URL with
    // 700+ slugs and blow past PostgREST's header-size limit (confirmed:
    // `HeadersOverflowError` at this cluster's real size); querying the same
    // topic-linked population the RPC itself starts from (`topic_id is null`)
    // avoids that without needing every slug in the request.
    const thinCodingProblemSlugs = new Set<string>();
    const { data: thinCheckRows } = await supabase
      .from("dsa_problems")
      .select("slug,examples,constraints,starter_code,is_premium")
      .is("topic_id", null)
      .not("learning_topic_id", "is", null)
      .limit(2000);
    (
      thinCheckRows as
        | {
            slug: string;
            examples: unknown[] | null;
            constraints: unknown[] | null;
            starter_code: Record<string, unknown> | null;
            is_premium: boolean | null;
          }[]
        | null
    )?.forEach((row) => {
      if (isThinCodingProblemRow(row)) thinCodingProblemSlugs.add(row.slug);
    });

    const thinGenerativeAiTopicSlugs = new Set<string>();
    const { data: genAiGridRows } = await supabase.from("learning_grids").select("id").eq("slug", "generative-ai").limit(1);
    const genAiGrid = (genAiGridRows as { id: string }[] | null)?.[0];
    if (genAiGrid) {
      const { data: genAiContentRows } = await supabase
        .from("learning_contents")
        .select("body,learning_topics!inner(slug,grid_id)")
        .eq("learning_topics.grid_id", genAiGrid.id)
        .limit(1000);
      const bodyByTopicSlug = new Map<string, string>();
      (
        genAiContentRows as { body: string | null; learning_topics: { slug: string; grid_id: string } | null }[] | null
      )?.forEach((row) => {
        const slug = row.learning_topics?.slug;
        if (!slug) return;
        bodyByTopicSlug.set(slug, `${bodyByTopicSlug.get(slug) ?? ""} ${row.body ?? ""}`);
      });
      bodyByTopicSlug.forEach((body, slug) => {
        if (isTemplatedGenerativeAiBody(body)) thinGenerativeAiTopicSlugs.add(slug);
      });
    }

    projects?.forEach((p) => entries.push({ url: `${siteUrl}/projects/${p.id}`, lastModified: new Date(p.updated_at) }));
    jobs?.forEach((j) => entries.push({ url: `${siteUrl}/jobs/${j.id}`, lastModified: new Date(j.updated_at) }));
    categories?.forEach((c) => entries.push({ url: `${siteUrl}/projects/category/${c.id}`, lastModified: new Date(c.updated_at) }));
    companies?.forEach((c) => entries.push({ url: `${siteUrl}/jobs/companies/${c.id}`, lastModified: new Date(c.updated_at) }));

    // Published, website-visible Learning grid + topic URLs (row with a null
    // topic_slug is the grid landing page). Draft / archived / mobile-only /
    // premium-parent-hidden rows are excluded by the SECURITY DEFINER RPC.
    // Template-filled Generative AI topics (see thinGenerativeAiTopicSlugs
    // above) are excluded — their pages are noindex, so they shouldn't be
    // promoted here either; the grid's own landing page is unaffected.
    (learning as { grid_slug: string; topic_slug: string | null; updated_at: string }[] | null)?.forEach((row) => {
      if (row.topic_slug && row.grid_slug === "generative-ai" && thinGenerativeAiTopicSlugs.has(row.topic_slug)) return;
      const path = row.topic_slug
        ? `/learning/${row.grid_slug}/${row.topic_slug}`
        : `/learning/${row.grid_slug}`;
      entries.push({ url: `${siteUrl}${path}`, lastModified: new Date(row.updated_at) });
    });

    // Published, website-visible topic Coding Problems (migration 0048/025).
    // Thin Generative-AI problems (empty examples/constraints/starter_code,
    // matching that page's own `noindex` metadata) are excluded here too.
    (codingProblems as { slug: string; updated_at: string }[] | null)?.forEach((row) => {
      if (thinCodingProblemSlugs.has(row.slug)) return;
      entries.push({ url: `${siteUrl}/coding-problems/${row.slug}`, lastModified: new Date(row.updated_at) });
    });

    // Published, website-visible global Practice coding problems (migration 0072/044).
    (practiceProblems as { slug: string; updated_at: string }[] | null)?.forEach((row) => {
      entries.push({ url: `${siteUrl}/practice/problems/${row.slug}`, lastModified: new Date(row.updated_at) });
    });

    // Published blog posts (migration 037 / 0065, RLS relaxed by 039 / 0067).
    // RLS already limits the anon key to status='published' rows; the filter
    // above is belt-and-braces.
    (blogPosts as { slug: string; updated_at: string }[] | null)?.forEach((row) => {
      entries.push({ url: `${siteUrl}/blog/${row.slug}`, lastModified: new Date(row.updated_at) });
    });

    // Published, website-visible Interview Questions topics (migration 0103/075).
    (interviewTopics as { category_slug: string; topic_slug: string; updated_at: string }[] | null)?.forEach((row) => {
      entries.push({
        url: `${siteUrl}/practice/interview-questions/${row.category_slug}/${row.topic_slug}`,
        lastModified: new Date(row.updated_at),
      });
    });
  }

  return entries;
}

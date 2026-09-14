import type { MetadataRoute } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campusedux.app";

const STATIC_ROUTES = [
  "", "/projects", "/projects/trending", "/projects/premium", "/projects/best-sellers", "/projects/new",
  "/jobs", "/jobs/companies", "/learning", "/blog", "/compiler", "/resume", "/resume/templates", "/custom-projects",
  "/practice", "/practice/problems", "/practice/compiler",
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
    ] = await Promise.all([
      supabase.from("projects").select("id,updated_at").limit(1000),
      supabase.from("jobs").select("id,updated_at").limit(1000),
      supabase.from("categories").select("id").limit(200),
      supabase.from("companies").select("id,updated_at").limit(500),
      supabase.rpc("learning_sitemap", { p_platform: "website" }),
      supabase.rpc("coding_problems_sitemap", { p_platform: "website" }),
      supabase.rpc("practice_problems_sitemap", { p_platform: "website" }),
      supabase
        .from("blog_posts")
        .select("slug,updated_at")
        .eq("status", "published")
        .limit(1000),
    ]);

    projects?.forEach((p) => entries.push({ url: `${siteUrl}/projects/${p.id}`, lastModified: new Date(p.updated_at) }));
    jobs?.forEach((j) => entries.push({ url: `${siteUrl}/jobs/${j.id}`, lastModified: new Date(j.updated_at) }));
    categories?.forEach((c) => entries.push({ url: `${siteUrl}/projects/category/${c.id}` }));
    companies?.forEach((c) => entries.push({ url: `${siteUrl}/jobs/companies/${c.id}`, lastModified: new Date(c.updated_at) }));

    // Published, website-visible Learning grid + topic URLs (row with a null
    // topic_slug is the grid landing page). Draft / archived / mobile-only /
    // premium-parent-hidden rows are excluded by the SECURITY DEFINER RPC.
    (learning as { grid_slug: string; topic_slug: string | null; updated_at: string }[] | null)?.forEach((row) => {
      const path = row.topic_slug
        ? `/learning/${row.grid_slug}/${row.topic_slug}`
        : `/learning/${row.grid_slug}`;
      entries.push({ url: `${siteUrl}${path}`, lastModified: new Date(row.updated_at) });
    });

    // Published, website-visible topic Coding Problems (migration 0048/025).
    (codingProblems as { slug: string; updated_at: string }[] | null)?.forEach((row) => {
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
  }

  return entries;
}

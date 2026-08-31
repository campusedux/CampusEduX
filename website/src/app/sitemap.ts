import type { MetadataRoute } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campusedux.app";

const STATIC_ROUTES = [
  "", "/projects", "/projects/trending", "/projects/premium", "/projects/best-sellers", "/projects/new",
  "/jobs", "/jobs/companies", "/placement", "/resume", "/resume/templates", "/custom-projects",
  "/premium", "/referral", "/faq", "/about", "/contact", "/support",
  "/privacy-policy", "/terms", "/refund-policy", "/project-license", "/community-guidelines",
  "/disclaimer", "/delete-account",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const supabase = getPublicSupabase();
  if (supabase) {
    const [{ data: projects }, { data: jobs }, { data: categories }, { data: companies }] = await Promise.all([
      supabase.from("projects").select("id,updated_at").limit(1000),
      supabase.from("jobs").select("id,updated_at").limit(1000),
      supabase.from("categories").select("id").limit(200),
      supabase.from("companies").select("id,updated_at").limit(500),
    ]);

    projects?.forEach((p) => entries.push({ url: `${siteUrl}/projects/${p.id}`, lastModified: new Date(p.updated_at) }));
    jobs?.forEach((j) => entries.push({ url: `${siteUrl}/jobs/${j.id}`, lastModified: new Date(j.updated_at) }));
    categories?.forEach((c) => entries.push({ url: `${siteUrl}/projects/category/${c.id}` }));
    companies?.forEach((c) => entries.push({ url: `${siteUrl}/jobs/companies/${c.id}`, lastModified: new Date(c.updated_at) }));
  }

  return entries;
}

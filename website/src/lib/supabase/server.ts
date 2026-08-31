import { createClient } from "@supabase/supabase-js";

// Read-only, anon-key client for public catalog data. Every table queried
// from this file has a "select using (true)" RLS policy in the existing
// Supabase project (categories, projects, reviews, companies, jobs,
// premium_plans, premium_features, resume_templates, custom_project_*
// catalog tables, faqs, testimonials, banners, cms_pages, reward_settings).
//
// This client must never receive the service-role key, and must never be
// used for any authenticated/user-owned data (wallet, resumes_builder,
// applications, purchases, etc.) — those belong to the Phase 2 account
// dashboard, built with @supabase/ssr and a real session, matching the
// pattern already used in admin-panel/.
export function getPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

import { getPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 300;

// Reads a row from public.cms_pages (key in: terms | privacy | about | refund_policy).
// If admin has not filled in `content` yet, this shows an honest placeholder
// instead of inventing legal text — the owner must write the real policy in
// the admin panel CMS. Never fabricate this content in the frontend.
export default async function CmsLegalPage({
  cmsKey,
  fallbackTitle,
}: {
  cmsKey: "terms" | "privacy" | "about" | "refund_policy";
  fallbackTitle: string;
}) {
  const supabase = getPublicSupabase();
  let page: { title: string; content: string; updated_at: string } | null = null;
  if (supabase) {
    const { data } = await supabase.from("cms_pages").select("title,content,updated_at").eq("key", cmsKey).maybeSingle();
    page = data;
  }

  const title = page?.title || fallbackTitle;

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl text-ink">{title}</h1>
      {page?.updated_at && (
        <p className="mt-1 text-xs text-ink-muted">Last updated {new Date(page.updated_at).toLocaleDateString("en-IN")}</p>
      )}
      {page?.content ? (
        <div className="mt-6 whitespace-pre-line text-ink-muted">{page.content}</div>
      ) : (
        <div className="empty-state mt-6">
          This policy has not been written yet in the admin panel CMS (Settings → CMS Pages → {cmsKey}). Publishing it there will make it appear here automatically — this page intentionally does not show placeholder legal text, since a real Privacy Policy / Terms document must reflect actual data practices, business rules and legal entity details that only the CampusEduX owner can confirm.
        </div>
      )}
    </div>
  );
}

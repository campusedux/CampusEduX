import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import ProjectCard from "@/components/ProjectCard";
import { toWishlistEntries } from "@/lib/wishlist";
import { RemoveSavedButton } from "./RemoveSavedButton";
import { EmptyState, Button } from "@/components/ui";

export const metadata = { robots: { index: false, follow: false }, title: "Saved projects" };

export default async function SavedProjectsPage() {
  await requireUser();
  const supabase = createAuthedServerSupabase();

  // my_wishlist() (0120/092): published/purchased projects come back with card data, anything
  // unpublished or removed is a detail-free tombstone ("No longer available").
  const { data } = await supabase.rpc("my_wishlist");
  const entries = toWishlistEntries(data);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Saved projects</h1>
      {entries.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No saved projects yet"
          subtitle="Tap the heart on any project to keep it here."
          action={<Button href="/projects" size="sm">Browse the marketplace</Button>}
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((e) =>
            e.kind === "project" ? (
              <ProjectCard key={e.project.id} project={e.project} />
            ) : (
              <div
                key={e.projectId}
                data-testid="wishlist-unavailable"
                aria-disabled="true"
                className="card flex flex-col justify-between gap-4 p-5 opacity-60 grayscale"
              >
                <div>
                  <p className="text-base font-semibold text-ink">No longer available</p>
                  <p className="mt-1 text-sm text-ink-muted">This project isn&apos;t listed any more.</p>
                </div>
                <RemoveSavedButton projectId={e.projectId} />
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

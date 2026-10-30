"use client";

import { useState } from "react";
import { removeFromWishlistAction } from "@/lib/actions/wishlist";

export function RemoveSavedButton({ projectId }: { projectId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (pending) return;
          setPending(true);
          setError(null);
          try {
            const r = await removeFromWishlistAction(projectId);
            setError("error" in r ? r.error : null);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
          } finally {
            setPending(false);
          }
        }}
        className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
      >
        {pending ? "Removing…" : "Remove from saved"}
      </button>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

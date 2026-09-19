"use client";

import { useState, useTransition } from "react";
import { removeFromWishlistAction } from "@/lib/actions/wishlist";

export function RemoveSavedButton({ projectId }: { projectId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await removeFromWishlistAction(projectId);
            setError("error" in r ? r.error : null);
          })
        }
        className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
      >
        {pending ? "Removing…" : "Remove from saved"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

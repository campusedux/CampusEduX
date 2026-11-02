"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

const projectIdSchema = z.string().trim().min(1).max(200);

/** Remove one project from the signed-in user's wishlist (own-row delete policy; works for tombstones too). */
export async function removeFromWishlistAction(rawProjectId: string): Promise<{ ok: true } | { error: string }> {
  const parsed = projectIdSchema.safeParse(rawProjectId);
  if (!parsed.success) return { error: "Invalid project." };
  const user = await getOptionalUser();
  if (!user) return { error: "Please sign in again." };
  const supabase = await createAuthedServerSupabase();
  const { error } = await supabase.from("wishlists").delete().eq("project_id", parsed.data).eq("user_id", user.id);
  if (error) return { error: "Could not remove it from your saved projects. Please try again." };
  revalidatePath("/account/saved-projects");
  return { ok: true };
}

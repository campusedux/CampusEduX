import { cache } from "react";
import { getPublicSupabase } from "@/lib/supabase/server";
import { CustomProjectReadError, readCustomProject } from "@/lib/customProjectReads";
import type { PricingRow } from "@/lib/customProjects";

/** Display and estimate source; Razorpay independently reads this same catalogue. */
export const loadProjectPricing = cache(async (): Promise<PricingRow[]> => {
  const pub = getPublicSupabase({ fresh: true });
  if (!pub) throw new CustomProjectReadError("unavailable");
  const rows = await readCustomProject((signal) => pub.from("custom_project_pricing")
    .select("project_type,project_level,base_price,token_amount,pricing_version")
    .eq("is_active", true).abortSignal(signal));
  if (!Array.isArray(rows)) throw new CustomProjectReadError("unavailable");
  return rows as PricingRow[];
});

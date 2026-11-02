import type { PricingRow } from "@/lib/customProjects";
import { formatINR } from "@/lib/format";

export const PROJECT_TYPE_LABEL: Record<string, string> = { academic: "Mentoring", personal: "Personal", business: "Business" };

/** Never substitute a stale seed price when the live catalogue is unavailable. */
export function projectTokenPrices(rows: PricingRow[]): string {
  const entries = rows.filter((r) => Number.isFinite(Number(r.token_amount)) && Number(r.token_amount) > 0);
  if (!entries.length) return "shown for your selected project type and level in the estimate before payment; contact us if pricing is unavailable";
  return entries.map((r) => `${PROJECT_TYPE_LABEL[r.project_type] ?? r.project_type} (${r.project_level}): ${formatINR(Number(r.token_amount))}`).join("; ");
}

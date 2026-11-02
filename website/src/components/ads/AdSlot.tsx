import { cookies } from "next/headers";
import { isAdContentRoute, type AdPage } from "@/lib/advertising";
import { AdSlotClient } from "./AdSlotClient";

/** Server attestation plus a client consent/session gate. No ad units installed. */
export async function AdSlot({ page }: { page: AdPage }) {
  const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
  if (!enabled || page.access !== "public" || !page.hasContent || page.status !== 200 || !isAdContentRoute(page.path)) return null;
  const jar = await cookies();
  // Reject session-bearing requests even when profile verification is unavailable.
  if (jar.getAll().some(({ name }) => /^sb-.*-auth-token(?:\.\d+)?$/.test(name))) return null;
  // The client starts empty and observes consent changes without a page reload.
  return <AdSlotClient page={page} />;
}

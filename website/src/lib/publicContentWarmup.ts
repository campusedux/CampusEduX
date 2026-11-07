import { getPublicSupabase } from "@/lib/supabase/server";
import { isPublicReadColdStart, publicReadRuntime } from "@/lib/publicReadRuntime";
import { PublicReadTimeout, publicReadDeadline } from "@/lib/publicReadDeadline";

const WARMUP_TIMEOUT_MS = 20_000;

/** One bounded startup pass. Visitors still verify a current revision themselves. */
export function warmPublicContent(): Promise<void> {
  return publicReadRuntime.warmup ??= runWarmup();
}

async function runWarmup(): Promise<void> {
  const started = Date.now();
  try {
    if (!getPublicSupabase({ fresh: true })) {
      console.info(JSON.stringify({ event: "public_content_warmup", outcome: "skipped", reason: "unconfigured" }));
      return;
    }
    const results = await publicReadDeadline(async () => {
      const [home, learning, blog] = await Promise.all([
        import("@/lib/cache"), import("@/lib/learning"), import("@/lib/blog"),
      ]);
      // Home claims the first revision read. Each loader verifies again before
      // admission; no startup token can authorize a later visitor's cached read.
      // Bound the whole pass too: Home's fresh Jobs read is not a cache fill.
      return Promise.allSettled([
        home.getCachedHomeData(), learning.getLearningGrids(),
        blog.getBlogPage({ page: 1 }), blog.getBlogCategories(), blog.getLatestPosts(3),
      ]);
    }, WARMUP_TIMEOUT_MS);
    const failed = results.filter(result => result.status === "rejected").length;
    console.info(JSON.stringify({ event: "public_content_warmup", outcome: failed ? "partial" : "completed",
      attempted: results.length, failed, duration_ms: Date.now() - started, cold_start: isPublicReadColdStart() }));
  } catch (error) {
    // Even module/configuration failures must not prevent the server starting.
    console.error(JSON.stringify({ event: "public_content_warmup", outcome: "failed",
      duration_ms: Date.now() - started, cold_start: isPublicReadColdStart(),
      timed_out: error instanceof PublicReadTimeout, deadline_ms: WARMUP_TIMEOUT_MS }));
  }
}

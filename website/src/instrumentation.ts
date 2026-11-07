export async function register() {
  // Keep the dynamic import inside the runtime branch so Next eliminates it
  // from the Edge instrumentation bundle (the readers use Node crypto).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NEXT_PHASE === "phase-production-build") return;
    try {
      const { warmPublicContent } = await import("@/lib/publicContentWarmup");
      await warmPublicContent();
    } catch {
      console.error(JSON.stringify({ event: "public_content_warmup", outcome: "failed" }));
    }
  }
}

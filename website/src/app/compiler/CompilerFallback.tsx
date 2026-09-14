/**
 * Suspense fallback for the standalone compiler — mirrors the real centered,
 * dark IDE card so there is no layout jump when `CompilerWorkspace` mounts.
 * Shared by `/compiler` and `/practice/compiler`.
 */
export function CompilerFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-3 h-4 w-40 animate-pulse rounded bg-line/70" />
      <div className="overflow-hidden rounded-2xl border border-line bg-[#0b1120] shadow-card">
        <div className="h-[52px] border-b border-white/10 bg-[#0f172a]/95" />
        <div className="space-y-3 p-3">
          <div className="h-[46vh] min-h-[240px] animate-pulse rounded-xl bg-white/[0.04] lg:h-[38vh]" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompilerFallback;

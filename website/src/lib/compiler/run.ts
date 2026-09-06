import { resolveLanguage } from "./languages";
import { RUN_TIMEOUT_MS } from "./limits";
import { normalizeSource } from "./normalize";
import type { RunRequest } from "./schema";
import { createJudge0Provider } from "./providers/judge0";
import { createPistonProvider } from "./providers/piston";
import { createPaizaProvider } from "./providers/paiza";
import { type CompilerProvider, type NormalizedRun, ProviderError } from "./providers/types";

/**
 * Server-only entry point: pick the configured provider, run untrusted code in
 * its sandbox with a hard wall-clock abort, and hand back a normalised result.
 * Never executes code in this process; never throws a provider's raw error to
 * the caller.
 */
export type RunOutcome =
  | { ok: true; provider: string; run: NormalizedRun }
  | { ok: false; provider: string; code: "not_configured" | "provider_error"; error: string };

function getProvider(): CompilerProvider {
  const choice = (process.env.COMPILER_PROVIDER || "paiza").trim().toLowerCase();
  if (choice === "judge0") return createJudge0Provider();
  if (choice === "piston") return createPistonProvider();
  return createPaizaProvider();
}

export async function runCode(req: RunRequest): Promise<RunOutcome> {
  const language = resolveLanguage(req.language);
  const provider = getProvider();
  if (!language) {
    return { ok: false, provider: provider.name, code: "provider_error", error: "That language isn't supported." };
  }

  const source = normalizeSource(language.id, req.source);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RUN_TIMEOUT_MS + 3_000);
  try {
    const run = await provider.run({ language, source, stdin: req.stdin ?? "" }, controller.signal);
    return { ok: true, provider: provider.name, run };
  } catch (err) {
    if (err instanceof ProviderError) {
      if (err.kind === "config") {
        return { ok: false, provider: provider.name, code: "not_configured", error: err.message };
      }
      if (err.kind === "timeout") {
        return {
          ok: true,
          provider: provider.name,
          run: {
            stdout: "",
            stderr: "",
            compileOutput: "",
            exitCode: null,
            timedOut: true,
            status: "timeout",
            timeMs: RUN_TIMEOUT_MS,
          },
        };
      }
      return { ok: false, provider: provider.name, code: "provider_error", error: err.message };
    }
    if ((err as Error)?.name === "AbortError") {
      return {
        ok: true,
        provider: provider.name,
        run: {
          stdout: "",
          stderr: "",
          compileOutput: "",
          exitCode: null,
          timedOut: true,
          status: "timeout",
          timeMs: RUN_TIMEOUT_MS,
        },
      };
    }
    return { ok: false, provider: provider.name, code: "provider_error", error: "The compiler failed unexpectedly. Please try again." };
  } finally {
    clearTimeout(timer);
  }
}

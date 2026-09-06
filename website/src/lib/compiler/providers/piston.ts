import { RUN_TIMEOUT_MS } from "../limits";
import { type CompilerProvider, type NormalizedRun, ProviderError, type RunInput } from "./types";

/**
 * Adapter for a Piston execution server (https://github.com/engineer-man/piston).
 * Defaults to the free public instance at emkc.org — good for local / preview,
 * no API key. For production, run your own Piston or switch `COMPILER_PROVIDER`
 * to `judge0`.
 */
const DEFAULT_BASE = "https://emkc.org/api/v2/piston";

interface PistonStage {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number | null;
  signal?: string | null;
}
interface PistonResponse {
  run?: PistonStage;
  compile?: PistonStage;
  message?: string;
}

export function createPistonProvider(): CompilerProvider {
  const base = (process.env.PISTON_URL || DEFAULT_BASE).replace(/\/$/, "");

  return {
    name: "piston",
    async run(input: RunInput, signal: AbortSignal): Promise<NormalizedRun> {
      const startedAt = Date.now();
      let res: Response;
      try {
        res = await fetch(`${base}/execute`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal,
          body: JSON.stringify({
            language: input.language.piston.language,
            version: input.language.piston.version,
            files: [{ name: input.language.filename, content: input.source }],
            stdin: input.stdin,
            compile_timeout: Math.min(RUN_TIMEOUT_MS, 10_000),
            run_timeout: Math.min(RUN_TIMEOUT_MS, 10_000),
          }),
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") throw new ProviderError("Execution timed out.", "timeout");
        throw new ProviderError("Could not reach the execution service.", "network");
      }

      const timeMs = Date.now() - startedAt;

      if (res.status === 429) throw new ProviderError("The execution service is busy. Try again in a moment.", "upstream");
      if (res.status === 401 || res.status === 403) {
        // The public emkc.org Piston API is whitelist-only since 2026-02-15.
        throw new ProviderError(
          "This Piston endpoint is not accepting requests. Set COMPILER_PROVIDER=judge0 or point PISTON_URL at your own Piston instance.",
          "config",
        );
      }
      if (!res.ok) throw new ProviderError(`The execution service returned an error (${res.status}).`, "upstream");

      let body: PistonResponse;
      try {
        body = (await res.json()) as PistonResponse;
      } catch {
        throw new ProviderError("The execution service sent an unreadable response.", "upstream");
      }
      if (body.message && !body.run) throw new ProviderError("The execution service rejected the request.", "upstream");

      const compile = body.compile;
      const run = body.run ?? {};
      const compileFailed = Boolean(compile) && (compile!.code ?? 0) !== 0;
      const timedOut = run.signal === "SIGKILL" || run.signal === "SIGTERM";
      const exitCode = typeof run.code === "number" ? run.code : null;

      const status: NormalizedRun["status"] = timedOut
        ? "timeout"
        : compileFailed
          ? "compile_error"
          : exitCode !== null && exitCode !== 0
            ? "runtime_error"
            : "success";

      return {
        stdout: run.stdout ?? "",
        stderr: run.stderr ?? "",
        compileOutput: compileFailed ? compile!.stderr || compile!.output || "" : "",
        exitCode,
        timedOut,
        status,
        timeMs,
      };
    },
  };
}

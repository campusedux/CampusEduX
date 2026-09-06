import { RUN_TIMEOUT_MS } from "../limits";
import { type CompilerProvider, type NormalizedRun, ProviderError, type RunInput } from "./types";

/**
 * Adapter for a Judge0 CE server (https://judge0.com) — either self-hosted or
 * the RapidAPI-hosted `judge0-ce.p.rapidapi.com`. Config comes from env only:
 *
 *   JUDGE0_URL         base URL (required when COMPILER_PROVIDER=judge0)
 *   JUDGE0_KEY         RapidAPI key        -> sent as X-RapidAPI-Key
 *   JUDGE0_AUTH_TOKEN  self-hosted token   -> sent as X-Auth-Token
 *
 * No key is ever read outside this server module.
 */
function b64encode(s: string): string {
  return Buffer.from(s, "utf8").toString("base64");
}
function b64decode(s: string | null | undefined): string {
  if (!s) return "";
  try {
    return Buffer.from(s, "base64").toString("utf8");
  } catch {
    return "";
  }
}

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  exit_code: number | null;
  time: string | null;
  status: { id: number; description: string } | null;
}

export function createJudge0Provider(): CompilerProvider {
  const base = (process.env.JUDGE0_URL || "").replace(/\/$/, "");
  const rapidKey = process.env.JUDGE0_KEY || "";
  const authToken = process.env.JUDGE0_AUTH_TOKEN || "";

  return {
    name: "judge0",
    async run(input: RunInput, signal: AbortSignal): Promise<NormalizedRun> {
      if (!base) throw new ProviderError("The compiler is not configured.", "config");

      const headers: Record<string, string> = { "content-type": "application/json" };
      if (/rapidapi\.com/i.test(base)) {
        if (!rapidKey) throw new ProviderError("The compiler is not configured.", "config");
        headers["X-RapidAPI-Key"] = rapidKey;
        try {
          headers["X-RapidAPI-Host"] = new URL(base).host;
        } catch {
          /* base validated below by fetch */
        }
      } else if (authToken) {
        headers["X-Auth-Token"] = authToken;
      }

      const cpuLimit = Math.max(2, Math.round(RUN_TIMEOUT_MS / 1000) - 2);
      const startedAt = Date.now();
      let res: Response;
      try {
        res = await fetch(`${base}/submissions?base64_encoded=true&wait=true`, {
          method: "POST",
          headers,
          signal,
          body: JSON.stringify({
            language_id: input.language.judge0Id,
            source_code: b64encode(input.source),
            stdin: b64encode(input.stdin),
            cpu_time_limit: cpuLimit,
            wall_time_limit: cpuLimit + 5,
          }),
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") throw new ProviderError("Execution timed out.", "timeout");
        throw new ProviderError("Could not reach the execution service.", "network");
      }

      const timeMs = Date.now() - startedAt;

      if (res.status === 401 || res.status === 403) throw new ProviderError("The compiler is not configured.", "config");
      if (res.status === 429) throw new ProviderError("The execution service is busy. Try again in a moment.", "upstream");
      if (!res.ok) throw new ProviderError(`The execution service returned an error (${res.status}).`, "upstream");

      let body: Judge0Response;
      try {
        body = (await res.json()) as Judge0Response;
      } catch {
        throw new ProviderError("The execution service sent an unreadable response.", "upstream");
      }

      const statusId = body.status?.id ?? 13;
      if (statusId === 13 || statusId === 14) {
        throw new ProviderError("The execution service could not run this program.", "upstream");
      }

      const timedOut = statusId === 5;
      const compileFailed = statusId === 6;
      const runtimeError = statusId >= 7 && statusId <= 12;

      const status: NormalizedRun["status"] = timedOut
        ? "timeout"
        : compileFailed
          ? "compile_error"
          : runtimeError
            ? "runtime_error"
            : "success";

      return {
        stdout: b64decode(body.stdout),
        stderr: b64decode(body.stderr) || (runtimeError ? b64decode(body.message) : ""),
        compileOutput: compileFailed ? b64decode(body.compile_output) : "",
        exitCode: typeof body.exit_code === "number" ? body.exit_code : null,
        timedOut,
        status,
        timeMs,
      };
    },
  };
}

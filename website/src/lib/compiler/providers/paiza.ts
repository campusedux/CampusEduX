import { RUN_TIMEOUT_MS } from "../limits";
import { type CompilerProvider, type NormalizedRun, ProviderError, type RunInput } from "./types";

/**
 * Adapter for the Paiza.IO runner API (https://paiza.io) in **guest** mode.
 *
 * Keyless: `api_key=guest` is Paiza's documented public sandbox — isolated
 * container, no network, no filesystem, ~2s CPU / small output cap. That makes
 * it the zero-config default for CampusEduX. For higher throughput / an SLA,
 * switch `COMPILER_PROVIDER` to `judge0` (self-hosted or RapidAPI).
 *
 * Flow: POST /runners/create -> poll GET /runners/get_status -> GET /runners/get_details
 */
const DEFAULT_BASE = "https://api.paiza.io";

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

interface PaizaCreate {
  id?: string;
  status?: string;
  error?: string;
}
interface PaizaDetails {
  build_stderr?: string | null;
  build_result?: string | null; // "success" | "failure" | null
  stdout?: string | null;
  stderr?: string | null;
  exit_code?: string | null;
  result?: string | null; // "success" | "failure" | "timeout" | ...
}

export function createPaizaProvider(): CompilerProvider {
  const base = (process.env.PAIZA_URL || DEFAULT_BASE).replace(/\/$/, "");
  const apiKey = process.env.PAIZA_API_KEY || "guest";

  async function getJson<T>(url: string, init: RequestInit, signal: AbortSignal): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal });
    } catch (err) {
      if ((err as Error).name === "AbortError") throw new ProviderError("Execution timed out.", "timeout");
      throw new ProviderError("Could not reach the execution service.", "network");
    }
    if (res.status === 429) throw new ProviderError("The execution service is busy. Try again in a moment.", "upstream");
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError("The execution service rejected the request.", "upstream");
    }
    if (!res.ok) throw new ProviderError(`The execution service returned an error (${res.status}).`, "upstream");
    try {
      return (await res.json()) as T;
    } catch {
      throw new ProviderError("The execution service sent an unreadable response.", "upstream");
    }
  }

  return {
    name: "paiza",
    async run(input: RunInput, signal: AbortSignal): Promise<NormalizedRun> {
      const startedAt = Date.now();

      const created = await getJson<PaizaCreate>(
        `${base}/runners/create`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            source_code: input.source,
            language: input.language.paiza,
            input: input.stdin,
            longpoll: "true",
            longpoll_timeout: "10",
            api_key: apiKey,
          }).toString(),
        },
        signal,
      );
      if (created.error || !created.id) {
        throw new ProviderError("The execution service rejected the request.", "upstream");
      }

      let status = created.status ?? "running";
      const deadline = startedAt + RUN_TIMEOUT_MS;
      while (status !== "completed" && Date.now() < deadline) {
        await sleep(650, signal);
        const st = await getJson<PaizaCreate>(
          `${base}/runners/get_status?id=${encodeURIComponent(created.id)}&api_key=${apiKey}`,
          { method: "GET" },
          signal,
        );
        status = st.status ?? status;
      }

      const timeMs = Date.now() - startedAt;
      if (status !== "completed") {
        return { stdout: "", stderr: "", compileOutput: "", exitCode: null, timedOut: true, status: "timeout", timeMs };
      }

      const d = await getJson<PaizaDetails>(
        `${base}/runners/get_details?id=${encodeURIComponent(created.id)}&api_key=${apiKey}`,
        { method: "GET" },
        signal,
      );

      const timedOut = d.result === "timeout";
      const compileFailed = d.build_result === "failure";
      const exitCode = d.exit_code != null && /^-?\d+$/.test(d.exit_code) ? Number.parseInt(d.exit_code, 10) : null;
      const runtimeError = !compileFailed && !timedOut && (d.result === "failure" || (exitCode !== null && exitCode !== 0));

      const normalizedStatus: NormalizedRun["status"] = timedOut
        ? "timeout"
        : compileFailed
          ? "compile_error"
          : runtimeError
            ? "runtime_error"
            : "success";

      return {
        stdout: d.stdout ?? "",
        stderr: d.stderr ?? "",
        compileOutput: compileFailed ? d.build_stderr || "The compiler reported an error." : "",
        exitCode,
        timedOut,
        status: normalizedStatus,
        timeMs,
      };
    },
  };
}

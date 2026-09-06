import type { LanguageDef } from "../languages";

/** Normalised execution result — every provider maps its own response onto this. */
export interface NormalizedRun {
  stdout: string;
  stderr: string;
  /** Compiler diagnostics for compiled languages (empty for interpreted ones). */
  compileOutput: string;
  /** Process exit code when the provider reports one, else null. */
  exitCode: number | null;
  /** True when the run hit the CPU / wall-clock limit. */
  timedOut: boolean;
  /** Short provider-agnostic status: "success" | "compile_error" | "runtime_error" | "timeout". */
  status: "success" | "compile_error" | "runtime_error" | "timeout";
  /** Wall-clock milliseconds the provider call took (server-measured). */
  timeMs: number;
}

export interface RunInput {
  language: LanguageDef;
  source: string;
  stdin: string;
}

export interface CompilerProvider {
  /** Provider id, surfaced in the API response for debugging (not a secret). */
  readonly name: string;
  /** Throws `ProviderError` on transport / upstream failure; never runs code locally. */
  run(input: RunInput, signal: AbortSignal): Promise<NormalizedRun>;
}

/** Raised for any provider-side failure so the route can answer 502 without leaking internals. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly kind: "config" | "upstream" | "network" | "timeout" = "upstream",
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

// Shared by server loaders and the browser draft hook. Never expose provider details.
export type CustomProjectReadFailure = "unavailable" | "transient" | "unauthorized";

export class CustomProjectReadError extends Error {
  constructor(public readonly kind: CustomProjectReadFailure) {
    super(kind === "unauthorized" ? "Please sign in again to load your project." :
      kind === "unavailable" ? "Custom project data is currently unavailable." :
        "We couldn’t load your project. Please try again.");
    this.name = "CustomProjectReadError";
  }
}

export function customProjectReadError(error: unknown): CustomProjectReadError {
  if (error instanceof CustomProjectReadError) return error;
  const { code, status } = (error ?? {}) as { code?: string; status?: number };
  if (status === 401 || status === 403 || ["42501", "PGRST301", "PGRST302", "PGRST303"].includes(code ?? "")) {
    return new CustomProjectReadError("unauthorized");
  }
  return new CustomProjectReadError(["42P01", "42703", "PGRST204", "PGRST205"].includes(code ?? "") ? "unavailable" : "transient");
}

/** Bound reads, including transports that reject or never settle after abort. */
export async function readCustomProject<T>(
  query: (signal: AbortSignal) => PromiseLike<{ data: T; error: unknown; status?: number }>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Promise.resolve().then(() => query(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new CustomProjectReadError("transient"));
        }, 10_000);
      }),
    ]);
    if (result.error) throw customProjectReadError({ ...Object(result.error), ...(result.status ? { status: result.status } : {}) });
    if (result.data === undefined) throw new CustomProjectReadError("unavailable");
    return result.data;
  } catch (error) {
    throw customProjectReadError(error);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Single funnel for "this should be reported" errors (error boundaries, caught
 * failures). Sentry is intentionally NOT wired yet: call `setErrorReporter()`
 * once at startup with an adapter and every report is forwarded to it.
 */
export interface ErrorReportContext {
  /** Where it happened, e.g. "ErrorBoundary:Jobs" or "auth.login". */
  source?: string;
  componentStack?: string | null;
  extra?: Record<string, unknown>;
}

export type ErrorReporter = (error: unknown, context: ErrorReportContext) => void;

let externalReporter: ErrorReporter | null = null;

/** Hook for a crash-reporting SDK (e.g. Sentry.captureException). Pass null to detach. */
export function setErrorReporter(reporter: ErrorReporter | null): void {
  externalReporter = reporter;
}

export function reportError(error: unknown, context: ErrorReportContext = {}): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.error(`[reportError]${context.source ? ` ${context.source}` : ""}`, error, context.componentStack ?? "");
  }
  if (externalReporter) {
    try {
      externalReporter(error, context);
    } catch {
      // A broken reporter must never take the app down.
    }
  }
}

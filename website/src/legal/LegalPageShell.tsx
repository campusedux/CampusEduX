import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Outer frame shared by every legal page (document-rendered and hand-composed).
 * Reading-width column — legal text stays narrow for line length even though
 * marketing / dashboard pages use the wider site shell.
 */
export function LegalPageShell({
  title,
  version,
  effectiveDate,
  children,
}: {
  title: string;
  /** e.g. "1.0.0" — omitted on the hub index. */
  version?: string;
  /** already-formatted, e.g. "31 August 2026" */
  effectiveDate?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-shell-narrow">
      <Link
        href="/legal"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All policies
      </Link>

      <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">{title}</h1>
      {(version || effectiveDate) && (
        <p className="mt-2 text-sm text-ink-faint">
          {version && <>Version {version}</>}
          {version && effectiveDate && " · "}
          {effectiveDate && <>Last updated {effectiveDate}</>}
        </p>
      )}

      {children}
    </div>
  );
}

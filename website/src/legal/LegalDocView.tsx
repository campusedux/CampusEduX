import Link from "next/link";
import { Smartphone } from "lucide-react";
import type { LegalDocId } from "./types";
import { LEGAL_VERSIONS, formatLegalDate } from "./config";
import { interpolateDocument } from "./interpolate";
import { getLegalDocument, legalPath, RELATED, LEGAL_DOCUMENTS } from "./registry";
import { LegalPageShell } from "./LegalPageShell";
import { LegalProse } from "./LegalProse";

/** Chip row of related policies shown at the foot of every legal page. */
export function RelatedPolicies({ id }: { id: LegalDocId | "grievance" }) {
  const related = RELATED[id] ?? [];
  if (related.length === 0) return null;
  return (
    <div className="mt-12 border-t border-line pt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Related</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {related.map((rid) => {
          const label = rid === "grievance" ? "Grievance Redressal" : LEGAL_DOCUMENTS[rid].title;
          return (
            <Link
              key={rid}
              href={legalPath(rid)}
              className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-primary/40 hover:text-primary"
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Full page for one canonical legal document. `children` renders between the
 * document body and the related-policies row — used for website-specific
 * callouts (e.g. the in-app path on Delete Account, the form on Contact).
 */
export function LegalDocView({
  docId,
  appNote = true,
  children,
}: {
  docId: LegalDocId;
  /** Show the "also applies in the CampusEduX app" line. */
  appNote?: boolean;
  children?: React.ReactNode;
}) {
  const doc = interpolateDocument(getLegalDocument(docId));
  const meta = LEGAL_VERSIONS[docId];

  return (
    <LegalPageShell title={doc.title} version={meta.version} effectiveDate={formatLegalDate(meta.effectiveDate)}>
      {appNote && (
        <p className="mt-4 inline-flex items-start gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-ink-muted">
          <Smartphone className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-faint" aria-hidden />
          This is the same policy shown in the CampusEduX mobile app.
        </p>
      )}

      <LegalProse doc={doc} />

      {children}

      <RelatedPolicies id={docId} />
    </LegalPageShell>
  );
}

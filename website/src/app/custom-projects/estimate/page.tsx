import { CustomProjectReadError } from "@/lib/customProjectReads";
import { LoadError } from "../_builder/LoadError";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatINR, timeAgo } from "@/lib/format";
import { Badge, Button } from "@/components/ui";
import {
  PLATFORM_LABELS,
  TYPE_LABELS,
  LEVEL_LABELS,
  groupByCategory,
  type Platform,
  type ProjectLevel,
  type ProjectType,
} from "@/lib/customProjects";
import { loadDraftWithEstimate } from "@/lib/customProjects.server";
import FlowLayout from "../_builder/FlowLayout";
import { BottomBar } from "../_builder/BottomBar";
import { EditableEstimateSummary } from "../_builder/EditableEstimateSummary";

export const metadata: Metadata = {
  title: "Project estimate",
  robots: { index: false, follow: false },
};

const RECEIVE: string[] = [
  "Completed software implementation",
  "Selected features configured",
  "Project requirements considered",
  "Direct messaging with the team during development",
  "Project handover",
];
const BEFORE_YOU_CONTINUE: string[] = [
  "Your estimate is based on the project configuration selected above.",
  "Optional feature prices are shown separately from the base project price.",
  "Your project scope is based on the requirements and features you selected.",
  "The amount is calculated using the current CampusEduX pricing configuration.",
];

export default async function Page() {
  const user = await requireUser();
  let result: Awaited<ReturnType<typeof loadDraftWithEstimate>>;
  try {
    result = await loadDraftWithEstimate(user.id);
  } catch (error) {
    if (!(error instanceof CustomProjectReadError)) throw error;
    return <FlowLayout current={2}><LoadError kind={error.kind} /></FlowLayout>;
  }
  const { draft, draftUpdatedAt, estimate, catalog } = result;

  const missing: string[] = [];

  if (!draft.projectType) missing.push("project type");
  if (!draft.projectLevel) missing.push("level");
  if (!draft.platform) missing.push("platform");
  if (!draft.title.trim()) missing.push("title");

  return (
    <FlowLayout current={2}>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Step 3 · Project estimate</p>

          <h1 className="mt-1 text-[25px] font-semibold leading-tight text-ink">
            Review your project estimate
          </h1>

          <p className="mt-2 text-sm text-ink-muted sm:text-[15px]">
            Here&apos;s a clear breakdown of what your project includes, what
            you&apos;ve added, and the amount required to start.
          </p>
          {draft.projectType === "academic" && (
            <p className="mt-2 text-sm text-ink-muted">For assessed academic work, confirm mentoring at checkout. The software features shown here are not part of mentoring.</p>
          )}
        </div>

        {draftUpdatedAt && (
          <div className="flex-shrink-0 rounded-xl border border-line bg-card px-4 py-2.5 text-xs text-ink-muted shadow-card">
            Draft last saved{" "}
            <span className="font-semibold text-ink">
              {timeAgo(draftUpdatedAt)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-5">
        {missing.length > 0 ? (
          <div className="empty-state">
            Still need: {missing.join(", ")}.{" "}
            <Link
              href="/custom-projects/start"
              className="text-ink underline"
            >
              Go back and finish the details
            </Link>
            .
          </div>
        ) : (
          <EstimateBody draft={draft} estimate={estimate} catalog={catalog} />
        )}
      </div>
    </FlowLayout>
  );
}

function EstimateBody({
  draft,
  estimate,
  catalog,
}: {
  catalog: Awaited<ReturnType<typeof loadDraftWithEstimate>>["catalog"];
  draft: Awaited<ReturnType<typeof loadDraftWithEstimate>>["draft"];
  estimate: Awaited<ReturnType<typeof loadDraftWithEstimate>>["estimate"];
}) {
  const receive = RECEIVE;
  const included = estimate.selectedFeatures.filter(
    (f) =>
      f.isIncluded ||
      f.price === 0 ||
      draft.aiRecommendedFeatureIds.includes(f.id),
  );

  const additional = estimate.selectedFeatures.filter(
    (f) =>
      !f.isIncluded &&
      f.price > 0 &&
      !draft.aiRecommendedFeatureIds.includes(f.id),
  );

  const groupedIncluded = groupByCategory(included);

  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="min-w-0 space-y-4">
        {/* Project overview */}


        {/* Included Features */}
        <section>
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-5 w-5 text-success"
              aria-hidden
            />

            <h2 className="text-base font-semibold text-ink">
              Included Features
            </h2>
          </div>

          {groupedIncluded.length === 0 ? (
            <p className="mt-3 text-sm text-ink-faint">
              No included features are configured for this tier yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4 rounded-xl border border-line bg-card p-4 shadow-sm">
              {groupedIncluded.map(([category, rows]) => (
                <div key={category}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {category}
                  </p>

                  <ul className="mt-1.5 space-y-1">
                    {rows.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center gap-2 text-sm text-ink"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 flex-shrink-0 text-success"
                          aria-hidden
                        />

                        {f.name}

                        {f.price > 0 && (
                          <Badge tone="primary">
                            +{formatINR(f.price)}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Extra Features */}
        <section>
          <h2 className="text-base font-semibold text-ink">
            Extra Features
          </h2>

          <div className="mt-4 rounded-xl border border-line bg-card p-4 shadow-sm">
            {additional.length === 0 ? (
              <p className="text-sm text-ink-faint">
                No extra features selected.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {additional.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-ink">{f.name}</span>

                    <span className="font-semibold text-ink">
                      +{formatINR(f.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* What you'll receive */}
        <section>
          <h2 className="text-base font-semibold text-ink">
            What you&apos;ll receive
          </h2>

          <ul className="mt-4 grid gap-2 rounded-xl border border-line bg-card p-4 shadow-sm sm:grid-cols-2">
            {receive.map((r) => (
              <li
                key={r}
                className="flex items-center gap-2.5 text-sm text-ink"
              >
                <CheckCircle2
                  className="h-4 w-4 flex-shrink-0 text-success"
                  aria-hidden
                />

                {r}
              </li>
            ))}
          </ul>
        </section>
        <details className="rounded-xl border border-line bg-card p-4 text-sm text-ink-muted">
          <summary className="cursor-pointer font-semibold text-ink">Before you continue</summary>
          <ul className="mt-2 space-y-1 text-xs">{BEFORE_YOU_CONTINUE.map((note) => <li key={note}>{note}</li>)}</ul>
          <p className="mt-3 flex items-start gap-2 text-xs"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden /><span><strong>Secure estimate calculation.</strong> This amount is calculated from your project configuration on our server — never from a number sent by your browser.</span></p>
        </details>
      </div>

      {/* Right column */}
      <EditableEstimateSummary initialDraft={draft} initialEstimate={estimate} pricing={catalog.pricing} platforms={catalog.platforms} features={catalog.features} />
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">
        {value}
      </dd>
    </div>
  );
}

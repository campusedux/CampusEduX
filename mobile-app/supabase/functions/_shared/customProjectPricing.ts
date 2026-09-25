// Server-side feature pricing for create-custom-project-order, kept as one
// pure module (no Deno APIs, no I/O) so it is unit-testable from jest and
// stays in lock-step with src/services/customProjects.service.ts's
// calculateEstimate — tests/unit/services/customProjectsServerParity.test.ts
// asserts both produce the same totals.
//
// A feature that is INCLUDED for the request's "<type>:<level>" is never
// charged, even if a client (an old app build, the website builder) sends its
// id: it is snapshotted with price 0 and is_included = true instead.

// Deno needs the .ts extension; tsc (jest parity test) does not allow it.
// @ts-ignore TS5097
import { priceForFeature } from "./academicPricing.ts";

export interface FeatureRow {
  id: string;
  name: string;
  price: number;
  category: string;
  project_types: string[];
  project_levels: string[];
  included_in_levels: string[];
}

export interface SnapshotFeature {
  id: string;
  name: string;
  /** What the customer pays for this feature — always 0 when `isIncluded`. */
  price: number;
  category: string;
  isIncluded: boolean;
}

export interface FeaturePricing {
  /** Included features first (price 0), then the paid add-ons. */
  features: SnapshotFeature[];
  featureTotal: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * `rows` must be every active feature that is either selected or included for
 * this tier; rows not offered for `projectType`/`projectLevel` are dropped.
 */
export function priceFeatures(
  rows: FeatureRow[],
  selectedIds: string[],
  projectType: string,
  projectLevel: string,
  aiRecommendedFeatureIds: string[],
): FeaturePricing {
  const key = `${projectType}:${projectLevel}`;
  const offered = rows.filter(
    (f) =>
      Array.isArray(f.project_types) &&
      f.project_types.includes(projectType) &&
      Array.isArray(f.project_levels) &&
      f.project_levels.includes(projectLevel),
  );

  const isIncluded = (f: FeatureRow) =>
    Array.isArray(f.included_in_levels) && f.included_in_levels.includes(key);

  const included: SnapshotFeature[] = offered.filter(isIncluded).map((f) => ({
    id: f.id,
    name: f.name,
    price: 0,
    category: f.category ?? "",
    isIncluded: true,
  }));

  const addOns: SnapshotFeature[] = offered
    .filter((f) => selectedIds.includes(f.id) && !isIncluded(f))
    .map((f) => ({
      id: f.id,
      name: f.name,
      // Academic Extra Features price from the shared override (see
      // academicPricing.ts); Personal/Business keep the catalog price.
      price: priceForFeature(
        { id: f.id, price: Number(f.price) || 0 },
        projectType,
        aiRecommendedFeatureIds.includes(f.id),
      ),
      category: f.category ?? "",
      isIncluded: false,
    }));

  return {
    features: [...included, ...addOns],
    featureTotal: round2(addOns.reduce((s, f) => s + f.price, 0)),
  };
}

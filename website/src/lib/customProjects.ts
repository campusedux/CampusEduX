// Website mirror of mobile-app/src/types/customProject.types.ts +
// customProjects.service.ts. The Edge Functions (create-custom-project-order /
// verify-custom-project-payment) remain the single source of truth for what is
// actually charged and stored — everything here is for DISPLAY and draft state.

export const PROJECT_TYPES = ["academic", "personal", "business"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_LEVELS = ["standard", "advanced"] as const;
export type ProjectLevel = (typeof PROJECT_LEVELS)[number];

export const PLATFORMS = ["web", "android", "ios", "web_android", "web_android_ios"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CUSTOM_PROJECT_STATUSES = [
  "new",
  "in_development",
  "testing",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type CustomProjectStatus = (typeof CUSTOM_PROJECT_STATUSES)[number];

/** Trusted token per project type — DISPLAY only. The server recomputes the
 * real charge in create-custom-project-order (TOKEN_BY_TYPE there). */
export const CUSTOM_PROJECT_TOKENS: Record<ProjectType, number> = {
  academic: 1500,
  personal: 3000,
  business: 6000,
};

/** Progress % per status — mirrors custom_project_progress_for() in SQL. */
export const CUSTOM_PROJECT_PROGRESS: Record<CustomProjectStatus, number> = {
  new: 20,
  in_development: 50,
  testing: 80,
  ready: 90,
  delivered: 100,
  cancelled: 0,
};

/**
 * Customer-facing tracking steps — mirrors TIMELINE_STEPS in
 * mobile-app/src/customProjects/CustomProjectDetailScreen.tsx. A request only
 * appears once the token is paid, so the first three steps are always reached
 * for a listed request; the rest follow the admin-driven `status`.
 */
export const TRACKING_STEPS = [
  { key: "configured", label: "Project configured", minStatus: -1 },
  { key: "token_paid", label: "Token paid", minStatus: -1 },
  { key: "created", label: "Request created", minStatus: -1 },
  { key: "in_development", label: "Development started", minStatus: 1 },
  { key: "testing", label: "Testing", minStatus: 2 },
  { key: "ready", label: "Ready", minStatus: 3 },
  { key: "delivered", label: "Delivered", minStatus: 4 },
] as const;

const TRACKING_STATUS_ORDER: CustomProjectStatus[] = ["new", "in_development", "testing", "ready", "delivered"];

export type TrackingStepState = "done" | "current" | "upcoming";

/** Per-step state for a request status. `cancelled` reports every step as upcoming (the page shows a banner instead). */
export function trackingStepStates(
  status: string,
  tokenPaid = true,
): { key: string; label: string; state: TrackingStepState }[] {
  const idx = TRACKING_STATUS_ORDER.indexOf(status as CustomProjectStatus);
  const cancelled = status === "cancelled" || idx < 0;
  const reached = TRACKING_STEPS.map((step) =>
    cancelled ? false : step.key === "token_paid" || step.key === "created" ? tokenPaid : idx >= step.minStatus,
  );
  const lastDone = reached.lastIndexOf(true);
  return TRACKING_STEPS.map((step, i) => ({
    key: step.key,
    label: step.label,
    // The final step is "done" outright once delivered; otherwise the step after the last reached one is "current".
    state: reached[i] ? "done" : i === lastDone + 1 && !cancelled ? "current" : "upcoming",
  }));
}

export const TYPE_LABELS: Record<ProjectType, string> = {
  academic: "Academic",
  personal: "Personal",
  business: "Business",
};

/** Short card copy for the Step 1 project-type picker. Presentation only. */
export const TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
  academic: "For college assignments, final-year projects, mini projects and academic submissions.",
  personal: "For personal websites, portfolios, tools, apps and learning projects.",
  business: "For business websites, internal tools, customer-facing applications and commercial projects.",
};

export const LEVEL_LABELS: Record<ProjectLevel, string> = {
  standard: "Standard",
  advanced: "Advanced",
};

/** Short card copy for the Step 1 project-level picker. Presentation only. */
export const LEVEL_DESCRIPTIONS: Record<ProjectLevel, string> = {
  standard: "Essential functionality for straightforward projects.",
  advanced: "More complex functionality, integrations and customization.",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  web: "Web",
  android: "Android",
  ios: "iOS",
  web_android: "Web + Android",
  web_android_ios: "Web + Android + iOS",
};

export const STATUS_LABELS: Record<CustomProjectStatus, string> = {
  new: "Token paid / New",
  in_development: "In development",
  testing: "Testing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// --- uploads (custom-project-uploads bucket, migration 0033 §12) ----------
export const CP_UPLOADS_BUCKET = "custom-project-uploads";
export const CP_DELIVERIES_BUCKET = "custom-project-deliveries";
export const CP_SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year
export const CP_MAX_FILE_MB = 15; // matches BuilderUploadsScreen.MAX_FILE_MB
export const CP_MAX_FILE_BYTES = CP_MAX_FILE_MB * 1024 * 1024;
export const CP_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const CP_DOC_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
];

// --- draft (custom_project_drafts.payload jsonb) -------------------------
export type ReferenceFile = { path: string; name: string; sizeMb: number; label?: string };

export type BuilderDraft = {
  projectType: ProjectType | null;
  projectLevel: ProjectLevel | null;
  platform: Platform | null;
  title: string;
  objective: string;
  problemStatement: string;
  description: string;
  targetUsers: string;
  technologyPreference: string;
  featureIds: string[];
  customRequirements: { text: string }[];
  projectImagePath: string | null;
  referenceFiles: ReferenceFile[];
  /** Short AI-generated project overview shown on the Features & Files summary. */
  aiOverview: string;
  /** Ids (free or paid) the AI understanding call considers necessary for this project — shown as "Included", not "Extra". */
  aiRecommendedFeatureIds: string[];
  /** Paid feature ids the AI understanding call flagged as relevant-but-optional. */
  aiSuggestedExtraFeatureIds: string[];
  /** One-time default-selection guard so re-visiting Features & Files never stomps explicit toggles. */
  featuresSeeded: boolean;
};

export function emptyDraft(): BuilderDraft {
  return {
    projectType: null,
    projectLevel: null,
    platform: null,
    title: "",
    objective: "",
    problemStatement: "",
    description: "",
    targetUsers: "",
    technologyPreference: "",
    featureIds: [],
    customRequirements: [],
    projectImagePath: null,
    referenceFiles: [],
    aiOverview: "",
    aiRecommendedFeatureIds: [],
    aiSuggestedExtraFeatureIds: [],
    featuresSeeded: false,
  };
}

/** Merge a stored payload (unknown shape) onto a fresh draft, dropping junk. */
export function normalizeDraft(payload: unknown): BuilderDraft {
  const d = emptyDraft();
  if (!payload || typeof payload !== "object") return d;
  const p = payload as Record<string, unknown>;
  const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
    typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;

  d.projectType = pick(p.projectType, PROJECT_TYPES);
  d.projectLevel = pick(p.projectLevel, PROJECT_LEVELS);
  d.platform = pick(p.platform, PLATFORMS);
  for (const k of ["title", "objective", "problemStatement", "description", "targetUsers", "technologyPreference"] as const) {
    if (typeof p[k] === "string") d[k] = (p[k] as string).slice(0, 4000);
  }
  if (Array.isArray(p.featureIds)) d.featureIds = p.featureIds.filter((x) => typeof x === "string").slice(0, 200) as string[];
  if (Array.isArray(p.customRequirements)) {
    d.customRequirements = p.customRequirements
      .map((r) => ({ text: String((r as { text?: unknown })?.text ?? "").trim() }))
      .filter((r) => r.text.length > 0)
      .slice(0, 30);
  }
  if (typeof p.projectImagePath === "string") d.projectImagePath = p.projectImagePath;
  if (Array.isArray(p.referenceFiles)) {
    d.referenceFiles = p.referenceFiles
      .filter((f) => f && typeof (f as { path?: unknown }).path === "string")
      .map((f) => {
        const r = f as Record<string, unknown>;
        return {
          path: String(r.path),
          name: String(r.name ?? ""),
          sizeMb: Number(r.sizeMb) || 0,
          label: typeof r.label === "string" ? r.label : undefined,
        };
      })
      .slice(0, 20);
  }
  if (typeof p.aiOverview === "string") d.aiOverview = p.aiOverview.slice(0, 1000);
  if (Array.isArray(p.aiRecommendedFeatureIds)) {
    d.aiRecommendedFeatureIds = p.aiRecommendedFeatureIds.filter((x) => typeof x === "string").slice(0, 100) as string[];
  }
  if (Array.isArray(p.aiSuggestedExtraFeatureIds)) {
    d.aiSuggestedExtraFeatureIds = p.aiSuggestedExtraFeatureIds.filter((x) => typeof x === "string").slice(0, 100) as string[];
  }
  d.featuresSeeded = p.featuresSeeded === true;
  return d;
}

// --- catalog row shapes (snake_case, straight from PostgREST) ------------
export type PricingRow = { project_type: string; project_level: string; base_price: number; token_amount: number; pricing_version: number };
export type PlatformRow = { platform: string; label: string; charge: number; sort_order: number };
export type FeatureRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  project_types: string[];
  project_levels: string[];
  price: number;
  sort_order: number;
  icon: string | null;
  dependencies: string[];
  conflicts: string[];
  /** "<type>:<level>" keys this feature comes free with (admin "Included by default", migration 0115). */
  included_in_levels?: string[];
};

/**
 * Academic-only Extra Feature price override (₹40–150 band). `price` in
 * `custom_project_features` is one flat value shared across every
 * `project_types` a feature is offered to, so a Personal/Business student
 * and an Academic student are currently quoted the same figure for the same
 * feature — appropriate for Personal/Business (kept exactly as-is here) but
 * far too high for an academic assignment. Rather than editing the shared
 * catalog `price` column (which would also change Personal/Business), this
 * map is read ONLY when `projectType === "academic"` — see `priceForFeature`
 * below — so every other project type keeps reading the catalog price
 * untouched.
 *
 * Every id here is a real, currently-academic-eligible paid Extra Feature
 * from `mobile-app/supabase/migrations/0033_custom_project_builder.sql`.
 * The advanced (₹100–150) vs non-advanced (₹40–100) band each feature sits
 * in reuses the catalog's own existing classification: the `level` column
 * added in `mobile-app/supabase/migrations/0034_custom_feature_catalog.sql`
 * (basic/standard/advanced/premium), whose deterministic backfill rule is
 * `level = 'advanced' when price >= 2000 or name ilike '%advanced%'` —
 * applied here to each feature's seeded catalog price/name. Free "Included"
 * features (price 0) and features the AI understanding call has flagged as
 * necessary (shown under Included, not Extra) are intentionally absent —
 * see the `isRecommended` guard in `priceForFeature`.
 */
export const ACADEMIC_EXTRA_FEATURE_PRICES: Record<string, number> = {
  // Non-advanced (₹40–100) ---------------------------------------------
  "doc-viva": 40, // Viva questions — short prep content
  "media-pdf-upload": 45, // PDF upload — simple upload widget
  "doc-ppt": 45, // Presentation (PPT) — short slide deck
  "auth-google": 50, // Google login — standard OAuth integration
  "pay-history": 50, // Payment history — simple read-only list
  "notif-inapp": 55, // In-app notifications — simple notification centre
  "media-multi-image": 55, // Multiple image upload — batch upload + gallery
  "search-filters": 55, // Filters — filter results by common fields
  "doc-documentation": 55, // Technical documentation — short write-up
  "doc-srs": 60, // SRS document — a full requirements document
  "notif-email": 65, // Email notifications — transactional email setup
  "doc-project-report": 70, // Project report — a longer formatted document
  "auth-otp": 75, // OTP / phone verification — SMS/email OTP infra
  "admin-dashboard-basic": 80, // Basic admin dashboard — metrics + records
  "notif-push": 80, // Push notifications — FCM / Expo push setup
  "analytics-dashboard": 85, // Dashboard analytics — headline charts
  "deploy-web": 85, // Web deployment — hosting setup
  "deploy-support": 95, // Deployment support — assisted handover
  // Advanced (₹100–150) --------------------------------------------------
  "search-advanced": 110, // Advanced search — full-text search with ranking
  "deploy-apk": 120, // Android APK build — signed release build
  "pay-razorpay": 125, // Razorpay integration — real payment gateway
  "int-rest-api": 130, // REST API — a documented API surface
  "doc-academic-package": 150, // Complete academic package — SRS+report+PPT+viva bundle
};

/**
 * The price to charge for `feature` given the active project type. Academic
 * Extra Features (paid, not AI-recommended-as-necessary) use the override
 * above; every Included feature (free, or AI-flagged as necessary) and
 * every Personal/Business feature keep reading the catalog's own `price`
 * column, exactly as before this override existed. Single choke point so
 * Features & Files, the Estimate page and the Payment page can never
 * disagree on what an Academic Extra Feature costs.
 */
export function priceForFeature(
  feature: Pick<FeatureRow, "id" | "price">,
  projectType: ProjectType | null,
  isRecommended: boolean,
): number {
  const catalogPrice = Number(feature.price) || 0;
  if (projectType === "academic" && !isRecommended && catalogPrice > 0) {
    const override = ACADEMIC_EXTRA_FEATURE_PRICES[feature.id];
    if (override !== undefined) return override;
  }
  return catalogPrice;
}

/** Features actually offered for this type + level, sorted for display. */
export function featuresForTier(
  features: FeatureRow[],
  projectType: string | null,
  projectLevel: string | null,
): FeatureRow[] {
  if (!projectType || !projectLevel) return [];
  return features
    .filter(
      (f) =>
        Array.isArray(f.project_types) &&
        f.project_types.includes(projectType) &&
        Array.isArray(f.project_levels) &&
        f.project_levels.includes(projectLevel),
    )
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/**
 * Whether `feature` is included (free, always delivered) for this type + level —
 * the same rule create-custom-project-order applies (_shared/customProjectPricing.ts).
 */
export function isIncludedForTier(
  feature: Pick<FeatureRow, "included_in_levels">,
  projectType: string | null,
  projectLevel: string | null,
): boolean {
  if (!projectType || !projectLevel) return false;
  return Array.isArray(feature.included_in_levels) && feature.included_in_levels.includes(`${projectType}:${projectLevel}`);
}

/** Group a feature list by its category, preserving catalog sort order. */
export function groupByCategory<T extends { category: string }>(rows: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const f of rows) {
    const arr = map.get(f.category) ?? [];
    arr.push(f);
    map.set(f.category, arr);
  }
  return [...map.entries()];
}

export type Estimate = {
  basePrice: number;
  platformCharge: number;
  featureTotal: number;
  estimatedTotal: number;
  tokenAmount: number;
  selectedFeatures: { id: string; name: string; price: number; category: string; isIncluded: boolean }[];
  ready: boolean; // enough is filled in to price + pay
};

/**
 * The estimate breakdown, computed from the three catalog tables — the same
 * arithmetic create-custom-project-order runs server-side (base + eligible
 * feature prices + platform charge; token is a fixed per-type constant, never
 * derived from the estimate). Callers pass DB rows, never a client total.
 */
export function computeEstimate(
  draft: BuilderDraft,
  pricing: PricingRow[],
  platforms: PlatformRow[],
  features: FeatureRow[],
): Estimate {
  const { projectType, projectLevel, platform } = draft;

  const priceRow = pricing.find(
    (p) => p.project_type === projectType && p.project_level === projectLevel,
  );
  const basePrice = Number(priceRow?.base_price) || 0;

  const platformRow = platforms.find((p) => p.platform === platform);
  const platformCharge = Number(platformRow?.charge) || 0;

  // draft.featureIds is the source of truth for optional features. Features
  // the admin marked included for this type:level are always delivered and
  // never charged — create-custom-project-order snapshots them at price 0.
  const eligible = featuresForTier(features, projectType, projectLevel);
  const selectedFeatures = eligible
    .filter((f) => isIncludedForTier(f, projectType, projectLevel) || draft.featureIds.includes(f.id))
    .map((f) => {
      const isIncluded = isIncludedForTier(f, projectType, projectLevel);
      return {
        id: f.id,
        name: f.name,
        price: isIncluded ? 0 : priceForFeature(f, projectType, draft.aiRecommendedFeatureIds.includes(f.id)),
        category: f.category ?? "",
        isIncluded,
      };
    });
  const featureTotal = round2(selectedFeatures.reduce((s, f) => s + f.price, 0));

  const tokenAmount = projectType ? CUSTOM_PROJECT_TOKENS[projectType] : 0;
  const estimatedTotal = round2(basePrice + featureTotal + platformCharge);

  const ready = !!(projectType && projectLevel && platform && draft.title.trim() && basePrice > 0 && tokenAmount > 0);

  return { basePrice, platformCharge, featureTotal, estimatedTotal, tokenAmount, selectedFeatures, ready };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- money on an existing request: computed ONLY by public.custom_project_amounts() (migration 0128) ---
export type PaymentStatus = "paid" | "partially_paid" | "unpaid";

export type CustomProjectAmounts = {
  baseValue: number;
  addonsTotal: number;
  projectValue: number;
  paymentsTotal: number;
  creditsTotal: number;
  settledTotal: number;
  due: number;
  paymentStatus: PaymentStatus;
  pendingAddons: number;
  pricedAddons: number;
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  partially_paid: "Partially paid",
  unpaid: "Unpaid",
};

/** Maps the RPC's jsonb; never recomputes anything. Null when the RPC returned nothing usable. */
export function parseAmounts(raw: unknown): CustomProjectAmounts | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const n = (k: string) => {
    const v = Number(o[k]);
    return Number.isFinite(v) ? round2(v) : 0;
  };
  const status = o.payment_status;
  if (status !== "paid" && status !== "partially_paid" && status !== "unpaid") return null;
  return {
    baseValue: n("base_value"),
    addonsTotal: n("addons_total"),
    projectValue: n("project_value"),
    paymentsTotal: n("payments_total"),
    creditsTotal: n("credits_total"),
    settledTotal: n("settled_total"),
    due: Math.max(0, n("due")),
    paymentStatus: status,
    pendingAddons: n("pending_addons"),
    pricedAddons: n("priced_addons"),
  };
}

// --- add-ons (custom_project_addons, migration 0128) ---------------------
export type AddonStatus = "pending" | "priced" | "accepted" | "rejected";

export const ADDON_STATUS_LABELS: Record<AddonStatus, string> = {
  pending: "Waiting for price",
  priced: "Priced — awaiting your OK",
  accepted: "Accepted",
  rejected: "Not accepted",
};

export type CustomProjectAddon = {
  id: string;
  title: string;
  description: string;
  status: AddonStatus;
  price: number | null;
  createdAt: string;
};

/** Owners may edit the request itself only before work starts; add-ons are allowed at any stage. */
export function isRequestEditable(status: string): boolean {
  return status === "new";
}

/**
 * Enabling `id` may require other features to be on first. Returns the
 * feature-id list with any missing dependencies added, plus the rows that
 * got auto-enabled (so the caller can show "X requires Y" once). Pure —
 * doesn't touch React state itself.
 */
export function resolveDependencies(
  featureIds: string[],
  id: string,
  features: FeatureRow[],
): { featureIds: string[]; added: FeatureRow[] } {
  const byId = new Map(features.map((f) => [f.id, f]));
  const target = byId.get(id);
  const deps = target?.dependencies ?? [];
  const added: FeatureRow[] = [];
  let next = featureIds;
  for (const depId of deps) {
    if (next.includes(depId)) continue;
    const depFeature = byId.get(depId);
    if (!depFeature) continue;
    next = [...next, depId];
    added.push(depFeature);
  }
  return { featureIds: next, added };
}

/**
 * If enabling `id` would conflict with an already-enabled feature, returns
 * that conflicting row (conflicts are symmetric — checked both directions
 * since catalog data may only declare the relationship on one side).
 */
export function findConflict(featureIds: string[], id: string, features: FeatureRow[]): FeatureRow | null {
  const byId = new Map(features.map((f) => [f.id, f]));
  const target = byId.get(id);
  if (!target) return null;
  for (const otherId of featureIds) {
    if (otherId === id) continue;
    const other = byId.get(otherId);
    if (!other) continue;
    if (target.conflicts.includes(otherId) || other.conflicts.includes(id)) return other;
  }
  return null;
}

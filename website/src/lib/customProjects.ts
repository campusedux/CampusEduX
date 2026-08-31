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

export const TYPE_LABELS: Record<ProjectType, string> = {
  academic: "Academic",
  personal: "Personal",
  business: "Business",
};

export const LEVEL_LABELS: Record<ProjectLevel, string> = {
  standard: "Standard",
  advanced: "Advanced",
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
};

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

export type Estimate = {
  basePrice: number;
  platformCharge: number;
  featureTotal: number;
  estimatedTotal: number;
  tokenAmount: number;
  selectedFeatures: { id: string; name: string; price: number; category: string }[];
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

  const eligible = featuresForTier(features, projectType, projectLevel);
  const selectedFeatures = eligible
    .filter((f) => draft.featureIds.includes(f.id))
    .map((f) => ({ id: f.id, name: f.name, price: Number(f.price) || 0, category: f.category ?? "" }));
  const featureTotal = round2(selectedFeatures.reduce((s, f) => s + f.price, 0));

  const tokenAmount = projectType ? CUSTOM_PROJECT_TOKENS[projectType] : 0;
  const estimatedTotal = round2(basePrice + featureTotal + platformCharge);

  const ready = !!(projectType && projectLevel && platform && draft.title.trim() && basePrice > 0 && tokenAmount > 0);

  return { basePrice, platformCharge, featureTotal, estimatedTotal, tokenAmount, selectedFeatures, ready };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

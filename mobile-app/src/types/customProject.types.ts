// Custom Project Builder v3 — shared types + the spec's fixed money/progress maps.

export const CUSTOM_PROJECT_TYPES = ["academic", "personal", "business"] as const;
export type CustomProjectType = (typeof CUSTOM_PROJECT_TYPES)[number];

export const CUSTOM_PROJECT_LEVELS = ["standard", "advanced"] as const;
export type CustomProjectLevel = (typeof CUSTOM_PROJECT_LEVELS)[number];

/** Feature tier shown in the catalog (admin-managed, spec §5). Distinct from a project's level. */
export const CUSTOM_FEATURE_LEVELS = ["basic", "standard", "advanced", "premium"] as const;
export type CustomFeatureLevel = (typeof CUSTOM_FEATURE_LEVELS)[number];

export const CUSTOM_PLATFORMS = [
  "web",
  "android",
  "ios",
  "web_android",
  "web_android_ios",
] as const;
export type CustomPlatform = (typeof CUSTOM_PLATFORMS)[number];

export const CUSTOM_PROJECT_STATUSES = [
  "new",
  "in_development",
  "testing",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type CustomProjectStatus = (typeof CUSTOM_PROJECT_STATUSES)[number];

export type CustomTokenPaymentStatus = "pending" | "paid" | "failed";

/**
 * Trusted token per project type (spec §2). The SERVER decides the real charge
 * (create-custom-project-order recomputes it); this map is for DISPLAY only —
 * button labels and the estimate screen. It is NOT derived from the estimate or
 * the selected features, and Standard↔Advanced never changes it.
 */
export const CUSTOM_PROJECT_TOKENS: Record<CustomProjectType, number> = {
  academic: 1500,
  personal: 3000,
  business: 6000,
};

/** Token to display for a project type (0 until a type is chosen). Server-authoritative — see CUSTOM_PROJECT_TOKENS. */
export function tokenForType(projectType: CustomProjectType | null): number {
  return projectType ? CUSTOM_PROJECT_TOKENS[projectType] : 0;
}

/** Progress % per status (spec §27). Mirrors custom_project_progress_for() in SQL. */
export const CUSTOM_PROJECT_PROGRESS: Record<CustomProjectStatus, number> = {
  new: 20,
  in_development: 50,
  testing: 80,
  ready: 90,
  delivered: 100,
  cancelled: 0,
};

export const CUSTOM_PLATFORM_LABELS: Record<CustomPlatform, string> = {
  web: "Web",
  android: "Android",
  ios: "iOS",
  web_android: "Web + Android",
  web_android_ios: "Web + Android + iOS",
};

export const CUSTOM_STATUS_LABELS: Record<CustomProjectStatus, string> = {
  new: "Token Paid / New",
  in_development: "In Development",
  testing: "Testing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// --- catalog ---------------------------------------------------------------

export interface CustomProjectPricing {
  projectType: CustomProjectType;
  projectLevel: CustomProjectLevel;
  basePrice: number;
  tokenAmount: number;
  pricingVersion: number;
}

export interface CustomPlatformPricing {
  platform: CustomPlatform;
  label: string;
  charge: number;
  sortOrder: number;
}

export interface CustomFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  projectTypes: CustomProjectType[];
  projectLevels: CustomProjectLevel[];
  price: number;
  sortOrder: number;
  /** Optional — populated from the admin Feature Catalog (migration 0034). */
  level?: CustomFeatureLevel;
  dependencies?: string[];
  /** Mutually-exclusive feature ids (migration 0090). Symmetric — checked both ways. */
  conflicts?: string[];
  /**
   * "<project_type>:<project_level>" combos for which this feature comes free
   * with the project (migration 0115). Included features are read-only and are
   * never charged, whatever `price` says.
   */
  includedInLevels?: string[];
  icon?: string | null;
  imageUrl?: string | null;
}

// --- wizard state / draft -----------------------------------------------

export interface CustomRequirement {
  text: string;
}

export interface CustomReferenceFileInput {
  path: string;
  name: string;
  sizeMb: number;
  label?: string;
}

/** The whole wizard state — also the shape persisted to custom_project_drafts. */
export interface CustomProjectBuilderConfig {
  projectType: CustomProjectType | null;
  projectLevel: CustomProjectLevel | null;
  platform: CustomPlatform | null;
  title: string;
  objective: string;
  problemStatement: string;
  description: string;
  targetUsers: string;
  technologyPreference: string;
  featureIds: string[];
  customRequirements: CustomRequirement[];
  projectImagePath: string | null;
  referenceFiles: CustomReferenceFileInput[];
}

export interface CustomProjectEstimate {
  basePrice: number;
  /** Free with this type + level — read-only, never charged. */
  includedFeatures: CustomFeature[];
  /** Selected paid add-ons; each `price` is the amount actually charged. */
  addOns: CustomFeature[];
  addOnsTotal: number;
  platformCharges: number;
  /** Base + add-ons + platform charges. */
  total: number;
  /** Amount paid now, per project type. */
  token: number;
  /** total − token (never below 0); DISPLAY only — balance payment isn't built yet. */
  balanceAfterToken: number;
}

// --- server records --------------------------------------------------

export interface CustomProjectRequest {
  id: string;
  requestCode: string;
  title: string;
  projectType: CustomProjectType;
  projectLevel: CustomProjectLevel;
  platform: CustomPlatform;
  technologyPreference: string;
  basePrice: number;
  platformCharge: number;
  featureTotal: number;
  estimatedTotal: number;
  /** Admin-set price that overrides estimatedTotal once set (Bug 3) — null until the admin sets one. */
  finalPrice: number | null;
  /** Total ever credited (token + any settled balance payments). Never client-writable. */
  amountPaid: number;
  tokenAmount: number;
  tokenPaymentStatus: CustomTokenPaymentStatus;
  status: CustomProjectStatus;
  projectImagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomProjectTimelineEntry {
  oldStatus: CustomProjectStatus | null;
  newStatus: CustomProjectStatus;
  createdAt: string;
}

export interface CustomProjectRequestFeature {
  featureId: string;
  featureName: string;
  featurePrice: number;
  category: string;
  /** Came with the project (price 0) rather than being a paid add-on. */
  isIncluded: boolean;
}

export interface CustomProjectReferenceFile {
  id: string;
  label: string;
  fileName: string;
  sizeMb: number;
  storagePath: string;
}

export interface CustomProjectDeliveryAsset {
  id: string;
  kind: "screenshot" | "apk" | "source_code" | "documentation" | "demo" | "other";
  label: string;
  storagePath: string;
  fileName: string;
  sizeMb: number;
}

export interface CustomProjectDelivery {
  demoUrl: string | null;
  notes: string;
  deliveredAt: string | null;
  assets: CustomProjectDeliveryAsset[];
}

export interface CustomProjectMessage {
  id: string;
  senderRole: "student" | "admin";
  body: string;
  createdAt: string;
}

/** Money on a request — mapped from public.custom_project_amounts() (migration 0128), never computed on the device. */
export type CustomPaymentStatus = "paid" | "partially_paid" | "unpaid";
export interface CustomProjectAmounts {
  baseValue: number;
  addonsTotal: number;
  projectValue: number;
  paymentsTotal: number;
  creditsTotal: number;
  settledTotal: number;
  due: number;
  paymentStatus: CustomPaymentStatus;
  pendingAddons: number;
  pricedAddons: number;
}

export type CustomAddonStatus = "pending" | "priced" | "accepted" | "rejected";
export interface CustomProjectAddon {
  id: string;
  title: string;
  description: string;
  status: CustomAddonStatus;
  price: number | null;
  createdAt: string;
}

/** Fields the owner may change while the request is still "new" (the RPC enforces the same list + lock). */
export interface CustomProjectRequestEdit {
  title?: string;
  objective?: string;
  problem_statement?: string;
  description?: string;
  target_users?: string;
  technology_preference?: string;
  custom_requirements?: CustomRequirement[];
  deadline?: string | null;
}

export interface CustomProjectRequestDetail extends CustomProjectRequest {
  objective: string;
  problemStatement: string;
  description: string;
  targetUsers: string;
  deadline: string | null;
  customRequirements: CustomRequirement[];
  features: CustomProjectRequestFeature[];
  referenceFiles: CustomProjectReferenceFile[];
  timeline: CustomProjectTimelineEntry[];
  delivery: CustomProjectDelivery | null;
  messages: CustomProjectMessage[];
  /** null when the amounts RPC failed — screens show an error instead of a guessed number. */
  amounts: CustomProjectAmounts | null;
  addons: CustomProjectAddon[];
}

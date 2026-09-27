// Client-safe constants for the Custom Projects module. No server-only imports
// here (client components import from this file, not from queries.ts).

export const CUSTOM_PROJECTS_PAGE_SIZE = 20;

/**
 * What the student still owes (Bug 3). Same rule as migration 0124's trigger/RPC:
 * coalesce(final_price, estimated_total) - amount_paid, floored at 0.
 */
export function remainingBalance(request: { estimated_total: number; final_price: number | null; amount_paid: number }): number {
  const total = request.final_price ?? request.estimated_total;
  return Math.max(0, Math.round((total - request.amount_paid) * 100) / 100);
}

export const CUSTOM_PROJECT_STATUSES = [
  'new',
  'in_development',
  'testing',
  'ready',
  'delivered',
  'cancelled',
] as const;
export type CustomProjectStatus = (typeof CUSTOM_PROJECT_STATUSES)[number];

export const CUSTOM_STATUS_LABEL: Record<CustomProjectStatus, string> = {
  new: 'New / Token Paid',
  in_development: 'In Development',
  testing: 'Testing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Progress % per status (spec §27) — mirrors custom_project_progress_for() in SQL. */
export const PROGRESS_BY_STATUS: Record<CustomProjectStatus, number> = {
  new: 20,
  in_development: 50,
  testing: 80,
  ready: 90,
  delivered: 100,
  cancelled: 0,
};

/** Forward-ish transitions offered in the status control on the detail page. */
export const NEXT_STATUSES: Record<CustomProjectStatus, CustomProjectStatus[]> = {
  new: ['in_development', 'cancelled'],
  in_development: ['testing', 'cancelled'],
  testing: ['ready', 'in_development'],
  ready: ['delivered', 'testing'],
  delivered: [],
  cancelled: ['new'],
};

export const PROJECT_TYPES = ['academic', 'personal', 'business'] as const;
export const PROJECT_LEVELS = ['standard', 'advanced'] as const;
export const PLATFORMS = ['web', 'android', 'ios', 'web_android', 'web_android_ios'] as const;

export const PLATFORM_LABEL: Record<string, string> = {
  web: 'Web',
  android: 'Android',
  ios: 'iOS',
  web_android: 'Web + Android',
  web_android_ios: 'Web + Android + iOS',
};

/**
 * Fallback category vocabulary used only when the `custom_project_feature_categories`
 * table isn't available yet (migration 0034 not applied). The live list is
 * loaded from the DB — see `listFeatureCategories()` — and managed in
 * Custom Projects → Feature catalog → Categories (spec §3 / §15).
 */
export const FEATURE_CATEGORIES = [
  'Authentication',
  'User Management',
  'Admin',
  'Dashboard',
  'Payments',
  'Notifications',
  'Chat',
  'AI',
  'Analytics',
  'Reports',
  'Search',
  'Booking',
  'Maps / Location',
  'Social',
  'Media',
  'File Management',
  'Files & Media',
  'Security',
  'API',
  'Database',
  'E-commerce',
  'Education',
  'Placement',
  'Jobs',
  'Resume',
  'Real-Time',
  'Integration',
  'Location',
  'Deployment',
  'Documentation',
  'Automation',
  'General',
  'Other',
] as const;

// --- advanced feature catalog (spec §1–§11) --------------------------

/** Rows per page in the Feature catalog data table (server-side paginated). */
export const FEATURES_PAGE_SIZE = 20;

/** Feature tier vocabulary (spec §5) — distinct from a project's standard/advanced level. */
export const FEATURE_LEVELS = ['basic', 'standard', 'advanced', 'premium'] as const;
export type FeatureLevel = (typeof FEATURE_LEVELS)[number];

export const FEATURE_LEVEL_LABEL: Record<FeatureLevel, string> = {
  basic: 'Basic',
  standard: 'Standard',
  advanced: 'Advanced',
  premium: 'Premium / Enterprise',
};

/** Badge tone per level — uses the primitives' Tone vocabulary. */
export const FEATURE_LEVEL_TONE: Record<FeatureLevel, 'neutral' | 'info' | 'brand' | 'warning'> = {
  basic: 'neutral',
  standard: 'info',
  advanced: 'brand',
  premium: 'warning',
};

/**
 * "<project_type>:<project_level>" combos a feature can be INCLUDED (free,
 * read-only in the builder, never charged) for. Mirrors the CHECK in
 * migration 0115 / 087.
 */
export const INCLUDED_KEYS = [
  'academic:standard',
  'academic:advanced',
  'personal:standard',
  'personal:advanced',
  'business:standard',
  'business:advanced',
] as const;

export const PROJECT_TYPE_LABEL: Record<string, string> = {
  academic: 'Academic',
  personal: 'Personal',
  business: 'Business',
};

/** Badge tone per project type — keeps Academic/Personal/Business visually distinct (spec §6). */
export const PROJECT_TYPE_TONE: Record<string, 'info' | 'success' | 'brand'> = {
  academic: 'info',
  personal: 'success',
  business: 'brand',
};

/** Sort options for the catalog (spec §2). `value` is written to `?sort=`. */
export const FEATURE_SORT_OPTIONS = [
  { value: 'sort', label: 'Manual (sort order)' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Name: A → Z' },
  { value: 'recent', label: 'Recently added' },
] as const;
export type FeatureSort = (typeof FEATURE_SORT_OPTIONS)[number]['value'];

export const ACTIVE_FILTER_OPTIONS = [
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
] as const;

export const DELIVERY_ASSET_KINDS = [
  'screenshot',
  'apk',
  'source_code',
  'documentation',
  'demo',
  'pdf',
  'ppt',
  'other',
] as const;
export type DeliveryAssetKind = (typeof DELIVERY_ASSET_KINDS)[number];

export const DELIVERY_ASSET_LABEL: Record<DeliveryAssetKind, string> = {
  screenshot: 'Screenshot',
  apk: 'Android APK',
  source_code: 'Source code',
  documentation: 'Documentation',
  demo: 'Demo',
  pdf: 'PDF',
  ppt: 'PPT',
  other: 'Other',
};

/**
 * Bug 4: the three dedicated delivery slots. Size limits enforced client-side (fast feedback) and
 * server-side in addDeliveryAssets (the real boundary — a client check can always be bypassed).
 * The 'custom-project-deliveries' bucket's own file_size_limit (migration 0125/097) is the outer
 * ceiling (100MB, i.e. the ZIP limit); PDF/PPT's tighter 25MB is enforced only at these two layers.
 */
export interface DeliverySlot {
  kind: DeliveryAssetKind;
  label: string;
  accept: string;
  maxSizeBytes: number;
  extensions: string[];
}

export const DELIVERY_SLOTS: DeliverySlot[] = [
  { kind: 'source_code', label: 'Source code (ZIP)', accept: '.zip', maxSizeBytes: 100 * 1024 * 1024, extensions: ['.zip'] },
  { kind: 'pdf', label: 'PDF (optional)', accept: '.pdf', maxSizeBytes: 25 * 1024 * 1024, extensions: ['.pdf'] },
  { kind: 'ppt', label: 'PPT (optional)', accept: '.ppt,.pptx', maxSizeBytes: 25 * 1024 * 1024, extensions: ['.ppt', '.pptx'] },
];

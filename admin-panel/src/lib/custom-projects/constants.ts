// Client-safe constants for the Custom Projects module. No server-only imports
// here (client components import from this file, not from queries.ts).

export const CUSTOM_PROJECTS_PAGE_SIZE = 20;

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
  'other',
] as const;
export type DeliveryAssetKind = (typeof DELIVERY_ASSET_KINDS)[number];

export const DELIVERY_ASSET_LABEL: Record<DeliveryAssetKind, string> = {
  screenshot: 'Screenshot',
  apk: 'Android APK',
  source_code: 'Source code',
  documentation: 'Documentation',
  demo: 'Demo',
  other: 'Other',
};

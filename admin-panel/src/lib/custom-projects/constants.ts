// Client-safe constants for the Custom Projects module. No server-only imports
// here (client components import from this file, not from queries.ts).

export const CUSTOM_PROJECTS_PAGE_SIZE = 20;

/**
 * Money on a request comes ONLY from public.custom_project_amounts() / custom_project_amounts_bulk()
 * (migration 0128/099): base value + accepted add-ons − paid ledger rows − credits, never negative.
 * This only maps the RPC's jsonb; it never recomputes anything.
 */
export type PaymentStatus = 'paid' | 'partially_paid' | 'unpaid';
export interface CustomProjectAmounts {
  requestId: string;
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
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid',
  partially_paid: 'Partially paid',
  unpaid: 'Unpaid',
};

export function parseAmounts(raw: unknown): CustomProjectAmounts | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const n = (k: string) => {
    const v = Number(o[k]);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
  };
  const s = o.payment_status;
  if (s !== 'paid' && s !== 'partially_paid' && s !== 'unpaid') return null;
  return {
    requestId: String(o.request_id ?? ''),
    baseValue: n('base_value'),
    addonsTotal: n('addons_total'),
    projectValue: n('project_value'),
    paymentsTotal: n('payments_total'),
    creditsTotal: n('credits_total'),
    settledTotal: n('settled_total'),
    due: Math.max(0, n('due')),
    paymentStatus: s,
    pendingAddons: n('pending_addons'),
    pricedAddons: n('priced_addons'),
  };
}

export type AddonStatus = 'pending' | 'priced' | 'accepted' | 'rejected';
export const ADDON_STATUS_LABEL: Record<AddonStatus, string> = {
  pending: 'Needs price',
  priced: 'Priced · awaiting student',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export const CREDIT_KINDS = ['offline_payment', 'discount', 'referral', 'goodwill', 'adjustment'] as const;
export type CreditKind = (typeof CREDIT_KINDS)[number];
export const CREDIT_KIND_LABEL: Record<CreditKind, string> = {
  offline_payment: 'Offline payment (UPI / bank / cash)',
  discount: 'Discount',
  referral: 'Referral credit',
  goodwill: 'Goodwill',
  adjustment: 'Adjustment',
};

/** Request fields both the student and an admin may edit (the RPCs enforce the same whitelist). */
export const EDITABLE_REQUEST_FIELDS = [
  { key: 'title', label: 'Title', max: 200, rows: 0 },
  { key: 'objective', label: 'Objective', max: 5000, rows: 3 },
  { key: 'problem_statement', label: 'Problem statement', max: 5000, rows: 3 },
  { key: 'description', label: 'Description', max: 10000, rows: 5 },
  { key: 'target_users', label: 'Target users', max: 2000, rows: 2 },
  { key: 'technology_preference', label: 'Tech stack', max: 500, rows: 0 },
] as const;

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

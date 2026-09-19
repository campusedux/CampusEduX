import { supabase } from "@/lib/supabase";
import {
  CUSTOM_IMAGE_MIME_TYPES,
  CUSTOM_UPLOAD_MIME_TYPES,
  extensionForImageMime,
  readFileBody,
  resolveContentType,
} from "@/lib/uploadMime";
import {
  type CustomFeature,
  type CustomPlatformPricing,
  type CustomProjectBuilderConfig,
  type CustomProjectDelivery,
  type CustomProjectEstimate,
  type CustomProjectLevel,
  type CustomProjectMessage,
  type CustomProjectPricing,
  type CustomProjectRequest,
  type CustomProjectRequestDetail,
  type CustomProjectType,
  tokenForType,
  type CustomRequirement,
} from "@/types";

const UPLOADS_BUCKET = "custom-project-uploads";
const DELIVERIES_BUCKET = "custom-project-deliveries";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year, matches job.service.uploadResume

// --- row mappers ---------------------------------------------------------

function mapPricingRow(row: any): CustomProjectPricing {
  return {
    projectType: row.project_type,
    projectLevel: row.project_level,
    basePrice: Number(row.base_price) || 0,
    tokenAmount: Number(row.token_amount) || 0,
    pricingVersion: Number(row.pricing_version) || 1,
  };
}

function mapPlatformRow(row: any): CustomPlatformPricing {
  return {
    platform: row.platform,
    label: row.label ?? "",
    charge: Number(row.charge) || 0,
    sortOrder: Number(row.sort_order) || 0,
  };
}

function mapFeatureRow(row: any): CustomFeature {
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    category: row.category ?? "General",
    projectTypes: Array.isArray(row.project_types) ? row.project_types : [],
    projectLevels: Array.isArray(row.project_levels) ? row.project_levels : [],
    price: Number(row.price) || 0,
    sortOrder: Number(row.sort_order) || 0,
    // Optional catalog fields (migration 0034/0090) — safe when absent.
    level: row.level ?? "standard",
    dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
    conflicts: Array.isArray(row.conflicts) ? row.conflicts : [],
    includedInLevels: Array.isArray(row.included_in_levels) ? row.included_in_levels : [],
    icon: row.icon ?? null,
    imageUrl: row.image_url ?? null,
  };
}

function mapRequestRow(row: any): CustomProjectRequest {
  return {
    id: row.id,
    requestCode: row.request_code ?? "",
    title: row.title ?? "",
    projectType: row.project_type,
    projectLevel: row.project_level,
    platform: row.platform,
    technologyPreference: row.technology_preference ?? "",
    basePrice: Number(row.base_price) || 0,
    platformCharge: Number(row.platform_charge) || 0,
    featureTotal: Number(row.feature_total) || 0,
    estimatedTotal: Number(row.estimated_total) || 0,
    tokenAmount: Number(row.token_amount) || 0,
    tokenPaymentStatus: row.token_payment_status ?? "pending",
    status: row.status ?? "new",
    projectImagePath: row.project_image_path ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function mapMessageRow(row: any): CustomProjectMessage {
  return {
    id: row.id,
    senderRole: row.sender_role,
    body: row.body ?? "",
    createdAt: row.created_at,
  };
}

// --- pure pricing helpers (no DB) — spec §10 / §36 --------------------

/**
 * Academic-only Extra Feature price override — mirrors
 * website/src/lib/customProjects.ts's ACADEMIC_EXTRA_FEATURE_PRICES exactly
 * (same ids, same values; also duplicated server-side in
 * mobile-app/supabase/functions/_shared/academicPricing.ts, which is what
 * create-custom-project-order actually charges from). Keep all three in
 * sync — the website has a test asserting this
 * (website/tests/lib/customProjects.test.ts).
 */
export const ACADEMIC_EXTRA_FEATURE_PRICES: Record<string, number> = {
  // Non-advanced (₹40–100) ---------------------------------------------
  "doc-viva": 40,
  "media-pdf-upload": 45,
  "doc-ppt": 45,
  "auth-google": 50,
  "pay-history": 50,
  "notif-inapp": 55,
  "media-multi-image": 55,
  "search-filters": 55,
  "doc-documentation": 55,
  "doc-srs": 60,
  "notif-email": 65,
  "doc-project-report": 70,
  "auth-otp": 75,
  "admin-dashboard-basic": 80,
  "notif-push": 80,
  "analytics-dashboard": 85,
  "deploy-web": 85,
  "deploy-support": 95,
  // Advanced (₹100–150) --------------------------------------------------
  "search-advanced": 110,
  "deploy-apk": 120,
  "pay-razorpay": 125,
  "int-rest-api": 130,
  "doc-academic-package": 150,
};

/**
 * The price to charge/display for `feature` given the active project type.
 * Mirrors website/src/lib/customProjects.ts's priceForFeature exactly. The
 * app has no "AI-recommended" concept yet (spec: AI understanding step is
 * mobile-absent) — `isRecommended` is always false here, which matches what
 * create-custom-project-order computes server-side when the app's draft
 * (which never sets aiRecommendedFeatureIds) is read.
 */
export function priceForFeature(
  feature: Pick<CustomFeature, "id" | "price">,
  projectType: CustomProjectType | null,
  isRecommended: boolean
): number {
  const catalogPrice = Number(feature.price) || 0;
  if (projectType === "academic" && !isRecommended && catalogPrice > 0) {
    const override = ACADEMIC_EXTRA_FEATURE_PRICES[feature.id];
    if (override !== undefined) return override;
  }
  return catalogPrice;
}

/**
 * Enabling `id` may require other features to be on first. Returns the
 * feature-id list with any missing dependencies added, plus the rows that
 * got auto-enabled (so the caller can show "X requires Y" once). Pure —
 * mirrors website/src/lib/customProjects.ts's resolveDependencies exactly.
 */
export function resolveDependencies(
  featureIds: string[],
  id: string,
  features: CustomFeature[]
): { featureIds: string[]; added: CustomFeature[] } {
  const byId = new Map(features.map((f) => [f.id, f]));
  const target = byId.get(id);
  const deps = target?.dependencies ?? [];
  const added: CustomFeature[] = [];
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
 * since catalog data may only declare the relationship on one side). Mirrors
 * website/src/lib/customProjects.ts's findConflict exactly.
 */
export function findConflict(featureIds: string[], id: string, features: CustomFeature[]): CustomFeature | null {
  const byId = new Map(features.map((f) => [f.id, f]));
  const target = byId.get(id);
  if (!target) return null;
  for (const otherId of featureIds) {
    if (otherId === id) continue;
    const other = byId.get(otherId);
    if (!other) continue;
    if ((target.conflicts ?? []).includes(otherId) || (other.conflicts ?? []).includes(id)) return other;
  }
  return null;
}

/** Features actually offered for this project type + level, sorted for display. */
export function getFeaturesFor(
  projectType: CustomProjectType | null,
  projectLevel: CustomProjectLevel | null,
  features: CustomFeature[]
): CustomFeature[] {
  if (!projectType || !projectLevel) return [];
  return features
    .filter(
      (f) =>
        f.projectTypes.includes(projectType) && f.projectLevels.includes(projectLevel)
    )
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Whether `feature` comes free with this type + level (never charged, never toggleable). */
export function isFeatureIncluded(
  feature: Pick<CustomFeature, "includedInLevels">,
  projectType: CustomProjectType | null,
  projectLevel: CustomProjectLevel | null
): boolean {
  if (!projectType || !projectLevel) return false;
  return (feature.includedInLevels ?? []).includes(`${projectType}:${projectLevel}`);
}

/** Features offered for this tier split into free-included and paid add-ons. */
export function splitFeaturesFor(
  projectType: CustomProjectType | null,
  projectLevel: CustomProjectLevel | null,
  features: CustomFeature[]
): { included: CustomFeature[]; addOnCatalog: CustomFeature[] } {
  const offered = getFeaturesFor(projectType, projectLevel, features);
  return {
    included: offered.filter((f) => isFeatureIncluded(f, projectType, projectLevel)),
    addOnCatalog: offered.filter((f) => !isFeatureIncluded(f, projectType, projectLevel)),
  };
}

/**
 * Add-ons the customer would unlock by switching from Standard to Advanced —
 * offered for this type at Advanced but not at Standard. Empty on Advanced.
 */
export function getAdvancedOnlyFeatures(
  projectType: CustomProjectType | null,
  projectLevel: CustomProjectLevel | null,
  features: CustomFeature[]
): CustomFeature[] {
  if (!projectType || projectLevel !== "standard") return [];
  return features
    .filter(
      (f) =>
        f.projectTypes.includes(projectType) &&
        f.projectLevels.includes("advanced") &&
        !f.projectLevels.includes("standard")
    )
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * THE single source of truth for every price the builder shows (spec §10):
 * Base Price + paid add-ons + platform charges = estimated project price.
 * Included features are free and are never charged even if their id is in
 * `featureIds` (old drafts). Computed on the client so a tap never hits the
 * database; create-custom-project-order recomputes the same figure server-side
 * (parity asserted in tests/unit/services/customProjectsServerParity.test.ts).
 * The token is a fixed per-type constant and is deducted from the total.
 */
export function calculateEstimate(
  config: Pick<
    CustomProjectBuilderConfig,
    "projectType" | "projectLevel" | "platform" | "featureIds"
  >,
  pricing: CustomProjectPricing[],
  platformPricing: CustomPlatformPricing[],
  features: CustomFeature[]
): CustomProjectEstimate {
  const { projectType, projectLevel, platform, featureIds } = config;

  const priceRow = pricing.find(
    (p) => p.projectType === projectType && p.projectLevel === projectLevel
  );
  const basePrice = priceRow?.basePrice ?? 0;
  const platformCharges = platformPricing.find((p) => p.platform === platform)?.charge ?? 0;

  const { included, addOnCatalog } = splitFeaturesFor(projectType, projectLevel, features);
  const includedFeatures = included.map((f) => ({ ...f, price: 0 }));
  const addOns = addOnCatalog
    .filter((f) => featureIds.includes(f.id))
    .map((f) => ({ ...f, price: priceForFeature(f, projectType, false) }));
  const addOnsTotal = round2(addOns.reduce((s, f) => s + f.price, 0));

  const total = round2(basePrice + addOnsTotal + platformCharges);
  const token = tokenForType(projectType);

  return {
    basePrice,
    includedFeatures,
    addOns,
    addOnsTotal,
    platformCharges,
    total,
    token,
    balanceAfterToken: Math.max(0, round2(total - token)),
  };
}

// --- service -----------------------------------------------------------

export const customProjectsService = {
  async getPricing(): Promise<{
    pricing: CustomProjectPricing[];
    platformPricing: CustomPlatformPricing[];
  }> {
    const [pricingRes, platformRes] = await Promise.all([
      supabase.from("custom_project_pricing").select("*").eq("is_active", true),
      supabase
        .from("custom_project_platform_pricing")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);
    if (pricingRes.error) throw new Error(pricingRes.error.message);
    if (platformRes.error) throw new Error(platformRes.error.message);
    return {
      pricing: (pricingRes.data ?? []).map(mapPricingRow),
      platformPricing: (platformRes.data ?? []).map(mapPlatformRow),
    };
  },

  async getFeatures(): Promise<CustomFeature[]> {
    const { data, error } = await supabase
      .from("custom_project_features")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapFeatureRow);
  },

  // --- uploads (private bucket, path <uid>/uploads/<file>) ------------

  async uploadProjectImage(userId: string, fileUri: string, mimeType?: string | null): Promise<string> {
    // Bucket allows png/jpeg/webp only (0117/089); the picker re-encodes to JPEG at quality < 1.
    const { body, hintType } = await readFileBody(fileUri);
    const contentType =
      resolveContentType({ mimeType, uri: fileUri, hintType }, CUSTOM_IMAGE_MIME_TYPES) ?? (mimeType ? null : "image/jpeg");
    if (!contentType) throw new Error("Project image must be a PNG, JPEG or WebP.");
    const path = `${userId}/uploads/image_${Date.now()}.${extensionForImageMime(contentType)}`;
    const { error } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .upload(path, body, { contentType, upsert: true });
    if (error) throw new Error(error.message);
    return path;
  },

  async uploadReferenceFile(
    userId: string,
    fileUri: string,
    fileName: string,
    mimeType?: string
  ): Promise<{ path: string; name: string; sizeMb: number }> {
    const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, "_");
    const path = `${userId}/uploads/ref_${Date.now()}_${safeName}`;
    const { body, hintType, size } = await readFileBody(fileUri);
    // Never octet-stream (not in the bucket allow-list): picker mime -> extension.
    const contentType = resolveContentType({ name: fileName, uri: fileUri, mimeType, hintType }, CUSTOM_UPLOAD_MIME_TYPES);
    if (!contentType) throw new Error("That file type isn't accepted. Use PDF, DOC/DOCX, ZIP or PNG/JPEG/WebP.");
    const { error } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .upload(path, body, { contentType, upsert: true });
    if (error) throw new Error(error.message);
    return {
      path,
      name: fileName,
      sizeMb: Math.round((size / (1024 * 1024)) * 100) / 100,
    };
  },

  async getSignedUrl(
    path: string,
    bucket: "uploads" | "deliveries" = "uploads"
  ): Promise<string | null> {
    if (!path) return null;
    const { data, error } = await supabase.storage
      .from(bucket === "uploads" ? UPLOADS_BUCKET : DELIVERIES_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (error) return null;
    return data?.signedUrl ?? null;
  },

  // --- drafts (spec §28 — no payment) -----------------------------

  async getDraft(userId: string): Promise<Partial<CustomProjectBuilderConfig> | null> {
    const { data, error } = await supabase
      .from("custom_project_drafts")
      .select("payload")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.payload as Partial<CustomProjectBuilderConfig>) ?? null;
  },

  async saveDraft(
    userId: string,
    payload: Partial<CustomProjectBuilderConfig>
  ): Promise<void> {
    const { error } = await supabase
      .from("custom_project_drafts")
      .upsert({ user_id: userId, payload }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
  },

  async deleteDraft(userId: string): Promise<void> {
    const { error } = await supabase
      .from("custom_project_drafts")
      .delete()
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  // --- payment (server-authoritative) --------------------------

  async createOrder(config: CustomProjectBuilderConfig): Promise<{
    requestId: string;
    requestCode: string;
    razorpayOrderId: string;
    razorpayKeyId: string;
    amount: number;
    currency: string;
    projectType: CustomProjectType;
    projectLevel: CustomProjectLevel;
    tokenAmount: number;
    estimatedTotal: number;
  }> {
    const { data, error } = await supabase.functions.invoke("create-custom-project-order", {
      body: {
        projectType: config.projectType,
        projectLevel: config.projectLevel,
        platform: config.platform,
        title: config.title,
        objective: config.objective,
        problemStatement: config.problemStatement,
        description: config.description,
        targetUsers: config.targetUsers,
        technologyPreference: config.technologyPreference,
        featureIds: config.featureIds,
        customRequirements: config.customRequirements,
        projectImagePath: config.projectImagePath,
        referenceFiles: config.referenceFiles,
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async verifyPayment(payload: {
    requestId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<CustomProjectRequest> {
    const { data, error } = await supabase.functions.invoke("verify-custom-project-payment", {
      body: payload,
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return mapRequestRow(data);
  },

  // --- my custom projects (spec §31 — owner only, paid only) ---

  async getMyRequests(_userId: string): Promise<CustomProjectRequest[]> {
    // RLS scopes this to the caller; the paid filter honours spec §15
    // ("request created only after verified token payment").
    const { data, error } = await supabase
      .from("custom_project_requests")
      .select("*")
      .eq("token_payment_status", "paid")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRequestRow);
  },

  async getRequestDetail(
    requestId: string,
    _userId: string
  ): Promise<CustomProjectRequestDetail> {
    const [reqRes, featRes, fileRes, histRes, deliveryRes, msgRes] = await Promise.all([
      supabase.from("custom_project_requests").select("*").eq("id", requestId).maybeSingle(),
      supabase
        .from("custom_project_request_features")
        .select("feature_id, feature_name, feature_price, category, is_included")
        .eq("request_id", requestId),
      supabase
        .from("custom_project_request_files")
        .select("id, label, file_name, size_mb, storage_path")
        .eq("request_id", requestId)
        .order("sort_order", { ascending: true }),
      // never select `note` — that column is admin-facing (spec §29)
      supabase
        .from("custom_project_request_history")
        .select("old_status, new_status, created_at")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true }),
      supabase
        .from("custom_project_deliveries")
        .select("id, demo_url, notes, delivered_at")
        .eq("request_id", requestId)
        .maybeSingle(),
      supabase
        .from("custom_project_messages")
        .select("id, sender_role, body, created_at")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true }),
    ]);

    if (reqRes.error) throw new Error(reqRes.error.message);
    if (!reqRes.data) throw new Error("Request not found.");

    let delivery: CustomProjectDelivery | null = null;
    if (deliveryRes.data && !deliveryRes.error) {
      const d = deliveryRes.data;
      const { data: assetRows } = await supabase
        .from("custom_project_delivery_assets")
        .select("id, kind, label, storage_path, file_name, size_mb")
        .eq("delivery_id", d.id)
        .order("sort_order", { ascending: true });
      delivery = {
        demoUrl: d.demo_url ?? null,
        notes: d.notes ?? "",
        deliveredAt: d.delivered_at ?? null,
        assets: (assetRows ?? []).map((a: any) => ({
          id: a.id,
          kind: a.kind,
          label: a.label ?? "",
          storagePath: a.storage_path,
          fileName: a.file_name ?? "",
          sizeMb: Number(a.size_mb) || 0,
        })),
      };
    }

    const base = mapRequestRow(reqRes.data);
    return {
      ...base,
      objective: reqRes.data.objective ?? "",
      problemStatement: reqRes.data.problem_statement ?? "",
      description: reqRes.data.description ?? "",
      targetUsers: reqRes.data.target_users ?? "",
      customRequirements: Array.isArray(reqRes.data.custom_requirements)
        ? (reqRes.data.custom_requirements as CustomRequirement[])
        : [],
      features: (featRes.data ?? []).map((f: any) => ({
        featureId: f.feature_id,
        featureName: f.feature_name ?? "",
        featurePrice: Number(f.feature_price) || 0,
        isIncluded: f.is_included === true,
        category: f.category ?? "",
      })),
      referenceFiles: (fileRes.data ?? []).map((f: any) => ({
        id: f.id,
        label: f.label ?? "",
        fileName: f.file_name ?? "",
        sizeMb: Number(f.size_mb) || 0,
        storagePath: f.storage_path,
      })),
      timeline: (histRes.data ?? []).map((h: any) => ({
        oldStatus: h.old_status ?? null,
        newStatus: h.new_status,
        createdAt: h.created_at,
      })),
      delivery,
      messages: (msgRes.data ?? []).map(mapMessageRow),
    };
  },

  // --- messaging (spec §30) -----------------------------------

  async getMessages(requestId: string): Promise<CustomProjectMessage[]> {
    const { data, error } = await supabase
      .from("custom_project_messages")
      .select("id, sender_role, body, created_at")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapMessageRow);
  },

  async sendMessage(requestId: string, userId: string, body: string): Promise<void> {
    const trimmed = body.trim();
    if (!trimmed) return;
    const { error } = await supabase.from("custom_project_messages").insert({
      request_id: requestId,
      sender_id: userId,
      sender_role: "student",
      body: trimmed,
    });
    if (error) throw new Error(error.message);
  },
};

// POST create-custom-project-order
//
// Called by src/services/customProjects.service.ts -> createOrder(config)
//
// Request body : the full Custom Project Builder configuration
//   {
//     projectType: "academic" | "personal" | "business",
//     projectLevel: "standard" | "advanced",
//     platform: "web" | "android" | "ios" | "web_android" | "web_android_ios",
//     title: string,
//     objective?, problemStatement?, description?, targetUsers?, technologyPreference?: string,
//     featureIds: string[],
//     customRequirements?: { text: string }[],
//     projectImagePath?: string,                       // storage ref, not a URL
//     referenceFiles?: { path: string, name: string, sizeMb?: number, label?: string }[]
//   }
//
// Response body :
//   {
//     requestId: string,           // custom_project_requests.id (token_payment_status "pending")
//     requestCode: string,         // CPR-2026-000123
//     razorpayOrderId: string,
//     razorpayKeyId: string,       // public key id, safe on the client
//     amount: number,              // paise — the TRUSTED token amount * 100
//     currency: "INR",
//     projectType, projectLevel: string,
//     tokenAmount: number,         // rupees (Academic 1500 / Personal 3000 / Business 6000)
//     basePrice, platformCharge, featureTotal, estimatedTotal: number,  // rupees, informational
//     pricingVersion: number
//   }
//
// SECURITY (spec §11 / §14): the server recomputes EVERY amount from the DB and
// never trusts a client-sent price or token. The token is a fixed per-type
// constant here; the pricing table is only a cross-check. The Razorpay key
// secret never touches the client — only the key id is returned.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "../_shared/razorpay.ts";
import { priceFeatures, type FeatureRow } from "../_shared/customProjectPricing.ts";

const round2 = (n: number) => Math.round(n * 100) / 100;

const PROJECT_TYPES = ["academic", "personal", "business"] as const;
const PROJECT_LEVELS = ["standard", "advanced"] as const;
const PLATFORMS = ["web", "android", "ios", "web_android", "web_android_ios"] as const;

// The one place the token amount is decided (spec §2 / §11 / §14). NOT derived
// from the estimate or the selected features, NOT changed by Standard↔Advanced.
const TOKEN_BY_TYPE: Record<string, number> = {
  academic: 1500,
  personal: 3000,
  business: 6000,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);
    if (!razorpayConfigured()) {
      return json(
        { error: "Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
        503,
      );
    }

    const db = adminClient();

    try {
      await enforceRateLimit(db, user.id, "create-custom-project-order", { limit: 8, windowSeconds: 60 });
    } catch (e) {
      if (e instanceof RateLimitError) {
        return json({ error: e.message, retryAfterSeconds: e.retryAfterSeconds }, 429);
      }
      throw e;
    }

    const body = await req.json().catch(() => ({}));
    const projectType = String(body.projectType ?? "");
    const projectLevel = String(body.projectLevel ?? "");
    const platform = String(body.platform ?? "");
    const title = String(body.title ?? "").trim();

    if (!PROJECT_TYPES.includes(projectType as (typeof PROJECT_TYPES)[number])) {
      return json({ error: "projectType must be academic, personal or business." }, 400);
    }
    if (!PROJECT_LEVELS.includes(projectLevel as (typeof PROJECT_LEVELS)[number])) {
      return json({ error: "projectLevel must be standard or advanced." }, 400);
    }
    if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
      return json({ error: "platform is not one of the supported options." }, 400);
    }
    if (!title) return json({ error: "title is required." }, 400);

    const featureIds: string[] = Array.isArray(body.featureIds)
      ? body.featureIds.map((x: unknown) => String(x)).filter(Boolean)
      : [];
    const customRequirements = Array.isArray(body.customRequirements)
      ? body.customRequirements
          .map((r: { text?: unknown }) => ({ text: String(r?.text ?? "").trim() }))
          .filter((r: { text: string }) => r.text.length > 0)
          .slice(0, 30)
      : [];
    const referenceFiles = Array.isArray(body.referenceFiles)
      ? body.referenceFiles
          .filter((f: { path?: unknown }) => f && typeof f.path === "string")
          .slice(0, 20)
      : [];

    // 1. base price + pricing version (trusted, from the DB) --------------
    const { data: pricing, error: pricingError } = await db
      .from("custom_project_pricing")
      .select("base_price, token_amount, pricing_version")
      .eq("project_type", projectType)
      .eq("project_level", projectLevel)
      .eq("is_active", true)
      .maybeSingle();
    if (pricingError) throw pricingError;
    if (!pricing) return json({ error: "Pricing is not configured for this project type/level." }, 400);

    const basePrice = Number(pricing.base_price) || 0;
    const pricingVersion = Number(pricing.pricing_version) || 1;

    // 2. platform charge (trusted) --------------------------------------
    const { data: platformRow, error: platformError } = await db
      .from("custom_project_platform_pricing")
      .select("charge")
      .eq("platform", platform)
      .eq("is_active", true)
      .maybeSingle();
    if (platformError) throw platformError;
    if (!platformRow) return json({ error: "That platform option is not available." }, 400);
    const platformCharge = Number(platformRow.charge) || 0;

    // 3a. AI-recommended feature ids from this user's own draft — the same
    // draft the website's Estimate page already priced from. Read here
    // (server-side, service role, scoped to this user) so the snapshot below
    // reuses the exact Included-vs-Extra split the customer saw, without the
    // client having to resend it. Best-effort: a missing/unreadable draft
    // just means no feature gets the "AI-recommended" exemption — the safe
    // default, since it only widens which Academic features get repriced by
    // the override below, never which features are selected or charged.
    let aiRecommendedFeatureIds: string[] = [];
    try {
      const { data: draftRow } = await db
        .from("custom_project_drafts")
        .select("payload")
        .eq("user_id", user.id)
        .maybeSingle();
      const ids = (draftRow?.payload as { aiRecommendedFeatureIds?: unknown } | null)?.aiRecommendedFeatureIds;
      if (Array.isArray(ids)) {
        aiRecommendedFeatureIds = ids.filter((x): x is string => typeof x === "string");
      }
    } catch (e) {
      console.warn("create-custom-project-order: could not read draft for AI-recommended feature ids:", e);
    }

    // 3b. features — the ones selected PLUS every feature included for this
    // type:level. Included features are never charged (see
    // _shared/customProjectPricing.ts); they are snapshotted at price 0 so the
    // admin panel shows the full list of what the customer gets.
    const tierKey = `${projectType}:${projectLevel}`;
    const featureSelect = "id, name, price, category, project_types, project_levels, included_in_levels";
    const [selectedRes, includedRes] = await Promise.all([
      featureIds.length > 0
        ? db.from("custom_project_features").select(featureSelect).in("id", featureIds).eq("is_active", true)
        : Promise.resolve({ data: [] as FeatureRow[], error: null }),
      db.from("custom_project_features").select(featureSelect).contains("included_in_levels", [tierKey]).eq("is_active", true),
    ]);
    if (selectedRes.error) throw selectedRes.error;
    if (includedRes.error) throw includedRes.error;
    const rowsById = new Map<string, FeatureRow>();
    for (const f of [...(selectedRes.data ?? []), ...(includedRes.data ?? [])] as FeatureRow[]) rowsById.set(f.id, f);
    const { features: snapshotFeatures, featureTotal } = priceFeatures(
      [...rowsById.values()],
      featureIds,
      projectType,
      projectLevel,
      aiRecommendedFeatureIds,
    );

    // 4. trusted token amount (§14) -----------------------------------
    const tokenAmount = TOKEN_BY_TYPE[projectType];
    if (Number(pricing.token_amount) !== tokenAmount) {
      console.warn(
        `create-custom-project-order: pricing.token_amount (${pricing.token_amount}) ` +
          `!= constant (${tokenAmount}) for ${projectType}; using the constant.`,
      );
    }
    const estimatedTotal = round2(basePrice + featureTotal + platformCharge);
    const amountPaise = Math.round(tokenAmount * 100);

    // 5. the request row + snapshot children -------------------------
    const { data: request, error: insertError } = await db
      .from("custom_project_requests")
      .insert({
        user_id: user.id,
        title,
        objective: String(body.objective ?? "").trim(),
        problem_statement: String(body.problemStatement ?? "").trim(),
        description: String(body.description ?? "").trim(),
        target_users: String(body.targetUsers ?? "").trim(),
        technology_preference: String(body.technologyPreference ?? "").trim(),
        project_type: projectType,
        project_level: projectLevel,
        platform,
        custom_requirements: customRequirements,
        project_image_path: typeof body.projectImagePath === "string" ? body.projectImagePath : null,
        base_price: basePrice,
        platform_charge: platformCharge,
        feature_total: featureTotal,
        estimated_total: estimatedTotal,
        token_amount: tokenAmount,
        pricing_version: pricingVersion,
        token_payment_status: "pending",
        status: "new",
      })
      .select("id, request_code, created_at")
      .single();
    if (insertError) throw insertError;

    if (snapshotFeatures.length > 0) {
      const { error: featError } = await db.from("custom_project_request_features").insert(
        snapshotFeatures.map((f) => ({
          request_id: request.id,
          feature_id: f.id,
          feature_name: f.name,
          feature_price: f.price,
          category: f.category,
          is_included: f.isIncluded,
        })),
      );
      if (featError) throw featError;
    }

    if (referenceFiles.length > 0) {
      const { error: fileError } = await db.from("custom_project_request_files").insert(
        referenceFiles.map(
          (f: { path: string; name?: string; sizeMb?: number; label?: string }, i: number) => ({
            request_id: request.id,
            kind: "reference",
            label: String(f.label ?? f.name ?? `File ${i + 1}`),
            storage_path: f.path,
            file_name: String(f.name ?? ""),
            size_mb: Number(f.sizeMb) || 0,
            sort_order: i,
          }),
        ),
      );
      if (fileError) throw fileError;
    }

    // 6. the payment ledger row -------------------------------------
    const { error: payError } = await db.from("custom_project_payments").insert({
      request_id: request.id,
      user_id: user.id,
      project_type: projectType,
      amount: tokenAmount,
      currency: "INR",
      status: "created",
    });
    if (payError) throw payError;

    // 7. the Razorpay order (trusted token amount) ----------------
    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      currency: "INR",
      receipt: request.id,
      notes: {
        request_id: request.id,
        request_code: request.request_code,
        user_id: user.id,
        project_type: projectType,
      },
    });

    // 8. link them ------------------------------------------------
    const [{ error: linkReqError }, { error: linkPayError }] = await Promise.all([
      db.from("custom_project_requests").update({ payment_order_id: rzpOrder.id }).eq("id", request.id),
      db.from("custom_project_payments").update({ razorpay_order_id: rzpOrder.id }).eq("request_id", request.id),
    ]);
    if (linkReqError) throw linkReqError;
    if (linkPayError) throw linkPayError;

    return json({
      requestId: request.id,
      requestCode: request.request_code,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId,
      amount: amountPaise,
      currency: "INR",
      projectType,
      projectLevel,
      tokenAmount,
      basePrice,
      platformCharge,
      featureTotal,
      estimatedTotal,
      pricingVersion,
    });
  } catch (err) {
    console.error("create-custom-project-order:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

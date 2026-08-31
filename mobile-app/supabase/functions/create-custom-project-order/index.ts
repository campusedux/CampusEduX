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

    // 3. selected features — only those actually valid for this tier ----
    let validFeatures: { id: string; name: string; price: number; category: string }[] = [];
    if (featureIds.length > 0) {
      const { data: featureRows, error: featureError } = await db
        .from("custom_project_features")
        .select("id, name, price, category, project_types, project_levels")
        .in("id", featureIds)
        .eq("is_active", true);
      if (featureError) throw featureError;
      validFeatures = (featureRows ?? [])
        .filter(
          (f: { project_types: string[]; project_levels: string[] }) =>
            Array.isArray(f.project_types) &&
            f.project_types.includes(projectType) &&
            Array.isArray(f.project_levels) &&
            f.project_levels.includes(projectLevel),
        )
        .map((f: { id: string; name: string; price: unknown; category: string }) => ({
          id: f.id,
          name: f.name,
          price: Number(f.price) || 0,
          category: f.category ?? "",
        }));
    }
    const featureTotal = round2(validFeatures.reduce((s, f) => s + f.price, 0));

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

    if (validFeatures.length > 0) {
      const { error: featError } = await db.from("custom_project_request_features").insert(
        validFeatures.map((f) => ({
          request_id: request.id,
          feature_id: f.id,
          feature_name: f.name,
          feature_price: f.price,
          category: f.category,
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

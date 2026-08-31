# API — Supabase Edge Functions

Deno functions in [`supabase/functions/`](../supabase/functions), invoked from
the client with `supabase.functions.invoke(<name>, { body })`. supabase-js
attaches the caller's `Authorization: Bearer <jwt>`; every function resolves the
user from it and returns `401` when it is missing or invalid.

Everything money-related is server-side: the Razorpay **order** is created with
the secret key here (only the public `key_id` is returned), and a payment is
only accepted after real **HMAC-SHA256** verification of
`"<razorpay_order_id>|<razorpay_payment_id>"` against `RAZORPAY_KEY_SECRET`
([`_shared/razorpay.ts`](../supabase/functions/_shared/razorpay.ts)). A
client-reported "success" is never trusted.

## Deploy / configure

```bash
supabase functions deploy create-razorpay-order verify-razorpay-payment \
  create-premium-order verify-premium-payment \
  create-wallet-topup-order verify-wallet-topup-payment delete-account

supabase secrets set --env-file supabase/functions/.env   # RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected by
the platform. Payment functions return `503` until the Razorpay secrets are set.

Shared code: `_shared/cors.ts` (CORS + `json()` helper), `_shared/client.ts`
(`adminClient()` service-role client, `getUser(req)`), `_shared/razorpay.ts`
(`createRazorpayOrder()`, `verifyRazorpaySignature()`).

---

## create-razorpay-order

Called by `payment.service.createOrder()`. Creates a `purchases` row
(`status: 'pending'`) and the matching Razorpay order.

**Request**
```json
{ "projectId": "tr-1", "couponCode": "PREMIUM40" }
```
**Response `200`**
```json
{
  "orderId": "<purchases.id uuid>",
  "razorpayOrderId": "order_XXXXXXXX",
  "razorpayKeyId": "rzp_test_XXXX",
  "amount": 50898,            // paise
  "currency": "INR",
  "price": 499,               // rupees
  "platformFee": 9.98,
  "discount": 0,
  "totalAmount": 508.98
}
```
`400` missing `projectId` · `404` project not found · `409` already owned ·
`401` unauthenticated · `503` Razorpay not configured.

## verify-razorpay-payment

Called by `payment.service.verifyPayment()`. Verifies the signature, then marks
the `purchases` row `success`, calls `increment_project_sales_count`, and logs a
`wallet_transactions` debit (`category: 'project_purchase'`). Idempotent.

**Request**
```json
{ "orderId": "<purchases.id>", "razorpayOrderId": "order_XXX",
  "razorpayPaymentId": "pay_XXX", "razorpaySignature": "<hex>" }
```
**Response `200`** — a `purchases` row shaped for `payment.service.mapOrderRow()`:
```json
{ "id": "...", "project_id": "tr-1", "project": { "title": "E-Commerce Website" },
  "price": 499, "platform_fee": 9.98, "discount": 0, "total_amount": 508.98,
  "status": "success", "razorpay_order_id": "order_XXX",
  "razorpay_payment_id": "pay_XXX", "failure_reason": null, "created_at": "..." }
```
`400` bad/failed signature (the row is set to `failed`) · `403` not your order ·
`404` order not found.

## create-premium-order

Called by `premium.service.createOrder()`. Creates a `premium_subscriptions` row
(`status: 'pending'`) + Razorpay order. GST is 18%.

**Request**  `{ "planId": "plan-premium", "billingCycle": "monthly" }`
**Response `200`**
```json
{ "orderId": "<premium_subscriptions.id>", "razorpayOrderId": "order_XXX",
  "razorpayKeyId": "rzp_test_XXX", "amount": 58882, "currency": "INR",
  "planPrice": 499, "gst": 89.82, "totalAmount": 588.82,
  "planName": "Premium", "billingCycle": "monthly" }
```
`400` bad `planId`/`billingCycle` · `404` plan not found.

## verify-premium-payment

Called by `premium.service.verifyPayment()`. Verifies, then flips the
subscription to `active`, sets `started_at` / `current_period_end`
(+1 month or +1 year); the DB trigger sets `profiles.is_premium`. Idempotent.

**Request**  `{ "orderId", "razorpayOrderId", "razorpayPaymentId", "razorpaySignature" }`
**Response `200`**  `{ "subscriptionId": "<premium_subscriptions.id>" }`
`400` bad signature · `403` not your order · `404` not found.

## create-wallet-topup-order

Called by `wallet.service.createTopUpOrder()`. Creates a `wallet_topup_orders`
row (`status: 'created'`) + Razorpay order. **No** `wallet_transactions` row yet
(the client sums every transaction row). Amount ₹10–₹100 000.

**Request**  `{ "amount": 500 }`   *(rupees)*
**Response `200`**
```json
{ "orderId": "<wallet_topup_orders.id>", "razorpayOrderId": "order_XXX",
  "razorpayKeyId": "rzp_test_XXX", "amount": 50000, "currency": "INR" }
```
`400` amount out of range.

## verify-wallet-topup-payment

Called by `wallet.service.verifyTopUp()`. Verifies, then marks the top-up order
`paid` and inserts the settled `wallet_transactions` credit
(`category: 'added_money'`). Idempotent — never double-credits.

**Request**  `{ "orderId", "razorpayOrderId", "razorpayPaymentId", "razorpaySignature" }`
**Response `200`**  `{ "ok": true, "amount": 500 }`   *(client ignores the body)*
`400` bad signature (order set to `failed`) · `403` not your order · `404` not found.

## delete-account

Called by `settings.service.deleteAccount()`. Runs with the service-role key:
deletes every row the caller owns (`wallet_transactions`, `purchases`,
`applications`, `resumes`, `resumes_builder`, `test_attempts`, `referrals` they
made, …), anonymises referrals that brought them in
(`referred_user_id → NULL`), removes both sides of `blocked_users`, deletes the
`profiles` row, clears their `avatars/` and `resumes/` Storage folders, then
calls `auth.admin.deleteUser()`. `profiles` and the `*_user_id` FKs are also
`ON DELETE CASCADE`, so the explicit deletes are defence-in-depth.

**Request**  `{}`
**Response `200`**  `{ "ok": true }`
`401` unauthenticated · `500` with `{ "error": "..." }` on failure.

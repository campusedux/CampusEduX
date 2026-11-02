import type { adminClient } from "./client.ts";

export function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function orderBindingMatches(stored: unknown, supplied: unknown): boolean {
  return nonEmptyString(stored) && nonEmptyString(supplied) && stored === supplied;
}

export type PaymentOwner = { type: "purchase" | "wallet" | "premium" | "token" | "balance"; id: string };

/** Fail closed on existing reuse, including the token request/ledger mirror.
 * The companion SQL migration provides atomic uniqueness for concurrent writers.
 */
export async function paymentIsAvailable(
  db: ReturnType<typeof adminClient>,
  paymentId: string,
  orderId: string,
  owner: PaymentOwner,
): Promise<boolean> {
  const sources = [
    { table: "purchases", payment: "razorpay_payment_id", order: "razorpay_order_id", type: "purchase" },
    { table: "wallet_topup_orders", payment: "razorpay_payment_id", order: "razorpay_order_id", type: "wallet" },
    { table: "premium_subscriptions", payment: "razorpay_payment_id", order: "razorpay_order_id", type: "premium" },
    { table: "custom_project_requests", payment: "payment_id", order: "payment_order_id", type: "token" },
    { table: "custom_project_payments", payment: "razorpay_payment_id", order: "razorpay_order_id", type: "ledger" },
  ];
  const results = await Promise.all(sources.map(async (source) => {
    const { data, error } = await db.from(source.table)
      .select(source.type === "ledger" ? `id, request_id, kind, ${source.order}` : `id, ${source.order}`)
      .eq(source.payment, paymentId)
      .returns<Record<string, unknown>[]>();
    if (error) throw error;
    return (data ?? []).every((row) => {
      const type = source.type === "ledger" ? row.kind : source.type;
      const id = source.type === "ledger" && row.kind === "token" ? row.request_id : row.id;
      return type === owner.type && id === owner.id && row[source.order] === orderId;
    });
  }));
  return results.every(Boolean);
}

import type { adminClient } from "./client.ts";
import { paymentAmountPaise } from "./razorpay.ts";

/** Trusted callers must verify SEC-02 captured evidence against these terms first. */
export async function settleProjectPurchase(
  db: ReturnType<typeof adminClient>,
  purchase: { id: string; user_id: string; razorpay_order_id: string; total_amount: unknown },
  paymentId: string,
): Promise<{ purchase: Record<string, unknown>; alreadySettled: boolean }> {
  const { data, error } = await db.rpc("settle_project_purchase", {
    p_purchase_id: purchase.id,
    p_user_id: purchase.user_id,
    p_provider_order_id: purchase.razorpay_order_id,
    p_payment_id: paymentId,
    p_amount_paise: paymentAmountPaise(purchase.total_amount),
    p_currency: "INR",
  });
  if (error) throw error;
  if (!data || typeof data.alreadySettled !== "boolean" ||
    data.purchase?.id !== purchase.id || data.purchase?.status !== "success" ||
    data.purchase?.razorpay_order_id !== purchase.razorpay_order_id ||
    data.purchase?.razorpay_payment_id !== paymentId ||
    Number(data.purchase?.total_amount) !== Number(purchase.total_amount)) {
    throw new Error("Purchase settlement could not be confirmed. Please retry.");
  }
  return data;
}

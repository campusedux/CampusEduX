import type { adminClient } from "./client.ts";
import { paymentAmountPaise } from "./razorpay.ts";

/** Called only after SEC-02 capture verification against these stored terms. */
export async function settleWalletTopup(
  db: ReturnType<typeof adminClient>,
  order: { id: string; user_id: string; razorpay_order_id: string; amount: unknown; currency: string },
  paymentId: string,
): Promise<{ amount: number; alreadySettled: boolean }> {
  const { data, error } = await db.rpc("settle_wallet_topup", {
    p_order_id: order.id,
    p_user_id: order.user_id,
    p_provider_order_id: order.razorpay_order_id,
    p_payment_id: paymentId,
    p_amount_paise: paymentAmountPaise(order.amount),
    p_currency: order.currency,
  });
  if (error) throw error;
  if (!data || typeof data.alreadySettled !== "boolean" ||
    typeof data.amount !== "number" || data.amount <= 0 ||
    data.amount !== Number(order.amount)) {
    throw new Error("Wallet settlement could not be confirmed. Please retry.");
  }
  return data;
}

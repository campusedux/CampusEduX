import { supabase } from "@/lib/supabase";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import type { PurchaseOrder } from "@/types";

interface CreateOrderResponse {
  orderId: string; // our internal purchases.id
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number; // in paise
  currency: string;
  price: number;
  platformFee: number;
  discount: number;
  totalAmount: number;
}

function mapOrderRow(row: any): PurchaseOrder {
  return {
    id: row.id,
    projectId: row.project_id,
    projectTitle: row.project?.title ?? "",
    price: row.price,
    platformFee: row.platform_fee,
    discount: row.discount,
    totalAmount: row.total_amount,
    status: row.status,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
  };
}

export const paymentService = {
  /**
   * Server creates the Razorpay order (keeps the key secret off the
   * device) and a matching `purchases` row with status "pending".
   */
  async createOrder(projectId: string, couponCode?: string): Promise<CreateOrderResponse> {
    const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
      body: { projectId, couponCode },
    });
    if (error) throw new Error(error.message);
    if (!data || data.error || !data.orderId || !data.razorpayOrderId) throw new Error(data?.error || "Could not create payment order.");
    return data as CreateOrderResponse;
  },

  /**
   * Opens the native Razorpay checkout sheet. Resolves with the raw
   * Razorpay success payload, or throws if the user cancels/it fails.
   */
  async openCheckout(order: CreateOrderResponse, customer: { name: string; email: string; contact: string }) {
    return openRazorpayCheckout({
      key: order.razorpayKeyId,
      order_id: order.razorpayOrderId,
      amount: order.amount,
      currency: order.currency,
      name: "CampusEduX",
      description: "Project purchase",
      prefill: customer,
      theme: { color: "#4F39F6" },
    });
  },

  /**
   * Server-side signature verification (HMAC of order_id|payment_id using
   * the Razorpay secret) — never trust a client-reported "success".
   * Marks the purchases row success and increments projects.sales_count.
   */
  async verifyPayment(payload: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<PurchaseOrder> {
    const { data, error } = await supabase.functions.invoke("verify-razorpay-payment", { body: payload });
    if (error) throw new Error(error.message);
    if (!data || data.error || data.status !== "success" || !data.id) throw new Error(data?.error || "Payment verification pending.");
    return mapOrderRow(data);
  },

  async markOrderFailed(orderId: string, reason: string): Promise<void> {
    const { error } = await supabase.from("purchases").update({ status: "failed", failure_reason: reason }).eq("id", orderId);
    if (error) throw new Error(error.message);
  },

  async getOrder(orderId: string): Promise<PurchaseOrder> {
    const { data, error } = await supabase.from("purchases").select("*, project:projects(title)").eq("id", orderId).single();
    if (error || !data) throw new Error("Order not found.");
    return mapOrderRow(data);
  },
};

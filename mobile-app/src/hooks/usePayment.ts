import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/payment.service";
import { useAuthStore } from "@/store/authStore";
import { projectQueryKeys } from "./useProjects";

interface PurchaseResult {
  status: "success" | "failed" | "cancelled";
  orderId: string;
}

/**
 * Orchestrates the full Buy Now -> Razorpay checkout -> server verification
 * flow used by BuyNowScreen/PaymentScreen. Kept as a hook (rather than
 * inlined in the screen) so PaymentScreen can trigger it on mount.
 */
export function usePurchaseFlow(projectId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const purchase = useCallback(
    async (couponCode?: string): Promise<PurchaseResult> => {
      setIsProcessing(true);
      try {
        const order = await paymentService.createOrder(projectId, couponCode);

        try {
          const razorpayResult = await paymentService.openCheckout(order, {
            name: user?.fullName ?? "",
            email: user?.email ?? "",
            contact: user?.mobileNumber ?? "",
          });

          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpayResult;
          if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new Error("Razorpay returned an incomplete payment response.");
          }

          await paymentService.verifyPayment({
            orderId: order.orderId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          });

          queryClient.invalidateQueries({ queryKey: projectQueryKeys.purchased });
          queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(projectId) });
          return { status: "success", orderId: order.orderId };
        } catch (checkoutError: any) {
          const wasCancelled = checkoutError?.code === 0 || /cancel/i.test(checkoutError?.description ?? "");
          await paymentService.markOrderFailed(
            order.orderId,
            wasCancelled ? "Payment cancelled by user" : checkoutError?.description ?? "Payment failed"
          );
          return { status: wasCancelled ? "cancelled" : "failed", orderId: order.orderId };
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [projectId, user, queryClient]
  );

  return { purchase, isProcessing };
}

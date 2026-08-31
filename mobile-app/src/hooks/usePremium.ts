import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { premiumService } from "@/services/premium.service";
import { useAuthStore } from "@/store/authStore";
import type { BillingCycle } from "@/types";

export const premiumQueryKeys = {
  plans: ["premium", "plans"] as const,
  features: ["premium", "features"] as const,
  membership: ["premium", "membership"] as const,
};

export const usePremiumPlans = () =>
  useQuery({ queryKey: premiumQueryKeys.plans, queryFn: premiumService.getPlans });

export const usePremiumFeatures = () =>
  useQuery({ queryKey: premiumQueryKeys.features, queryFn: premiumService.getFeatures });

export const useMembership = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: premiumQueryKeys.membership,
    queryFn: () => premiumService.getMembership(userId as string),
    enabled: !!userId,
  });
};

type SubscribeResult =
  | { status: "success"; subscriptionId: string }
  | { status: "failed"; message: string }
  | { status: "cancelled" };

/** Same Razorpay checkout + server-side verification pattern as project purchases (Module 3) and wallet top-ups (Module 8). */
export function useSubscribeToPlan() {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const updateUserFields = useAuthStore((s) => s.updateUserFields);

  const subscribe = useCallback(
    async (planId: string, billingCycle: BillingCycle): Promise<SubscribeResult> => {
      setIsProcessing(true);
      try {
        const order = await premiumService.createOrder(planId, billingCycle);

        let checkoutResult;
        try {
          checkoutResult = await openRazorpayCheckout({
            key: order.razorpayKeyId,
            order_id: order.razorpayOrderId,
            amount: order.amount,
            currency: order.currency,
            name: "CampusEduX Premium",
            description: `${order.planName} (${order.billingCycle})`,
            prefill: { name: user?.fullName, email: user?.email, contact: user?.mobileNumber },
            theme: { color: "#4F39F6" },
          });
        } catch {
          return { status: "cancelled" };
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = checkoutResult;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          throw new Error("Razorpay returned an incomplete payment response.");
        }

        const { subscriptionId } = await premiumService.verifyPayment({
          orderId: order.orderId,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        });

        updateUserFields({ isPremium: true });
        queryClient.invalidateQueries({ queryKey: premiumQueryKeys.membership });
        return { status: "success", subscriptionId };
      } catch (error: any) {
        return { status: "failed", message: error.message ?? "Payment failed. Please try again." };
      } finally {
        setIsProcessing(false);
      }
    },
    [queryClient, user, updateUserFields]
  );

  return { subscribe, isProcessing };
}

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) => premiumService.cancelSubscription(subscriptionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: premiumQueryKeys.membership }),
  });
};

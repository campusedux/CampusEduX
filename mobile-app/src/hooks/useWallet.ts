import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
import { useAuthStore } from "@/store/authStore";

export const walletQueryKeys = {
  summary: ["wallet", "summary"] as const,
  transactions: ["wallet", "transactions"] as const,
};

export const useWalletSummary = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: walletQueryKeys.summary, queryFn: () => walletService.getWalletSummary(userId as string), enabled: !!userId });
};

export const useWalletTransactions = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: walletQueryKeys.transactions, queryFn: () => walletService.getAllTransactions(userId as string), enabled: !!userId });
};

type TopUpResult = { status: "success" } | { status: "failed"; message: string } | { status: "cancelled" };

/** Same Razorpay checkout + server-side verification pattern as project purchases (Module 3). */
export function useWalletTopUp() {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const topUp = useCallback(
    async (amount: number): Promise<TopUpResult> => {
      setIsProcessing(true);
      try {
        const order = await walletService.createTopUpOrder(amount);

        let checkoutResult;
        try {
          checkoutResult = await walletService.openCheckout(order, {
            name: user?.fullName,
            email: user?.email,
            contact: user?.mobileNumber,
          });
        } catch {
          return { status: "cancelled" };
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = checkoutResult;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          throw new Error("Razorpay returned an incomplete payment response.");
        }

        await walletService.verifyTopUp({
          orderId: order.orderId,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        });

        queryClient.invalidateQueries({ queryKey: walletQueryKeys.summary });
        queryClient.invalidateQueries({ queryKey: walletQueryKeys.transactions });
        return { status: "success" };
      } catch (error: any) {
        return { status: "failed", message: error.message ?? "Payment failed. Please try again." };
      } finally {
        setIsProcessing(false);
      }
    },
    [queryClient, user]
  );

  return { topUp, isProcessing };
}

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ amount, upiId }: { amount: number; upiId: string }) => walletService.requestWithdrawal(userId as string, amount, upiId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.summary });
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.transactions });
    },
  });
};

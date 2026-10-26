import { userScopedKey } from "@/lib/queryClient";
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { customProjectsService } from "@/services/customProjects.service";
import { useAuthStore } from "@/store/authStore";
import type { CustomProjectBuilderConfig, CustomProjectRequestEdit } from "@/types";

export const customProjectKeys = {
  pricing: ["custom-projects", "pricing"] as const,
  features: ["custom-projects", "features"] as const,
  draft: ["custom-projects", "draft"] as const,
  myRequests: ["custom-projects", "my-requests"] as const,
  detail: (id: string) => ["custom-projects", "detail", id] as const,
  messages: (id: string) => ["custom-projects", "messages", id] as const,
};

/** Pricing config is small and rarely changes — cache it for the session. */
export const useCustomPricing = () =>
  useQuery({
    queryKey: customProjectKeys.pricing,
    queryFn: customProjectsService.getPricing,
    staleTime: 60 * 60 * 1000,
  });

export const useCustomFeatures = () =>
  useQuery({
    queryKey: customProjectKeys.features,
    queryFn: customProjectsService.getFeatures,
    staleTime: 60 * 60 * 1000,
  });

export const useCustomProjectDraft = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(customProjectKeys.draft, userId),
    queryFn: () => customProjectsService.getDraft(userId as string),
    enabled: !!userId,
  });
};

export const useSaveCustomDraft = () => {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CustomProjectBuilderConfig>) =>
      customProjectsService.saveDraft(userId as string, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customProjectKeys.draft }),
  });
};

export const useDeleteCustomDraft = () => {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => customProjectsService.deleteDraft(userId as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customProjectKeys.draft }),
  });
};

export const useMyCustomProjects = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(customProjectKeys.myRequests, userId),
    queryFn: () => customProjectsService.getMyRequests(userId as string),
    enabled: !!userId,
  });
};

export const useCustomProjectDetail = (requestId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(customProjectKeys.detail(requestId), userId),
    queryFn: () => customProjectsService.getRequestDetail(requestId, userId as string),
    enabled: !!requestId && !!userId,
  });
};

export const useCustomProjectMessages = (requestId: string) =>
  useQuery({
    queryKey: customProjectKeys.messages(requestId),
    queryFn: () => customProjectsService.getMessages(requestId),
    enabled: !!requestId,
  });

export const useSendCustomMessage = (requestId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      customProjectsService.sendMessage(requestId, userId as string, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customProjectKeys.messages(requestId) });
      queryClient.invalidateQueries({ queryKey: customProjectKeys.detail(requestId) });
    },
  });
};

/**
 * Owner edits + extra features (migration 0128). Every mutation refetches the detail so the price
 * breakdown always comes back from custom_project_amounts() — never patched locally.
 */
export const useCustomProjectEdits = (requestId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: customProjectKeys.detail(requestId) });
    queryClient.invalidateQueries({ queryKey: customProjectKeys.myRequests });
  };
  const opts = { onSuccess: refresh };
  return {
    updateRequest: useMutation({
      mutationFn: (changes: CustomProjectRequestEdit) => customProjectsService.updateRequest(requestId, changes),
      ...opts,
    }),
    addAttachment: useMutation({
      mutationFn: (file: { uri: string; name: string; mimeType?: string }) =>
        customProjectsService.addAttachment(requestId, userId as string, file),
      ...opts,
    }),
    removeAttachment: useMutation({
      mutationFn: (fileId: string) => customProjectsService.removeAttachment(fileId),
      ...opts,
    }),
    createAddon: useMutation({
      mutationFn: (v: { title: string; description: string }) =>
        customProjectsService.createAddon(requestId, v.title, v.description),
      ...opts,
    }),
    updateAddon: useMutation({
      mutationFn: (v: { addonId: string; title: string; description: string }) =>
        customProjectsService.updateAddon(v.addonId, v.title, v.description),
      ...opts,
    }),
    deleteAddon: useMutation({
      mutationFn: (addonId: string) => customProjectsService.deleteAddon(addonId),
      ...opts,
    }),
    acceptAddon: useMutation({
      mutationFn: (addonId: string) => customProjectsService.acceptAddon(addonId),
      ...opts,
    }),
  };
};

type SubmitResult =
  | {
      status: "success";
      requestId: string;
      requestCode: string;
      tokenAmount: number;
      title: string;
    }
  | { status: "failed"; message: string }
  | { status: "cancelled"; requestId?: string };

/**
 * Full "Pay Token & Submit Request" flow (spec §13). Same shape as
 * useSubscribeToPlan / usePurchaseFlow: server creates the order for the
 * TRUSTED token amount, Razorpay checkout, then server-side verification before
 * the request is marked paid/created. On success the draft is cleared (§39
 * keeps it on failure).
 */
export function useCustomProjectSubmit() {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const submit = useCallback(
    async (config: CustomProjectBuilderConfig, integrity: { assessmentUse: "yes" | "no"; studentAuthored: boolean; integrityAcknowledged: boolean }): Promise<SubmitResult> => {
      setIsProcessing(true);
      try {
        const order = await customProjectsService.createOrder(config, integrity);

        let checkoutResult;
        try {
          checkoutResult = await openRazorpayCheckout({
            key: order.razorpayKeyId,
            order_id: order.razorpayOrderId,
            amount: order.amount,
            currency: order.currency,
            name: "CampusEduX",
            description: `Custom project token — ${order.projectType}`,
            prefill: {
              name: user?.fullName ?? "",
              email: user?.email ?? "",
              contact: user?.mobileNumber ?? "",
            },
            theme: { color: "#4F39F6" },
          });
        } catch {
          return { status: "cancelled", requestId: order.requestId };
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = checkoutResult;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          throw new Error("Razorpay returned an incomplete payment response.");
        }

        await customProjectsService.verifyPayment({
          requestId: order.requestId,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        });

        if (user?.id) {
          await customProjectsService.deleteDraft(user.id).catch(() => undefined);
        }
        queryClient.invalidateQueries({ queryKey: customProjectKeys.myRequests });
        queryClient.invalidateQueries({ queryKey: customProjectKeys.draft });

        return {
          status: "success",
          requestId: order.requestId,
          requestCode: order.requestCode,
          tokenAmount: order.tokenAmount,
          title: config.title,
        };
      } catch (error: any) {
        return { status: "failed", message: error?.message ?? "Payment failed. Please try again." };
      } finally {
        setIsProcessing(false);
      }
    },
    [queryClient, user]
  );

  return { submit, isProcessing };
}

export type BalanceResult =
  | { status: "success" }
  | { status: "failed"; message: string }
  | { status: "cancelled" };

/**
 * "Pay Remaining Amount" flow (Bug 3). Same create-order/checkout/verify shape
 * as useCustomProjectSubmit, but for the balance: create-custom-project-balance-order
 * recomputes the remaining amount server-side (coalesce(final_price, estimated_total)
 * - amount_paid) and verify-custom-project-balance-payment does the real HMAC check
 * before the ledger row — and so amount_paid — is ever touched.
 */
export function useCustomProjectBalance(requestId: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const pay = useCallback(async (): Promise<BalanceResult> => {
    setIsProcessing(true);
    try {
      const order = await customProjectsService.createBalanceOrder(requestId);

      let checkoutResult;
      try {
        checkoutResult = await openRazorpayCheckout({
          key: order.razorpayKeyId,
          order_id: order.razorpayOrderId,
          amount: order.amount,
          currency: order.currency,
          name: "CampusEduX",
          description: "Custom project — remaining balance",
          prefill: {
            name: user?.fullName ?? "",
            email: user?.email ?? "",
            contact: user?.mobileNumber ?? "",
          },
          theme: { color: "#4F39F6" },
        });
      } catch {
        return { status: "cancelled" };
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = checkoutResult;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error("Razorpay returned an incomplete payment response.");
      }

      await customProjectsService.verifyBalancePayment({
        paymentId: order.paymentId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });

      queryClient.invalidateQueries({ queryKey: customProjectKeys.detail(requestId) });
      queryClient.invalidateQueries({ queryKey: customProjectKeys.myRequests });
      return { status: "success" };
    } catch (error: any) {
      return { status: "failed", message: error?.message ?? "Payment failed. Please try again." };
    } finally {
      setIsProcessing(false);
    }
  }, [queryClient, requestId, user]);

  return { pay, isProcessing };
}

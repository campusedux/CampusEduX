import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("@/store/authStore", () => ({ useAuthStore: (selector: any) => selector({ user: { id: "synthetic-owner" }, updateUserFields: jest.fn() }) }));
jest.mock("@/lib/razorpayCheckout", () => ({ openRazorpayCheckout: jest.fn() }));
jest.mock("@/services/payment.service", () => ({ paymentService: { createOrder: jest.fn(), openCheckout: jest.fn(), verifyPayment: jest.fn(), markOrderFailed: jest.fn() } }));
jest.mock("@/services/premium.service", () => ({ premiumService: { createOrder: jest.fn(), verifyPayment: jest.fn() } }));
jest.mock("@/services/wallet.service", () => ({ walletService: { createTopUpOrder: jest.fn(), openCheckout: jest.fn(), verifyTopUp: jest.fn() } }));
jest.mock("@/services/customProjects.service", () => ({ customProjectsService: { createOrder: jest.fn(), verifyPayment: jest.fn(), createBalanceOrder: jest.fn(), verifyBalancePayment: jest.fn(), deleteDraft: jest.fn() } }));

import { paymentService } from "@/services/payment.service";
import { premiumService } from "@/services/premium.service";
import { walletService } from "@/services/wallet.service";
import { customProjectsService } from "@/services/customProjects.service";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { usePurchaseFlow } from "@/hooks/usePayment";
import { useSubscribeToPlan } from "@/hooks/usePremium";
import { useWalletTopUp } from "@/hooks/useWallet";
import { useCustomProjectSubmit, useCustomProjectBalance } from "@/hooks/useCustomProjects";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";

const response = { razorpay_order_id: "order_synthetic", razorpay_payment_id: "pay_synthetic", razorpay_signature: "synthetic-signature" };
const order = { orderId: "synthetic-order", requestId: "synthetic-request", paymentId: "synthetic-balance", requestCode: "CPR-synthetic", tokenAmount: 100, amount: 10000, currency: "INR", razorpayOrderId: response.razorpay_order_id, razorpayKeyId: "synthetic-key" };
const cases = [
  { name: "project", useFlow: () => usePurchaseFlow("synthetic-project").purchase, args: [], create: paymentService.createOrder, checkout: paymentService.openCheckout, verify: paymentService.verifyPayment },
  { name: "premium", useFlow: () => useSubscribeToPlan().subscribe, args: ["synthetic-plan", "monthly"], create: premiumService.createOrder, checkout: openRazorpayCheckout, verify: premiumService.verifyPayment },
  { name: "wallet", useFlow: () => useWalletTopUp().topUp, args: [100], create: walletService.createTopUpOrder, checkout: walletService.openCheckout, verify: walletService.verifyTopUp },
  { name: "custom token", useFlow: () => useCustomProjectSubmit().submit, args: [{ title: "Synthetic project" }, { assessmentUse: "no", integrityAcknowledged: true, studentAuthored: false }], create: customProjectsService.createOrder, checkout: openRazorpayCheckout, verify: customProjectsService.verifyPayment },
  { name: "custom balance", useFlow: () => useCustomProjectBalance("synthetic-request").pay, args: [], create: customProjectsService.createBalanceOrder, checkout: openRazorpayCheckout, verify: customProjectsService.verifyBalancePayment },
];
let tree: TestRenderer.ReactTestRenderer;
let rerender: () => void;
let queryClient: QueryClient;
async function mount<T>(hook: () => T) {
  let value: T;
  function Probe() { value = hook(); return null; }
  const client = queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const element = () => <QueryClientProvider client={client}><Probe /></QueryClientProvider>;
  await act(async () => { tree = TestRenderer.create(element()); });
  rerender = () => tree.update(element());
  return () => value!;
}
afterEach(async () => { if (tree) await act(async () => tree.unmount()); queryClient?.clear(); });
beforeEach(() => { jest.resetAllMocks(); (customProjectsService.deleteDraft as jest.Mock).mockResolvedValue(undefined); });

for (const flow of cases) describe(flow.name, () => {
  beforeEach(() => {
    (flow.create as jest.Mock).mockResolvedValue(order);
    (flow.checkout as jest.Mock).mockResolvedValue(response);
    (flow.verify as jest.Mock).mockResolvedValue({ subscriptionId: "synthetic-subscription" });
  });
  async function invoke(fn: (...args: any[]) => Promise<any>) {
    let result: any;
    await act(async () => { result = await fn(...flow.args); });
    return result;
  }
  it("retries the original signed response after repeated verification outages without a second checkout", async () => {
    (flow.verify as jest.Mock).mockRejectedValueOnce(new Error("Synthetic lost response")).mockRejectedValueOnce(new Error("Synthetic outage"));
    const get = await mount(flow.useFlow as () => (...args: any[]) => Promise<any>);
    expect((await invoke(get())).status).toBe("pending");
    expect((await invoke(get())).status).toBe("pending");
    expect((await invoke(get())).status).toBe("success");
    expect(flow.create).toHaveBeenCalledTimes(1);
    expect(flow.checkout).toHaveBeenCalledTimes(1);
    expect(flow.verify).toHaveBeenCalledTimes(3);
    for (const [payload] of (flow.verify as jest.Mock).mock.calls) expect(payload).toEqual(expect.objectContaining({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }));
    expect(paymentService.markOrderFailed).not.toHaveBeenCalled();
  });
  it("distinguishes an SDK failure from a user dismissal", async () => {
    (flow.checkout as jest.Mock).mockRejectedValueOnce({ code: 2, description: "Synthetic bank failure" }).mockRejectedValueOnce({ code: 0 });
    const get = await mount(flow.useFlow as () => (...args: any[]) => Promise<any>);
    expect((await invoke(get())).status).toBe("failed");
    expect((await invoke(get())).status).toBe("cancelled");
    expect(flow.verify).not.toHaveBeenCalled();
    expect(paymentService.markOrderFailed).not.toHaveBeenCalled();
  });
  it("coalesces rapid duplicate payment presses", async () => {
    const get = await mount(flow.useFlow as () => (...args: any[]) => Promise<any>);
    await act(async () => { const fn = get(); const results = await Promise.all([fn(...flow.args), fn(...flow.args)]); expect(results.map(r => r.status)).toEqual(["success", "success"]); });
    expect(flow.create).toHaveBeenCalledTimes(1);
    expect(flow.checkout).toHaveBeenCalledTimes(1);
    expect(flow.verify).toHaveBeenCalledTimes(1);
  });
  it("reports order creation failure without opening checkout", async () => {
    (flow.create as jest.Mock).mockRejectedValue(new Error("Synthetic order failure"));
    const get = await mount(flow.useFlow as () => (...args: any[]) => Promise<any>);
    expect((await invoke(get())).status).toBe("failed");
    expect(flow.checkout).not.toHaveBeenCalled();
  });
});

it("discards a previous owner's retry on identity change and refuses anonymous starts", async () => {
  let owner: string | undefined = "synthetic-owner";
  const callback = jest.fn().mockRejectedValue(new Error("Synthetic outage"));
  const get = await mount(() => usePaymentVerification(owner));
  await act(async () => { await expect(get().run(() => get().verify(callback))).rejects.toThrow("verification pending"); });
  owner = "synthetic-other";
  await act(async () => rerender());
  const start = jest.fn().mockResolvedValue("new-owner");
  await expect(get().run(start)).resolves.toBe("new-owner");
  expect(callback).toHaveBeenCalledTimes(1);
  owner = undefined;
  await act(async () => rerender());
  await expect(get().run(start)).rejects.toThrow("Sign in");
  expect(start).toHaveBeenCalledTimes(1);
});

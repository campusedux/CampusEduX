jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("react-native-razorpay", () => ({ __esModule: true, default: { open: jest.fn() } }));

import RazorpayCheckout from "react-native-razorpay";
import { paymentService } from "@/services/payment.service";
import {
  resetSupabaseMock,
  setTableResult,
  setFunctionResult,
  supabase,
} from "../../mocks/supabase.mock";
import { purchaseRow } from "../../mocks/projects.mock";

beforeEach(() => {
  resetSupabaseMock();
  (RazorpayCheckout.open as jest.Mock).mockReset();
});

describe("integration: project purchase (create order -> checkout -> verify)", () => {
  it("passes the projectId/coupon to create-razorpay-order and returns its fields", async () => {
    setFunctionResult("create-razorpay-order", {
      data: {
        orderId: "purchase-1",
        razorpayOrderId: "order_rzp_1",
        razorpayKeyId: "rzp_test_1",
        amount: 50898,
        currency: "INR",
        price: 499,
        platformFee: 9.98,
        discount: 0,
        totalAmount: 508.98,
      },
    });

    const order = await paymentService.createOrder("tr-1", "PREMIUM40");

    expect(supabase.functions.invoke).toHaveBeenCalledWith("create-razorpay-order", {
      body: { projectId: "tr-1", couponCode: "PREMIUM40" },
    });
    expect(order.amount).toBe(50898);
    expect(order.totalAmount).toBe(508.98);
  });

  it("opens the native Razorpay sheet with the order fields", async () => {
    (RazorpayCheckout.open as jest.Mock).mockResolvedValue({
      razorpay_order_id: "order_rzp_1",
      razorpay_payment_id: "pay_rzp_1",
      razorpay_signature: "deadbeef",
    });

    const order = {
      orderId: "purchase-1",
      razorpayOrderId: "order_rzp_1",
      razorpayKeyId: "rzp_test_1",
      amount: 50898,
      currency: "INR",
      price: 499,
      platformFee: 9.98,
      discount: 0,
      totalAmount: 508.98,
    };
    await paymentService.openCheckout(order, { name: "Rohan", email: "r@e.com", contact: "9" });

    expect(RazorpayCheckout.open).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "rzp_test_1",
        order_id: "order_rzp_1",
        amount: 50898,
        currency: "INR",
      })
    );
  });

  it("verifies server-side and returns the settled purchase order", async () => {
    setFunctionResult("verify-razorpay-payment", { data: { ...purchaseRow, status: "success", razorpay_payment_id: "pay_rzp_1" } });

    const verified = await paymentService.verifyPayment({
      orderId: "purchase-1",
      razorpayOrderId: "order_rzp_1",
      razorpayPaymentId: "pay_rzp_1",
      razorpaySignature: "deadbeef",
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith("verify-razorpay-payment", {
      body: {
        orderId: "purchase-1",
        razorpayOrderId: "order_rzp_1",
        razorpayPaymentId: "pay_rzp_1",
        razorpaySignature: "deadbeef",
      },
    });
    expect(verified.status).toBe("success");
    expect(verified.razorpayPaymentId).toBe("pay_rzp_1");
    expect(verified.projectTitle).toBe("E-Commerce Website");
  });

  it("propagates a verification failure from the Edge Function", async () => {
    setFunctionResult("verify-razorpay-payment", { error: { message: "Payment signature verification failed." } });

    await expect(
      paymentService.verifyPayment({
        orderId: "purchase-1",
        razorpayOrderId: "order_rzp_1",
        razorpayPaymentId: "pay_rzp_1",
        razorpaySignature: "bad",
      })
    ).rejects.toThrow("signature verification failed");
  });

  it("marks the local order failed on user cancel", async () => {
    setTableResult("purchases", { data: null });
    await expect(paymentService.markOrderFailed("purchase-1", "cancelled")).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith("purchases");
  });
});

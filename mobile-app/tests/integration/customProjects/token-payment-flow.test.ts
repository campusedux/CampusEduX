jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { customProjectsService } from "@/services/customProjects.service";
import { resetSupabaseMock, setFunctionResult, supabase } from "../../mocks/supabase.mock";
import type { CustomProjectBuilderConfig } from "@/types";

beforeEach(() => resetSupabaseMock());

const config: CustomProjectBuilderConfig = {
  projectType: "personal",
  projectLevel: "advanced",
  platform: "web_android",
  title: "Campus Marketplace",
  objective: "Buy/sell used items on campus",
  problemStatement: "",
  description: "Listings, chat, payments",
  targetUsers: "Students",
  technologyPreference: "React Native + Supabase",
  featureIds: ["rt-live-chat", "pay-razorpay"],
  customRequirements: [{ text: "Brand colours" }],
  projectImagePath: "u-1/uploads/image_1.jpg",
  referenceFiles: [{ path: "u-1/uploads/ref_1_spec.pdf", name: "spec.pdf", sizeMb: 0.4 }],
};

describe("integration: custom project token payment (create order -> verify)", () => {
  it("forwards the whole config to create-custom-project-order and returns its fields", async () => {
    setFunctionResult("create-custom-project-order", {
      data: {
        requestId: "req-1",
        requestCode: "CPR-2026-000001",
        razorpayOrderId: "order_rzp_cpr1",
        razorpayKeyId: "rzp_test_1",
        amount: 300000,
        currency: "INR",
        projectType: "personal",
        projectLevel: "advanced",
        tokenAmount: 3000,
        estimatedTotal: 32999,
      },
    });

    const order = await customProjectsService.createOrder(config);

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      "create-custom-project-order",
      expect.objectContaining({
        body: expect.objectContaining({
          projectType: "personal",
          projectLevel: "advanced",
          platform: "web_android",
          title: "Campus Marketplace",
          featureIds: ["rt-live-chat", "pay-razorpay"],
          projectImagePath: "u-1/uploads/image_1.jpg",
        }),
      })
    );
    expect(order.amount).toBe(300000); // paise — trusted token * 100
    expect(order.tokenAmount).toBe(3000);
    expect(order.requestCode).toBe("CPR-2026-000001");
  });

  it("verifies server-side and returns the mapped, paid request", async () => {
    setFunctionResult("verify-custom-project-payment", {
      data: {
        id: "req-1",
        request_code: "CPR-2026-000001",
        title: "Campus Marketplace",
        project_type: "personal",
        project_level: "advanced",
        platform: "web_android",
        estimated_total: 32999,
        token_amount: 3000,
        token_payment_status: "paid",
        status: "new",
        created_at: "2026-08-29T00:00:00.000Z",
      },
    });

    const req = await customProjectsService.verifyPayment({
      requestId: "req-1",
      razorpayOrderId: "order_rzp_cpr1",
      razorpayPaymentId: "pay_rzp_cpr1",
      razorpaySignature: "deadbeef",
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith("verify-custom-project-payment", {
      body: {
        requestId: "req-1",
        razorpayOrderId: "order_rzp_cpr1",
        razorpayPaymentId: "pay_rzp_cpr1",
        razorpaySignature: "deadbeef",
      },
    });
    expect(req.tokenPaymentStatus).toBe("paid");
    expect(req.tokenAmount).toBe(3000);
    expect(req.status).toBe("new");
  });

  it("throws (no paid request) when the Edge Function rejects a bad signature", async () => {
    setFunctionResult("verify-custom-project-payment", {
      data: { error: "Payment signature verification failed." },
    });

    await expect(
      customProjectsService.verifyPayment({
        requestId: "req-1",
        razorpayOrderId: "order_rzp_cpr1",
        razorpayPaymentId: "pay_rzp_cpr1",
        razorpaySignature: "bad",
      })
    ).rejects.toThrow("signature verification failed");
  });
});

jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";

let options: any;
let failed: (response: any) => void;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
beforeEach(() => {
  Object.defineProperty(globalThis, "document", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { Razorpay: class {
    constructor(value: any) { options = value; }
    on(_event: string, callback: typeof failed) { failed = callback; }
    open() {}
  } } });
});
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else delete (globalThis as any).window;
  if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument); else delete (globalThis as any).document;
});
const checkoutOptions = { key: "synthetic-key", amount: 10000, currency: "INR", name: "Synthetic", order_id: "order_synthetic" };
it("accepts a successful retry in the same checkout after a failed attempt", async () => {
  const result = openRazorpayCheckout(checkoutOptions);
  await Promise.resolve();
  failed({ error: { description: "Synthetic bank failure" } });
  const response = { razorpay_order_id: "order_synthetic", razorpay_payment_id: "pay_synthetic", razorpay_signature: "synthetic" };
  options.handler(response);
  options.modal.ondismiss();
  await expect(result).resolves.toEqual(response);
});
it("reports a failed attempt when checkout is dismissed without subsequent success", async () => {
  const result = openRazorpayCheckout(checkoutOptions);
  await Promise.resolve();
  failed({ error: { description: "Synthetic bank failure" } });
  options.modal.ondismiss();
  await expect(result).rejects.toEqual({ code: 2, description: "Synthetic bank failure" });
});
it("reports dismissal without any attempt as cancellation", async () => {
  const result = openRazorpayCheckout(checkoutOptions);
  await Promise.resolve();
  options.modal.ondismiss();
  await expect(result).rejects.toEqual(expect.objectContaining({ code: 0 }));
});

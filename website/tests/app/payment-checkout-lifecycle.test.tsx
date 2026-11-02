import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

// Exercise the actual checkout handlers in the repository's Node-only runner.
// Replace React's hook scheduler and external boundaries, not the payment logic.
const fixture = vi.hoisted(() => ({ states: [] as any[], cursor: 0, premium: false, options: null as any, listeners: {} as Record<string, Function>, invoke: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("react", async () => ({ ...await vi.importActual("react"),
  useState: (initial: any) => {
    const index = fixture.cursor++;
    if (!(index in fixture.states)) fixture.states[index] = initial === "loading" ? (fixture.premium ? "signed-in" : "buy") : initial === "" ? "no" : typeof initial === "boolean" ? true : initial;
    return [fixture.states[index], (next: any) => { fixture.states[index] = typeof next === "function" ? next(fixture.states[index]) : next; }];
  },
  useEffect: () => undefined,
  useCallback: (fn: Function) => fn,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: fixture.push, refresh: fixture.refresh }) }));
vi.mock("@/lib/supabase/browser", () => ({ createBrowserSupabase: () => ({ functions: { invoke: fixture.invoke }, auth: { getUser: async () => ({ data: { user: { id: "synthetic-owner" } } }) }, from: () => ({ delete: () => ({ eq: async () => ({ error: null }) }) }) }) }));
vi.mock("@/lib/razorpay", () => ({ loadRazorpayScript: async () => class {
  constructor(options: any) { fixture.options = options; }
  open() {}
  on(event: string, fn: Function) { fixture.listeners[event] = fn; }
} }));
vi.mock("@/components/ui", () => ({ Button: "button" }));
vi.mock("@/app/custom-projects/_builder/BottomBar", () => ({ BottomBar: "div" }));
import TopUpForm from "@/app/account/wallet/TopUpForm";
import PremiumSubscribeButton from "@/components/PremiumSubscribeButton";
import ProjectPurchasePanel from "@/app/projects/[id]/ProjectPurchasePanel";
import CustomProjectCheckout from "@/app/custom-projects/checkout/CustomProjectCheckout";
import PayRemainingButton from "@/app/custom-projects/my-projects/[id]/PayRemainingButton";

const response = { razorpay_order_id: "order_synthetic", razorpay_payment_id: "pay_synthetic", razorpay_signature: "synthetic-signature" };
const order = { orderId: "synthetic-order", requestId: "synthetic-request", paymentId: "synthetic-balance", razorpayOrderId: response.razorpay_order_id, razorpayKeyId: "synthetic-key", amount: 50000, currency: "INR" };
const flows = [
  { name: "wallet", status: 1, render: () => TopUpForm() },
  { name: "premium", status: 1, render: () => PremiumSubscribeButton({ planId: "synthetic-plan", planName: "Synthetic" }) },
  { name: "project", status: 0, render: () => ProjectPurchasePanel({ projectId: "synthetic-project", price: 500, title: "Synthetic" }) },
  { name: "custom token", status: 0, render: () => CustomProjectCheckout({ draft: { projectType: "personal", title: "Synthetic" } as any, featureIds: [], tokenAmount: 500 }) },
  { name: "custom balance", status: 0, render: () => PayRemainingButton({ requestId: "synthetic-request", remaining: 500 }) },
];
function buttons(node: any): ReactElement<any>[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(buttons);
  return [...(typeof node.props?.onClick === "function" ? [node] : []), ...Object.values(node.props ?? {}).flatMap(buttons)];
}
function render(flow: typeof flows[number]) { fixture.cursor = 0; return flow.render(); }
beforeEach(() => { fixture.states = []; fixture.cursor = 0; fixture.options = null; fixture.listeners = {}; fixture.invoke.mockReset(); fixture.push.mockClear(); fixture.refresh.mockClear(); });

for (const flow of flows) describe(flow.name, () => {
  async function open() {
    fixture.premium = flow.name === "premium";
    fixture.invoke.mockImplementation(async (slug: string) => ({ data: slug.startsWith("create-") ? order : { status: "success" }, error: null }));
    const pay = buttons(render(flow)).find(button => !String(button.props.children).includes("Monthly") && !String(button.props.children).includes("Yearly"));
    expect(pay).toBeDefined();
    await pay!.props.onClick();
    expect(fixture.options).not.toBeNull();
  }
  it("keeps checkout blocked when dismissed during verification; retries the original callback", async () => {
    await open();
    let complete!: (value: any) => void;
    fixture.invoke.mockImplementation((slug: string) => slug.startsWith("verify-") ? new Promise(resolve => { complete = resolve; }) : Promise.resolve({ data: order, error: null }));
    const pending = fixture.options.handler(response);
    fixture.options.modal.ondismiss();
    expect(fixture.states[flow.status]).toBe("processing");
    complete({ data: null, error: { message: "Synthetic lost response" } });
    await pending;
    expect(fixture.states[flow.status]).toBe("pending");
    fixture.options.modal.ondismiss();
    expect(fixture.states[flow.status]).toBe("pending");
    const retry = fixture.states[flow.status + 2];
    expect(typeof retry).toBe("function");
    fixture.invoke.mockResolvedValue({ data: { status: "success" }, error: null });
    await retry();
    expect(fixture.states[flow.status]).toBe(flow.name === "project" ? "owned" : "idle");
    expect(fixture.invoke.mock.calls.filter(([slug]) => slug.startsWith("create-"))).toHaveLength(1);
    const verifications = fixture.invoke.mock.calls.filter(([slug]) => slug.startsWith("verify-"));
    expect(verifications).toHaveLength(2);
    expect(verifications[0]).toEqual(verifications[1]);
  });
  it("allows dismissal before payment without verification and displays provider failures", async () => {
    await open();
    fixture.listeners["payment.failed"]({ error: { description: "Synthetic bank failure" } });
    expect(fixture.states[flow.status + 1]).toBe("Synthetic bank failure");
    fixture.options.modal.ondismiss();
    expect(fixture.states[flow.status]).toBe(flow.name === "project" ? "buy" : "idle");
    expect(fixture.invoke.mock.calls.filter(([slug]) => slug.startsWith("verify-"))).toHaveLength(0);
  });
});

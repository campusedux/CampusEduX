import { Platform } from "react-native";
import type { RazorpayOptions, RazorpayResponse } from "react-native-razorpay";

/**
 * One checkout entry point for every payment flow (project / premium / wallet).
 *
 *  - native: lazily loads `react-native-razorpay` and opens the native sheet.
 *    The lazy import keeps that native module out of the web bundle's
 *    evaluation path (it references NativeModules that don't exist on web).
 *  - web: loads Razorpay's checkout.js and drives `window.Razorpay`, resolving
 *    with the same `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`
 *    shape so callers (and the server-side verify Edge Functions) are identical.
 *
 * A user-cancelled checkout rejects with `{ code: 0 }`, matching how the native
 * module reports a dismissal — callers already special-case that.
 */

let webScriptPromise: Promise<void> | null = null;

function loadRazorpayWebScript(): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Razorpay web checkout requires a browser."));
  }
  if ((window as any).Razorpay) return Promise.resolve();
  if (webScriptPromise) return webScriptPromise;

  webScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      webScriptPromise = null;
      reject(new Error("Could not load Razorpay checkout. Check your connection."));
    };
    document.head.appendChild(script);
  });
  return webScriptPromise;
}

async function openWeb(options: RazorpayOptions): Promise<RazorpayResponse> {
  await loadRazorpayWebScript();
  const Razorpay = (window as any).Razorpay;
  if (!Razorpay) throw new Error("Razorpay checkout is unavailable.");

  return new Promise<RazorpayResponse>((resolve, reject) => {
    let settled = false;
    const rzp = new Razorpay({
      ...options,
      handler: (response: RazorpayResponse) => {
        settled = true;
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          if (!settled) reject({ code: 0, description: "Payment cancelled by user" });
        },
      },
    });
    rzp.on("payment.failed", (response: any) => {
      settled = true;
      reject({ code: 2, description: response?.error?.description ?? "Payment failed" });
    });
    rzp.open();
  });
}

export function openRazorpayCheckout(
  options: RazorpayOptions
): Promise<RazorpayResponse> {
  if (Platform.OS === "web") return openWeb(options);
  // Synchronous require (not `import()`) so it stays a lazy, Metro-resolvable
  // reference that never evaluates on web — and so Jest's module mock applies.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("react-native-razorpay") as typeof import("react-native-razorpay");
  return mod.default.open(options);
}

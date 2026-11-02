import { useMemo } from "react";

export class PaymentPendingError extends Error {
  constructor() {
    super("Payment verification pending. Tap the payment button again to retry verification without another charge. If you leave this screen, check your account before paying again.");
  }
}

export function checkoutWasCancelled(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 0;
}

/** Retain only an in-memory verification closure; never persist payment signatures. */
export function usePaymentVerification(ownerId: string | undefined) {
  return useMemo(() => {
    let pending: (() => Promise<unknown>) | undefined;
    let flight: Promise<unknown> | undefined;
    async function verify<T>(callback: () => Promise<T>): Promise<T> {
      pending = callback;
      try {
        const result = await callback();
        pending = undefined;
        return result;
      } catch {
        throw new PaymentPendingError();
      }
    }
    function run<T>(start: () => Promise<T>): Promise<T> {
      if (!ownerId) return Promise.reject(new Error("Sign in before paying."));
      if (flight) return flight as Promise<T>;
      const retry = pending;
      flight = Promise.resolve().then(() => retry ? verify(retry) : start()).finally(() => { flight = undefined; });
      return flight as Promise<T>;
    }
    return { run, verify };
  }, [ownerId]);
}

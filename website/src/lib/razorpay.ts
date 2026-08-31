// Loads Razorpay's Checkout.js once and resolves with the constructor.
// Used by both the wallet top-up and Premium subscribe flows — both call the
// *existing* CampusEduX Edge Functions (create-*-order / verify-*-payment),
// never a new payment backend, and never see anything but a razorpayKeyId +
// amount-in-paise that those functions already return.
export function loadRazorpayScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if ((window as any).Razorpay) return resolve((window as any).Razorpay);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve((window as any).Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

/** AdSense supports nonce-based strict CSP, not a rolling script host allow-list.
 * https://support.google.com/adsense/answer/16283098
 * Host entries below are a conservative starting set for non-script resources;
 * validate real ad/CMP requests before launch. No advertising loads are installed.
 */
function buildCsp({ nonce = "", adsEnabled = false, isDev = false } = {}) {
  if (adsEnabled && !/^[A-Za-z0-9+/=_-]+$/.test(nonce)) throw new Error("Advertising CSP requires a request nonce");
  const scripts = adsEnabled
    ? `'nonce-${nonce}' 'strict-dynamic' 'self' https://checkout.razorpay.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://www.googletagservices.com`
    // Preserve the existing off-mode policy and ISR; nonce mode never uses these exceptions.
    : `'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`;
  const ads = adsEnabled ? " https://*.googlesyndication.com https://*.doubleclick.net https://*.googleadservices.com https://*.googletagservices.com https://www.google.com" : "";
  return [
    "default-src 'self'", `script-src ${scripts}`,
    "style-src 'self' 'unsafe-inline'", "font-src 'self'",
    `img-src 'self' data: https://*.supabase.co https://*.google-analytics.com https://www.googletagmanager.com${ads}`,
    `connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com${ads}`,
    `frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com${ads}`,
    "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
  ].join("; ");
}

module.exports = { buildCsp };

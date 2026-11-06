const PRODUCTION_SITE_ORIGIN = "https://www.campusedux.com";

/** Canonical origin policy shared by Next's build configuration and metadata.
 * @param {string | undefined} [value]
 * @param {string | undefined} [environment]
 */
function normalizeSiteUrl(value, environment = process.env.NODE_ENV) {
  if (!value?.trim()) return PRODUCTION_SITE_ORIGIN;
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Invalid NEXT_PUBLIC_SITE_URL: expected an HTTP(S) origin.");
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
    throw new Error("Invalid NEXT_PUBLIC_SITE_URL: expected an HTTP(S) origin without credentials.");
  }
  if (environment === "production") {
    if (url.protocol !== "https:" || url.port ||
        !["campusedux.com", "www.campusedux.com"].includes(url.hostname)) {
      // Never print the supplied value: configuration can contain credentials.
      throw new Error("Production NEXT_PUBLIC_SITE_URL must use https://www.campusedux.com. Local, Render and staging origins are forbidden.");
    }
    return PRODUCTION_SITE_ORIGIN;
  }
  return ["campusedux.com", "www.campusedux.com"].includes(url.hostname)
    ? PRODUCTION_SITE_ORIGIN : url.origin;
}

module.exports = { normalizeSiteUrl, PRODUCTION_SITE_ORIGIN };

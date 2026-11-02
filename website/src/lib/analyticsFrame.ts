// The Google tag runs in an opaque sandbox, without application DOM/storage.
export function analyticsFrameDocument(id: string, origin: string, clientId: string): string {
  const literal = (value: string) => JSON.stringify(value).replace(/</g, "\\u003c");
  return `<!doctype html><html><head>
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://www.googletagmanager.com; connect-src https://www.google-analytics.com https://analytics.google.com; img-src https://www.google-analytics.com; base-uri 'none'; form-action 'none'">
<title>CampusEduX</title></head><body><script>
const measurementId = ${literal(id)};
const siteOrigin = ${literal(origin)};
const clientId = ${literal(clientId)};
window.dataLayer = [];
function gtag() { window.dataLayer.push(arguments); }
gtag('consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
let initialized = false;
window.addEventListener('message', function(event) {
  if (event.source !== parent || event.origin !== siteOrigin) return;
  const data = event.data;
  if (!data || typeof data.page_path !== 'string' || typeof data.page_location !== 'string' || typeof data.page_referrer !== 'string') return;
  try {
    const url = new URL(data.page_location);
    if (url.origin !== siteOrigin || url.pathname !== data.page_path || url.search || url.hash || url.username || url.password) return;
    if (data.page_referrer) {
      const ref = new URL(data.page_referrer);
      if (!/^https?:$/.test(ref.protocol) || ref.search || ref.hash || ref.username || ref.password) return;
    }
  } catch { return; }
  // Rebuild the allowlisted payload; never forward arbitrary event fields.
  const page = {page_path: data.page_path, page_location: data.page_location, page_referrer: data.page_referrer, page_title: 'CampusEduX'};
  // Safe defaults precede js/config. Automatic collection can see only the
  // inert frame and these fields, never the parent location or history.
  gtag('set', page);
  if (!initialized) {
    initialized = true;
    gtag('consent', 'update', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    gtag('js', new Date());
    gtag('config', measurementId, {...page, client_id: clientId, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false});
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    script.referrerPolicy = 'no-referrer';
    script.async = true;
    document.head.appendChild(script);
  }
  gtag('event', 'page_view', {...page, send_to: measurementId});
});
</script></body></html>`;
}

#!/usr/bin/env node
/**
 * Generates the public legal website from the SAME source the app uses:
 *   src/legal/legal.config.json      — owner-configurable values + versions
 *   src/legal/content/<id>.json      — document bodies
 *
 * Output: mobile-app/legal-site/  (static, responsive, self-contained HTML)
 *   privacy-policy.html, terms.html, ... , index.html, styles.css
 *
 * Deploy the contents of legal-site/ at https://campusedux.app/ so that
 * /privacy-policy, /terms, etc. resolve. Re-run after editing any content or
 * config file:  node scripts/generate-legal-html.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "src", "legal", "content");
const OUT_DIR = join(ROOT, "legal-site");

const cfg = JSON.parse(readFileSync(join(ROOT, "src", "legal", "legal.config.json"), "utf8"));

const ORDER = [
  "privacy-policy",
  "terms",
  "refund-policy",
  "project-license",
  "community-guidelines",
  "disclaimer",
  "data-and-permissions",
  "delete-account",
  "contact",
];

const TOKENS = {
  appName: cfg.appName,
  companyName: cfg.companyName,
  entityDescription: cfg.entityDescription,
  country: cfg.country,
  governingCityState: cfg.governingCityState,
  registeredAddress: cfg.registeredAddress,
  grievanceOfficerName: cfg.grievanceOfficerName,
  website: cfg.website,
  supportEmail: cfg.supportEmail,
  legalEmail: cfg.legalEmail,
  privacyEmail: cfg.privacyEmail,
  grievanceEmail: cfg.grievanceEmail,
  paymentProcessorName: cfg.paymentProcessorName,
  paymentProcessorPrivacyUrl: cfg.paymentProcessorPrivacyUrl,
  infraProviderName: cfg.infraProviderName,
  infraProviderPrivacyUrl: cfg.infraProviderPrivacyUrl,
  minimumAge: cfg.minimumAge,
  effectiveDate: cfg.effectiveDate,
  supportResponseBusinessDays: cfg.supportResponseBusinessDays,
  refundRequestWindowDays: cfg.rules.refundRequestWindowDays,
  refundProcessingBusinessDays: cfg.rules.refundProcessingBusinessDays,
  premiumRefundableWithinDaysIfUnused: cfg.rules.premiumRefundableWithinDaysIfUnused,
  withdrawalProcessingBusinessDays: cfg.rules.withdrawalProcessingBusinessDays,
};

const fill = (s) =>
  String(s).replace(/\{\{(\w+)\}\}/g, (whole, k) => (k in TOKENS ? String(TOKENS[k]) : whole));

const esc = (s) =>
  fill(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

function bullets(items) {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function section(s) {
  let html = `<h2>${esc(s.heading)}</h2>`;
  for (const p of s.body ?? []) html += `<p>${esc(p)}</p>`;
  if (s.bullets) html += bullets(s.bullets);
  for (const sub of s.subsections ?? []) {
    html += `<h3>${esc(sub.heading)}</h3>`;
    for (const p of sub.body ?? []) html += `<p>${esc(p)}</p>`;
    if (sub.bullets) html += bullets(sub.bullets);
  }
  return html;
}

function nav(activeId) {
  return `<nav class="policy-nav">${ORDER.map((id) => {
    const doc = JSON.parse(readFileSync(join(CONTENT_DIR, `${id}.json`), "utf8"));
    const cls = id === activeId ? ' class="active"' : "";
    return `<a href="./${id}.html"${cls}>${esc(doc.title)}</a>`;
  }).join("")}</nav>`;
}

function footer() {
  return `<footer>
    <p><strong>${esc(cfg.appName)}</strong> — ${esc(cfg.entityDescription)}.</p>
    <p class="links">${ORDER.map((id) => {
      const doc = JSON.parse(readFileSync(join(CONTENT_DIR, `${id}.json`), "utf8"));
      return `<a href="./${id}.html">${esc(doc.title)}</a>`;
    }).join(" · ")}</p>
    <p class="muted">Support: <a href="mailto:${cfg.supportEmail}">${cfg.supportEmail}</a> ·
      Grievance: <a href="mailto:${cfg.grievanceEmail}">${cfg.grievanceEmail}</a> ·
      Policies v${cfg.currentLegalVersion}</p>
  </footer>`;
}

function page({ id, title, description, bodyHtml, canonical }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} · ${esc(cfg.appName)}</title>
<meta name="description" content="${esc(description).replace(/"/g, "&quot;")}" />
<link rel="canonical" href="${canonical}" />
<link rel="stylesheet" href="./styles.css" />
</head>
<body>
<header class="site-header">
  <a class="brand" href="./index.html">${esc(cfg.appName)}</a>
  <span class="tag">Legal &amp; Privacy</span>
</header>
<main>
${bodyHtml}
</main>
${footer()}
</body>
</html>
`;
}

const STYLES = `:root{--fg:#111827;--muted:#6b7280;--line:#e5e7eb;--accent:#4f39f6;--bg:#fff}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--fg);background:var(--bg)}
a{color:var(--accent)}
.site-header{display:flex;align-items:baseline;gap:12px;padding:18px 20px;border-bottom:1px solid var(--line)}
.brand{font-weight:700;font-size:18px;text-decoration:none;color:var(--fg)}
.tag{color:var(--muted);font-size:13px}
main{max-width:760px;margin:0 auto;padding:28px 20px 8px}
h1{font-size:26px;margin:0 0 4px}
h2{font-size:19px;margin:28px 0 8px}
h3{font-size:16px;margin:18px 0 6px;color:#1f2937}
p{margin:0 0 10px}
ul{margin:6px 0 14px;padding-left:22px}
li{margin:0 0 6px}
.meta{color:var(--muted);font-size:13px;margin-bottom:18px}
.divider{border:0;border-top:1px solid var(--line);margin:18px 0}
.policy-nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 22px}
.policy-nav a{font-size:13px;text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 11px;color:#374151}
.policy-nav a.active{background:var(--accent);border-color:var(--accent);color:#fff}
footer{max-width:760px;margin:24px auto 40px;padding:18px 20px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}
footer .links{line-height:2}
footer .links a{text-decoration:none}
footer .muted{margin-top:8px}
@media (max-width:520px){main{padding:20px 16px}h1{font-size:22px}}
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "styles.css"), STYLES);

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".json"));
for (const file of files) {
  const doc = JSON.parse(readFileSync(join(CONTENT_DIR, file), "utf8"));
  const v = cfg.versions[doc.id];
  const canonical = cfg.urls[doc.id];
  const body =
    `${nav(doc.id)}` +
    `<h1>${esc(doc.title)}</h1>` +
    `<p class="meta">Version ${v.version} · Last updated ${fmtDate(v.effectiveDate)}</p>` +
    doc.intro.map((p) => `<p>${esc(p)}</p>`).join("") +
    `<hr class="divider" />` +
    doc.sections.map(section).join("");
  writeFileSync(
    join(OUT_DIR, `${doc.id}.html`),
    page({
      id: doc.id,
      title: doc.title,
      description: fill(doc.summary),
      bodyHtml: body,
      canonical,
    }),
  );
}

// index
const indexBody =
  `<h1>${esc(cfg.appName)} — Legal &amp; Privacy</h1>` +
  `<p class="meta">Policies v${cfg.currentLegalVersion} · Effective ${fmtDate(cfg.effectiveDate)}</p>` +
  `<p>These are the policies that govern your use of the ${esc(cfg.appName)} app.</p>` +
  `<ul>${ORDER.map((id) => {
    const doc = JSON.parse(readFileSync(join(CONTENT_DIR, `${id}.json`), "utf8"));
    return `<li><a href="./${id}.html">${esc(doc.title)}</a> — ${esc(doc.summary)}</li>`;
  }).join("")}</ul>`;
writeFileSync(
  join(OUT_DIR, "index.html"),
  page({
    id: "index",
    title: "Legal & Privacy",
    description: `Privacy Policy, Terms and other policies for the ${cfg.appName} app.`,
    bodyHtml: indexBody,
    canonical: `${cfg.website}/legal`,
  }),
);

console.log(`Generated ${files.length + 1} pages + styles.css in ${OUT_DIR}`);

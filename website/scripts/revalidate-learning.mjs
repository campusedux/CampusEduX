#!/usr/bin/env node
// Targeted cache revalidation for Learning content changed outside the admin
// panel (SQL seeds, migrations, the mobile app). Calls POST /api/revalidate on
// the website. Configuration comes from the environment only: SITE_URL (the
// website origin) and the same revalidation value the deployment is configured
// with. That value is never accepted as an argument and never printed.
//
// Usage:
//   node scripts/revalidate-learning.mjs learning:list learning:grid:spring-boot-tutorial learning:sitemap
//   node scripts/revalidate-learning.mjs --grid spring-boot-tutorial   (= the three tags above)
//   node scripts/revalidate-learning.mjs --dry-run --grid spring-boot-tutorial
const SLUG = "[a-z0-9][a-z0-9_-]{0,99}";
const TAG = new RegExp(`^learning:(?:list|sitemap|grid:${SLUG}|topic:${SLUG}:${SLUG}|coding:${SLUG})$|^(?:practice:problem:${SLUG}|interview:category:${SLUG}|interview:topic:${SLUG}:${SLUG})$`);

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const tags = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--dry-run") continue;
  if (argv[i] === "--grid") {
    const g = (argv[++i] ?? "").toLowerCase();
    tags.push("learning:list", `learning:grid:${g}`, "learning:sitemap");
  } else tags.push(argv[i]);
}
const unique = [...new Set(tags)];

const fail = (m) => {
  console.error(m);
  process.exit(1);
};
if (unique.length === 0) fail("Usage: revalidate-learning.mjs [--dry-run] [--grid <slug>] [tag ...]");
const bad = unique.filter((t) => !TAG.test(t));
if (bad.length) fail(`Refusing invalid tag(s): ${bad.join(", ")}`);

const site = (process.env.SITE_URL ?? "").replace(/\/+$/, "");
const shared = process.env.REVALIDATE_SECRET;
if (!/^https?:\/\//.test(site)) fail("SITE_URL must be set to the website origin (http/https).");
if (!shared && !dryRun) fail("The revalidation env var must be set.");

console.log(`POST ${site}/api/revalidate tags=${unique.join(",")}`);
if (dryRun) process.exit(0);

const headers = {
  "content-type": "application/json",
  "x-revalidate-secret": shared,
};
const res = await fetch(`${site}/api/revalidate`, {
  method: "POST",
  headers,
  body: JSON.stringify({ tags: unique }),
}).catch((e) => fail(`Request failed: ${e.message}`));
const text = await res.text();
console.log(`HTTP ${res.status} ${text}`);
if (!res.ok) process.exit(1);
try {
  const done = JSON.parse(text).tags ?? [];
  const missed = unique.filter((t) => !done.includes(t));
  if (missed.length) fail(`Server did not accept: ${missed.join(", ")}`);
} catch {
  fail("Unexpected response body.");
}

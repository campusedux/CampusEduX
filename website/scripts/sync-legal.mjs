#!/usr/bin/env node
/**
 * Copies the CANONICAL legal content from the mobile app into the website so
 * both render byte-identical policy text (spec: "one consistent legal system").
 *
 *   mobile-app/src/legal/legal.config.json   ->  website/src/legal/legal.config.json
 *   mobile-app/src/legal/content/<id>.json   ->  website/src/legal/content/<id>.json   (9 shared docs)
 *
 * The mobile copy is the single source of truth. To change a policy: edit the
 * file under mobile-app/src/legal/, bump its version in legal.config.json, then
 * run `npm run legal:sync` here. `src/legal/__tests__/legal-consistency.test.ts`
 * fails if the two ever drift.
 *
 * Website-only documents (cookie-policy.json) are authored directly in
 * website/src/legal/content/ and are NOT touched by this script.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEBSITE_ROOT = resolve(HERE, "..");
const MOBILE_LEGAL = resolve(WEBSITE_ROOT, "..", "mobile-app", "src", "legal");
const WEBSITE_LEGAL = join(WEBSITE_ROOT, "src", "legal");

/** The 9 canonical documents shared with the mobile app. Website-only docs
 *  (e.g. cookie-policy) are deliberately absent so the sync never clobbers them. */
const SHARED_DOC_IDS = [
  "privacy-policy",
  "terms",
  "refund-policy",
  "project-license",
  "community-guidelines",
  "disclaimer",
  "data-and-permissions",
  "contact",
  "delete-account",
];

if (!existsSync(MOBILE_LEGAL)) {
  console.error(`Cannot find the mobile canonical source at:\n  ${MOBILE_LEGAL}\n`);
  console.error("This script must run from a full checkout that also contains mobile-app/.");
  process.exit(1);
}

let copied = 0;

// legal.config.json — copied verbatim (owner facts + rules + versions + urls).
{
  const src = join(MOBILE_LEGAL, "legal.config.json");
  const dst = join(WEBSITE_LEGAL, "legal.config.json");
  const raw = readFileSync(src, "utf8");
  JSON.parse(raw); // fail loudly on malformed source
  writeFileSync(dst, raw);
  copied++;
  console.log("synced  legal.config.json");
}

// The 9 shared document bodies.
const available = new Set(
  readdirSync(join(MOBILE_LEGAL, "content")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")),
);
for (const id of SHARED_DOC_IDS) {
  if (!available.has(id)) {
    console.error(`Expected canonical doc "${id}.json" is missing from mobile-app/src/legal/content/`);
    process.exit(1);
  }
  const raw = readFileSync(join(MOBILE_LEGAL, "content", `${id}.json`), "utf8");
  JSON.parse(raw);
  writeFileSync(join(WEBSITE_LEGAL, "content", `${id}.json`), raw);
  copied++;
  console.log(`synced  content/${id}.json`);
}

// Flag any canonical doc the mobile app added that the website doesn't know about.
for (const id of available) {
  if (!SHARED_DOC_IDS.includes(id)) {
    console.warn(
      `\n! mobile-app has an extra canonical doc "${id}" not in this script's SHARED_DOC_IDS.\n` +
        `  Add it here + to src/legal/registry.ts + a route under src/app/ if it should appear on the website.`,
    );
  }
}

console.log(`\nDone — ${copied} file(s) synced from mobile-app/src/legal/.`);

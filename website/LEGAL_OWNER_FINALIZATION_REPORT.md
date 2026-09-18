# Legal Owner Information Finalization Report

**Date:** 2026-09-18
**Scope:** Fill the three previously bracketed owner-input placeholders (`[GOVERNING CITY, STATE]`, `[REGISTERED BUSINESS ADDRESS]`, `[GRIEVANCE OFFICER NAME]`) with the owner-verified values below, across the shared legal configuration and every legal page that renders them. No other system touched.

---

## Owner information

```text
Operator:
Ganesh Pache

Entity:
Individual / Individual Operator

Address:
Kharadi, Pune, Pune, Maharashtra 411014, India

Grievance Officer:
Mukund P.

Designation:
Customer Support Manager

Grievance Email:
studyfact8545@gmail.com

Public Contact:
campusedux@gmail.com

Governing Jurisdiction:
Pune, Maharashtra

Phone:
Not provided / not rendered
```

## How the values map onto the existing config fields

The canonical config (`mobile-app/src/legal/legal.config.json`, synced verbatim to `website/src/legal/legal.config.json` via `npm run legal:sync`) has no separate "operator name" or "grievance officer designation" field. Rather than adding new fields, the existing fields were filled using their established meaning:

| Config field | New value |
|---|---|
| `entityDescription` | `Ganesh Pache, an individual trading as "CampusEduX" in India` |
| `governingCityState` | `Pune, Maharashtra` |
| `registeredAddress` | `Kharadi, Pune, Pune, Maharashtra 411014, India` |
| `grievanceOfficerName` | `Mukund P. (Customer Support Manager)` — designation folded into the one existing name field, since every template renders it as a single line (`Grievance Officer: {{grievanceOfficerName}}, {{grievanceEmail}}`) |
| `grievanceEmail` | `studyfact8545@gmail.com` |
| `supportEmail`, `legalEmail`, `privacyEmail` | `campusedux@gmail.com` (user confirmed: all three non-grievance contact channels collapse to the single public contact address, since only one general-purpose inbox exists right now) |

`companyName` (`CampusEduX`) and `appName` were left unchanged — they are the product/trading name, not the operator identity.

No `grievancePhone` field was added and none is rendered anywhere.

## Files changed

- `mobile-app/src/legal/legal.config.json` — canonical source: owner fields filled in; `versions.terms` and `versions.contact` bumped 1.0.0→1.1.0 / effectiveDate→2026-09-18 (their rendered content changed — jurisdiction, grievance officer, address, entity description now appear where they were previously bracketed).
- `website/src/legal/legal.config.json` — re-synced from the canonical source via `npm run legal:sync` (byte-identical, confirmed by diff).
- `website/src/legal/config.ts` — `WEB_ONLY_VERSIONS.grievance` bumped 1.0.0→1.1.0 / 2026-09-18 (same reason — the grievance page is website-only and its version isn't in the synced JSON); stale doc comment describing the placeholders as "intentionally left bracketed" updated to reflect that owner facts are now filled in.
- `website/tests/legal/consistency.test.ts` — the test that previously asserted the three fields **must stay bracketed** (`toContain("[")`) was inverted and expanded: it now asserts no bracketed placeholder remains (in the raw config and in every rendered document), asserts each owner fact matches the verified value, and asserts no grievance phone is configured or rendered.

No page component, content JSON body, or route file needed direct edits — every legal page already consumes these three fields exclusively through `{{token}}` interpolation from the shared config, so filling the config resolved all of them at once.

`privacy-policy`, `data-and-permissions`, and `cookie-policy` were already bumped to 1.1.0/2026-09-18 by an earlier, unrelated same-day change (the AdSense-readiness remediation, commit `6606e16`). Their content also references `registeredAddress`/`grievanceOfficerName`, which now render correctly, but since they're already dated today no further version bump was made. `refund-policy`, `project-license`, `community-guidelines`, `disclaimer`, `delete-account` reference neither field, so their versions are untouched.

## Legal pages — verification

| Page | Placeholders gone | Owner data renders | Notes |
|---|---|---|---|
| Privacy Policy | ✅ | ✅ Operator, registered address, Grievance Officer + email | Section 14 |
| Terms | ✅ | ✅ Governing jurisdiction, Grievance Officer, operator, address | Sections 24–25; version bumped |
| Cookie Policy | ✅ | ✅ Grievance Officer + email | Section 9; website-only |
| Contact | ✅ | ✅ Grievance Officer, operator, registered address | Version bumped |
| Grievance | ✅ | ✅ Name, email, postal address (section 2) | Hand-composed page, website-only; version bumped |
| Legal Hub | ✅ (no owner fields rendered directly) | — | Index page only |

## Placeholder scan

Scanned the full rendered output of all six routes (`curl` against a local production build) plus every legal content JSON and the interpolated output of all 10 documents:

```text
[REGISTERED BUSINESS ADDRESS]  → 0 occurrences (source + rendered)
[GRIEVANCE OFFICER NAME]       → 0 occurrences (source + rendered)
[GOVERNING CITY, STATE]        → 0 occurrences (source + rendered)
{{token}}                      → 0 unresolved interpolation tokens
```

## Configuration consistency

`diff website/src/legal/legal.config.json mobile-app/src/legal/legal.config.json` → **identical**. The website copy was regenerated via the existing `npm run legal:sync` script (mobile app is the single source of truth); no third legal source was created.

## Entity language

`entityDescription` reads `"Ganesh Pache, an individual trading as \"CampusEduX\" in India"` — no "Pvt Ltd", "LLP", "registered company", "incorporated entity" or similar language was introduced anywhere.

## Tests

```text
TypeScript (website):  clean (npx tsc --noEmit)
TypeScript (mobile):   clean (npx tsc --noEmit) — sanity check; mobile consumes the same JSON
ESLint (website):      clean (npm run lint -- --max-warnings=0)
Vitest (website):      525 passed, 12 skipped, 0 failed (tests/legal/consistency.test.ts: 13/13 passed)
Build (website):       succeeded (npm run build)
```

The one test that referenced the old placeholder behavior (`tests/legal/consistency.test.ts` → *"keeps jurisdiction / address / grievance officer bracketed until the owner fills them"*) was legitimately stale — the owner has now supplied the values — so it was replaced with assertions that the placeholders are gone and the verified values render, rather than deleted or weakened.

## Local route verification

Production build served locally (`npm run start`) and all six routes checked:

```text
/privacy-policy  → 200, owner data renders, no placeholders
/terms           → 200, owner data renders, no placeholders
/cookie-policy   → 200, owner data renders, no placeholders
/contact         → 200, owner data renders, no placeholders
/grievance       → 200, owner data renders, no placeholders
/legal           → 200, hub page, no placeholders
```

Navigation, canonical URLs, and metadata (`composedLegalMetadata`, `LEGAL_VERSIONS`) were not touched beyond the version-number bumps noted above.

## Phone

No grievance phone number was provided and none was invented or rendered. A phone-digit scan of all six rendered pages found exactly one 10-digit number, `+91 9370764290` — the pre-existing WhatsApp Support channel (`src/lib/whatsapp.ts`, unrelated prior work), which appears only in a separate "Chat on WhatsApp" section that explicitly directs formal grievances to the Grievance Officer's email instead. No phone number appears anywhere in the Grievance Officer section of any document, and `grievancePhone` is not a config field.

## Provenance

Stage 4A provenance findings remain unchanged. `website/CONTENT_PROVENANCE_AUDIT.md` was not modified (confirmed via `git status`).

## Deployment

This task does not deploy to production. No migration was applied, nothing was pushed, and no production Supabase state was touched. All changes are local and uncommitted.

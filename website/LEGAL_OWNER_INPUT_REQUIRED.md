# CampusEduX — Legal Owner-Input Required

Date: 2026-09-18
Stage: 4A (Legal Accuracy + Content Provenance Remediation)

## Why this file exists

Three legal-configuration fields cannot be filled in because the real values do not exist anywhere in this repository — not in `website/`, not in `mobile-app/`, not in `admin-panel/`, not in any committed history. Per this stage's explicit instruction, **no value was invented, guessed, or inferred** (not the developer's address, not a Maharashtra/Pune/Solapur/Sambhajinagar guess, not "CampusEduX Team" as a grievance officer, not any entity name inferred from the domain).

The three fields are intentionally left as bracketed tokens in the canonical source file so they are impossible to miss:

`mobile-app/src/legal/legal.config.json` (canonical — the website's copy at `website/src/legal/legal.config.json` is byte-identical and synced from this one via `npm run legal:sync`; both currently hold the same bracketed placeholders).

```json
"governingCityState": "[GOVERNING CITY, STATE]",
"registeredAddress": "[REGISTERED BUSINESS ADDRESS]",
"grievanceOfficerName": "[GRIEVANCE OFFICER NAME]",
```

`website/src/legal/config.ts` documents the same intent in a code comment (lines 10–13): these tokens are "intentionally left bracketed... until the owner supplies real values. Never fabricate them."

Existing tests (`website/tests/legal/consistency.test.ts`, `mobile-app/tests/unit/legal/content.test.ts`) already assert this exact behavior — that these three tokens render as visible bracketed placeholders rather than being silently blank — so no test changes were made in this stage. When real values are supplied, those specific assertions (not the whole test file) will need to flip to "no bracket tokens remain / values are non-empty," per Part J of the brief.

---

## Fields required from the site owner

### 1. `registeredAddress`

**What it is**: the real address CampusEduX is legally permitted to publish as its operating/business address.

**Where it renders**: Privacy Policy (`/privacy-policy`), Terms & Conditions (`/terms`), Grievance page (`/grievance`), Contact page (`/contact` — "Operator details" section) on both the website and the mobile app.

**Why it's required**: India's IT Rules / consumer-protection disclosure norms and standard SaaS privacy-policy practice both expect a genuine contactable address for the entity operating the service. It is also a factual claim — CampusEduX cannot state an address it doesn't actually have or isn't authorized to publish.

**Exact format expected**: a plain postal address string, e.g. `"123 Example Street, Some Area, City – 400001, Maharashtra, India"`. If the entity is genuinely an individual operating under an unregistered trading name (as `entityDescription` in `legal.config.json` already states — *"an individual operating under the unregistered trading name 'CampusEduX' in India"*), this would be that individual's registered/contactable address — not a fabricated company address. If the owner does not wish to publish a home address, a registered business address, virtual office, or registered-agent address the owner is legally entitled to use is an option to consider, but that decision belongs to the owner, not this audit.

### 2. `grievanceOfficerName`

**What it is**: the real name of the person designated as Grievance Officer, if the site has one.

**Where it renders**: Grievance page (`/grievance`), Privacy Policy, Terms & Conditions, Contact page — anywhere the config's `grievanceOfficerName` token is interpolated.

**Why it's required**: India's IT (Intermediary Guidelines) Rules require a named Grievance Officer for platforms handling user data/complaints at a certain scale; even where not strictly mandatory, naming a real accountable person (rather than a generic "Team") is what makes a grievance mechanism substantively meaningful rather than decorative. The repo's existing `grievanceEmail` (`grievance@campusedux.app`) already exists and does not need to change — this field is specifically the *named individual*, not the inbox.

**Exact format expected**: a real full name, e.g. `"Jane Doe"`. If no individual has been formally designated yet, the correct owner action is to designate one (even if that's the site owner themselves) and provide that name — not to substitute a team/brand name, which the brief explicitly disallows.

### 3. `governingCityState`

**What it is**: the actual city/state whose law and courts govern the Terms & Conditions (the jurisdiction clause).

**Where it renders**: Terms & Conditions (`/terms`), and any other document with a jurisdiction/governing-law clause driven by this token.

**Why it's required**: A governing-law clause is a binding legal statement — it must name the jurisdiction the owner actually intends to submit disputes to (typically tied to where the business/individual is genuinely based or registered), not a plausible-sounding placeholder city.

**Exact format expected**: `"<City>, <State>"`, e.g. `"Pune, Maharashtra"` — but only if that is factually where the owner intends this clause to point. This audit will not guess Pune, Solapur, Sambhajinagar, or any other Maharashtra city, per the brief's explicit rule.

---

## What happens once these are supplied

1. Update the three fields in `mobile-app/src/legal/legal.config.json` (the canonical source).
2. Run `npm run legal:sync` from `website/` to propagate the byte-identical copy to `website/src/legal/legal.config.json`.
3. Bump `currentLegalVersion` and the relevant per-document `versions.<doc>.version`/`effectiveDate` entries in the same file, consistent with how prior legal-content changes in this repo have been versioned (see the `versions` block already in the file).
4. Update the two specific test assertions noted above (the ones currently asserting brackets are visible) to instead assert the fields are non-empty and free of literal bracket/placeholder tokens — without weakening the rest of the legal test suite.
5. Re-render and spot-check `/privacy-policy`, `/terms`, `/contact`, and `/grievance` to confirm no bracketed token remains.

No other legal-content wording needs to change as a result of supplying these three facts — they are pure data substitutions into already-correct document structure.

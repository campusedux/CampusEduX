# CampusEduX P0-02 staging verification and live inventory

**Date:** 23 October 2026 UTC  
**Result:** Staging verification blocked; live inventory blocked. P0-02 remains open. No migration, deployment, database write, publication change, payment change, or deletion was performed.

## Environment identity and isolation

| Evidence | Finding | Limit |
|---|---|---|
| `mobile-app/.env`, `admin-panel/.env.local`, `website/.env.local` (hostnames only inspected) | All three local app configurations point to `oqwjooaapsotnncmhvtk.supabase.co`. They contain public/anonymous keys, not an authenticated inventory role. | Local files do not prove the current deployed release configuration. |
| Each app's `supabase/.temp/linked-project.json` | All three Supabase CLI links have project ref `oqwjooaapsotnncmhvtk`, named `campusedux Project`. | This is the only linked remote project found; the name alone does not establish its environment. |
| `admin-panel/supabase/README.md` | The admin panel is explicitly designed to use the same project as the mobile app. | This supports treating the linked ref as the shared application backend, not as isolated staging. |
| `mobile-app/supabase/config.toml`, `mobile-app/eas.json`, deployment docs | CLI config has local `project_id = "campusedux"`; EAS has development, preview, and production build environments. Deployment instructions link the Supabase ref from the mobile URL and use `supabase db push`. | A preview build profile is not evidence of a distinct backend. Remote EAS variable values, deployment targets, database credentials, storage buckets, and Auth tenants were not available. |

**Production identification:** `oqwjooaapsotnncmhvtk` is the only configured shared application project and the presumed production target for this workspace. Its production designation needs confirmation from the deployed app settings or project owner before any operational action. **No isolated staging project was identified.** Separate staging credentials, database, Storage, and test users could not be confirmed. The existing CLI links must be treated as unsafe for staging migration commands.

## Migration dependencies and staging tests

Static inspection finds that `0148_content_provenance.sql` depends on `auth.users`, `public.admin_users` with active `super_admin` roles, `public.is_admin(uuid)`, `pgcrypto.digest`, and the existing learning, interview, test, question, and DSA tables/columns. Their definitions appear in earlier mobile and admin migrations. Mobile `0148` and admin `118` are byte-identical (SHA-256 `0467fca8264325977e25ef9657e56358cb451f30cb27f7a7e9eafb8dc40aa6ad`). This establishes repository order only. Applied migration history, existing triggers and policies, seed rerun behavior, and actual schema compatibility remain unverified on a remote database.

The SQL inserts `enforcement_enabled=false` by default, does not update existing content rows, and guards later publication when enabled. The admin content form defaults a **new** block to `draft`; the database `learning_contents` default remains `published`, so other writers must be tested. The review action checks `super_admin`, and RLS/trigger checks are present in the migration. These are code observations, not staging outcomes.

| Required staging check | Result |
|---|---|
| Apply `0148` after baseline and compatibility checks | **Not run:** no independently identified and isolated staging project. |
| Legacy content visible with enforcement disabled | **Not run:** no staging data or deployed route. |
| Authorized review and unauthorized denial | **Not run:** no staging super-admin/editor/anonymous test identities. |
| New content defaults to draft across writers | **Not run:** only admin form default confirmed statically. |
| Verified, unverified, and blocked publication | **Not run in staging.** Prior remediation reports passing isolated PostgreSQL fixture assertions; these do not establish Supabase integration behavior. |
| Enable enforcement and roll it back | **Not run:** staging identity and baseline absent. |
| Purchases, progress, links, attachments, routes | **Not run:** no isolated staging baseline or integration access. |

**Deployment stop:** Do not apply mobile `0148` or admin `118` through either currently linked CLI directory. To proceed, an operator must provide a separately identified staging project ref and demonstrate distinct database, Storage, Auth users, and credentials, plus its migration history and a safe baseline. Confirm every test command targets that ref before migration. No production migration is authorized by this report.

## Read-only live inventory attempt

Using the configured public URL and anonymous key, a GET-only PostgREST request selected only `id,slug` from the four learning-grid headers, with a four-row limit. It failed **before HTTP** with `URLError <urlopen error [Errno -3] Temporary failure in name resolution>` for `oqwjooaapsotnncmhvtk.supabase.co`. A separate DNS lookup returned `gaierror [Errno -3] Temporary failure in name resolution`. **Zero live records were obtained.** No student data or secrets were printed. An anonymous key would also be insufficient for a complete archived/unpublished inventory under RLS, even if DNS worked.

The following are **seed-intended counts only**, carried from the rights investigation and remediation; none is asserted as live:

| Family | Seed/source mapping | Live count/status |
|---|---|---|
| AI/ML Notes | `0068`: 77 lesson bodies, 690 MCQs, 196 linked prompts; transcribed source manuscript | Unknown |
| Generative AI | `0069`: 207 bodies, 2,060 MCQs, 336 prompts; transcribed source manuscript | Unknown |
| Java interviews | `0104`–`0108`: 121 public-intended source-guide Q&A rows across 24 topics, 139 archived-intended rows | Unknown |
| Python interviews | `0109`–`0112`: 240 source-guide Q&A rows across 22 topics | Unknown |
| Java tutorial | `0047`: 150 baseline bodies; `0145`/`0146`: 40 individually mapped rewrite candidates; 39 rewrite quizzes/practice blocks | Unknown, including which body version is live |
| Python tutorial | `0050`–`0055`: 30 chapters, 290 MCQs, 98 linked problems | Unknown |

All **40 Java rewrite candidates** remain mapped individually by source ref, batch, file, and URL in `CAMPUSEDUX_P0_02_VERIFICATION.md`; none was matched to a live row or live body hash here. The read-only query in `mobile-app/supabase/checks/p002_content_inventory.sql` is prepared but was not executed. A complete authorized export must compare exact IDs, source refs, hashes, migration application (`0145`/`0146`), statuses and visibility flags, attachments/Storage references, and public URLs with the seed crosswalk. It must also check purchase/entitlement and progress references without disclosing student records in this report. Broad grid/category membership alone is not a withholding predicate.

**Operator action for live inventory:** restore DNS/network access to the configured project and provide an approved authenticated **read-only** connection or export with visibility into draft/archived rows and migration history. Confirm the project is the deployed production backend. Run only SELECT/GET queries; redact student identifiers and secrets before sharing results. No production content or provenance status may be changed for inventory.

## Rights evidence gaps and owner decisions

No item is marked verified on the evidence available. AI involvement describes a creation method; it does not establish originality, ownership, or permission.

| Material | Evidence still needed |
|---|---|
| AI/ML Notes and Generative AI | The exact `AI_ML_Complete_All_10_Modules.md` and `Generative_AI_Full_Syllabus_Detailed_Notes.md` source versions, authors/publishers, dates, source-to-row crosswalk, and ownership assignment or license/permission covering web, mobile, modifications, commercial display, and attribution conditions. |
| Java and Python interview banks | Both named Interview Master Guides, source owners, grants/assignments, row-level matching (especially Java reconciliation's exact/reworked mix), and permission covering Q&A, examples, explanations, and public use. |
| Java baseline and Python tutorial | `core-java-full-course.md`, all 30 original Python chapter manuscripts, creator and contributor records, source-to-row mapping, and rights for prose, code, MCQs, explanations, and adapted problems. |
| Each of the 40 Java rewrites | Individual creator/contributor and assignment records, sources/references used, rights in code, quizzes, practice material and lesson text, and live body-hash confirmation before retention clearance. |

The owner must make an explicit withholding decision for the **actual live** source-transcribed/source-guide items in AI/ML Notes, Generative AI, and both interview banks if rights cannot be evidenced promptly. The decision needs exact live IDs and dependent content, public URL and paid-access impact, and a preservation/rollback plan. No withholding list can be finalized from seed counts alone. Java/Python tutorial source-derived components also require rights decisions after their live mapping is established.

## Remaining blockers and safe next actions

1. **Staging identity/isolation:** obtain a separate project ref and proof of distinct database, Storage, credentials, and test users; inspect its migration history and baseline before applying one of the paired migrations. Exercise all staging checks above, including every content writer and purchase/progress preservation.
2. **Live connectivity and permissions:** fix the observed DNS failure and provide approved read-only access. Confirm deployed production identity, then export the six families and 40 Java candidates with exact source/seed comparisons, hashes, publication flags, attachments, and migration history.
3. **Rights:** collect the manuscripts, creator/assignment records, license or permission instruments and usage conditions; record reviewer decisions per item. Keep every unresolved item `unverified` and obtain the owner's exact-row withholding decision where needed.

**Status:** staging verified **no**; production inventory established **no**; rights verified **no**; P0-02 closed **no**. P0-03 was not started.

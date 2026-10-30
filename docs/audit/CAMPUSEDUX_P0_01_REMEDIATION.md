# CampusEduX P0-01 academic-integrity remediation

**Date:** 23 October 2026 (UTC)  
**Scope:** P0-01 only. Repository implementation and read-only review; no deployment, production migration, payment-setting change, order deletion, or production-row edit.

## Outcome

New `academic` custom-project requests are scoped to mentoring: code review, debugging, architecture guidance, and feedback on student-authored work. Personal and business software development, educational project examples, source-code purchases, old orders, paid access, payment history, and refund paths remain in place. New academic orders cannot select or be assigned implementation features, assessment packages, add-ons, or delivery assets. The AI scoping helper returns mentoring text and no implementation features for academic drafts. A mentoring request can be marked delivered only after substantive admin feedback in the message thread. The checkout asks whether the work is assessed and records an integrity acknowledgment; the shared Edge Function validates it before it creates a request or Razorpay order. Non-academic orders reporting assessed use are rejected and directed to mentoring.

Google's publisher-policy determination remains Google's decision. This work does not guarantee AdSense approval.

## Schema and route review before editing

- `mobile-app/supabase/migrations/0033_custom_project_builder.sql`: shared pricing and features, `custom_project_requests`, snapshots, payments, deliveries, messages, drafts, and RLS. Order creation uses the service role in `create-custom-project-order`; browser and mobile are clients of that same function.
- `mobile-app/supabase/migrations/0125_custom_project_delivery_gate.sql`: existing status transition requires a software deliverable. `0128_custom_project_value_addons_edits.sql`: owner edits and add-ons run through security-definer RPCs. `0124` and `0128` maintain balance and refund accounting.
- Website: landing and shared promos, `/custom-projects/start` → `/features` → `/estimate` → `/checkout`, order detail edits/add-ons/messages, `/projects` listing/detail/purchase, metadata, and legal JSON.
- Mobile: banner, builder type/features/estimate/payment/success/detail, service and hook that call the Edge Function, and legal JSON/HTML.
- Admin: request detail and delivery page. The direct WhatsApp consultation paths were reviewed. The former baked web artwork was removed after its component was replaced with compliant text; no source reference to the image remains.

## Exact changed files

**Policy and database**

- `mobile-app/supabase/functions/_shared/academicIntegrity.ts` (new)
- `mobile-app/supabase/functions/create-custom-project-order/index.ts`
- `mobile-app/supabase/migrations/0147_academic_mentoring_scope.sql` (new; **not applied**)

**Website**

- `website/src/app/about/page.tsx`
- `website/src/app/page.tsx`
- `website/src/app/projects/page.tsx`
- `website/src/app/projects/trending/page.tsx`
- `website/src/app/projects/category/[category]/page.tsx`
- `website/src/app/projects/[id]/ProjectPurchasePanel.tsx`
- `website/src/app/learning/[gridSlug]/[topicSlug]/_components/TopicDiscovery.tsx`
- `website/src/app/custom-projects/page.tsx`
- `website/src/app/custom-projects/features/page.tsx`
- `website/src/app/custom-projects/features/BuilderFeatures.tsx`
- `website/src/app/custom-projects/estimate/page.tsx`
- `website/src/app/custom-projects/checkout/CustomProjectCheckout.tsx`
- `website/src/app/custom-projects/my-projects/[id]/page.tsx`
- `website/src/components/CustomProjectBanner.tsx`
- `website/src/components/home/CustomProjectPromo.tsx`
- `website/src/components/home/HomeHero.tsx`
- `website/src/components/home/ModuleGrid.tsx`
- `website/src/lib/customProjects.ts`
- `website/src/lib/customProjects/aiUnderstand.ts`
- `website/public/images/custom-project-banner.webp` (removed; contained the old baked claim)
- `website/src/legal/content/project-license.json`
- `website/src/legal/content/terms.json`
- `website/src/legal/content/refund-policy.json`
- `website/src/legal/legal.config.json`
- `website/tests/lib/academicIntegrity.test.ts` (new)
- `website/tests/lib/customProjects.test.ts`

**Mobile and generated legal site**

- `mobile-app/src/components/CustomProjectBanner.tsx`
- `mobile-app/src/constants/contact.ts`
- `mobile-app/src/customProjects/BuilderTypeScreen.tsx`
- `mobile-app/src/customProjects/BuilderLevelScreen.tsx`
- `mobile-app/src/customProjects/BuilderFeaturesScreen.tsx`
- `mobile-app/src/customProjects/BuilderEstimateScreen.tsx`
- `mobile-app/src/customProjects/BuilderPaymentScreen.tsx`
- `mobile-app/src/customProjects/SubmitSuccessScreen.tsx`
- `mobile-app/src/customProjects/CustomProjectDetailScreen.tsx`
- `mobile-app/src/customProjects/components/builderCopy.ts`
- `mobile-app/src/customProjects/useBuilderEstimate.ts`
- `mobile-app/src/hooks/useCustomProjects.ts`
- `mobile-app/src/services/customProjects.service.ts`
- `mobile-app/src/types/customProject.types.ts`
- `mobile-app/src/types/navigation.types.ts`
- `mobile-app/src/legal/content/project-license.json`
- `mobile-app/src/legal/content/terms.json`
- `mobile-app/src/legal/content/refund-policy.json`
- `mobile-app/src/legal/legal.config.json`
- `mobile-app/legal-site/project-license.html`
- `mobile-app/legal-site/terms.html`
- `mobile-app/legal-site/refund-policy.html`
- `mobile-app/tests/integration/customProjects/token-payment-flow.test.ts`
- `mobile-app/tests/unit/components/CustomProjectBanner.test.tsx`
- `mobile-app/tests/unit/customProjects/BuilderFeaturesEstimate.test.tsx`
- `mobile-app/tests/unit/customProjects/BuilderTypeScreen.test.tsx`
- `mobile-app/tests/unit/services/customProjects.service.test.ts`
- `mobile-app/tests/unit/services/customProjectsServerParity.test.ts`

**Admin**

- `admin-panel/src/app/(panel)/custom-projects/[id]/page.tsx`
- `admin-panel/src/app/(panel)/custom-projects/[id]/delivery/page.tsx`

Existing unrelated user changes, including `CLAUDE.md`, `website/next.config.js`, audit drafts, and `ads.txt`, were left untouched.

## Marketplace live-content review

The public `projects` table contains `id`, `title`, `description`, and `license` fields that feed cards, metadata, detail pages, and purchase paths (`0003_projects.sql`; website `/projects/[id]`). The schema has no academic-integrity publication flag. No repository migration with seeded `projects` rows was found. The configured public Supabase REST catalog was queried read-only twice, once with normal sandbox networking and once with approved network escalation. Both attempts failed at DNS resolution (`Temporary failure in name resolution`). **No live row count or risky live listing list can be verified from this environment.** No production record was changed.

Run this read-only inventory in the authorized production SQL console, export results for editorial review, and inspect every title/description/license and linked file—not only regex matches:

```sql
select id, title, license, description
from public.projects
where concat_ws(' ', title, license, description) ~* '(ready[ -]to[ -]submit|final[ -]year|mini[ -]project|academic submission|assignment|viva|project report|thesis|dissertation|built for you)'
order by id;
```

The live review must also include currently public CMS banners, seller uploads, and existing project files. Keep questionable listings out of promotions and any future ad inventory pending human review. This report does not assert that any particular live row is compliant or noncompliant.

## Tests and build results

- Website: typecheck and lint pass; production build passes. Final focused integrity, pricing, and legal-consistency tests: **57/57 pass**.
- Mobile: typecheck passes; lint exits successfully with two pre-existing duplicate-import warnings in `tests/unit/theme/darkContrast.test.ts`. Full Jest suite after updates: **96 suites, 832 tests pass** (`--runInBand --forceExit --silent`).
- Admin: typecheck, lint, and production build pass.
- Full website suite: **79 files pass, 1 skipped, 4 fail; 888 tests pass, 12 skipped, 8 fail**. Failures are in `sitemap.test.ts` and `perf-cache.test.ts`, outside P0-01 paths and unchanged by this work. They were not altered under this P0-only scope.
- `git diff --check` passes. The SQL migration was not executed; database triggers and live payment flows remain unverified.

## Remaining risks and manual verification

1. **Legal review:** The revised license preserves terms accepted at earlier purchases and prohibits misrepresenting *new* purchases as self-authored assessed work. Counsel should verify which license version and category were actually recorded for earlier purchases, and confirm the amended terms/refund wording and effective dates. Do not retroactively narrow a paid customer's rights by presentation alone.
2. **Coordinated rollout:** The new Edge Function needs migration `0147` columns, and the migration rejects old order payloads. A reviewed maintenance window or equivalent coordinated release is required. Apply the migration in staging first; deploy the Edge Function and updated web/admin/mobile clients together. Old installed mobile clients lack the new assessment answers and will be rejected until updated; use the existing mobile update mechanism or a supported compatibility plan. No production rollout was performed here.
3. **Human review:** Wording filters can miss paraphrases or misclassify innocent text. Staff must inspect mentoring requests, attachments, messages, WhatsApp consultations, and proposed feedback before acceptance or delivery. The database blocks new mentoring add-ons and delivery records, but free-text messages and off-platform chats still require staff controls.
4. **Marketplace:** Complete the live inventory above, review seller-provided descriptions/files, and establish publication moderation before claiming the public catalog is clean. Source-code examples remain available for study; customers must not be encouraged to submit purchased material as their own assessed work.
5. **Staging checks:** Verify fresh mentoring orders with `assessment_use=yes` and `no`; rejected implementation package, forged feature ID, missing acknowledgment, nonacademic assessment attempt, edits/add-ons, and direct RPC calls; successful personal/business orders; Razorpay sandbox checkout; refund and balance accounting; old paid order access and legacy delivery; status completion after substantive mentor feedback; web/mobile text, metadata, generated legal pages, and WhatsApp text. The new SQL status function should be regression-tested against the previous software-delivery gate before production use.

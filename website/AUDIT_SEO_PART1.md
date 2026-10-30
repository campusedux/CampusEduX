# CampusEduX per-page SEO audit — Part 1

**Date:** 15 October 2026 (UTC). **Scope:** `website/` only. Fresh source inspection; no prior audit findings reused. Only this report file was created. No code, database, deployment, or commit changes.

## Coverage map

**Files read: 81 of 81 `page.tsx` files; 116 of 116 route-related files.** The latter count comprises 81 pages, 27 `route.ts` handlers, 3 layouts, and 5 supporting files (loading, error, not-found, robots, middleware). The page import graph was read through 377 distinct local source files, plus two dynamic-import targets (`src/components/resumeBuilder/TemplatePreviewModal.tsx` and `src/app/compiler/CodeEditor.tsx`). The direct image/heading audit traversed the rendered component imports, including `src/components/ui/PageHeader.tsx:25-32`, `src/components/home/HomeHero.tsx:36`, `src/app/learning/_components/CourseHero.tsx:92`, and `src/legal/LegalPageShell.tsx:33`. **NOT AUDITED among page files: none.** The 19 API/auth handlers were read for route classification, not audited for application security.

The visible HTML of the [live homepage](https://www.campusedux.com/) was fetchable. Live XML/robots endpoints were not accessible through the browsing tool, so sitemap counts and actual Google index status are **unverified**. Dynamic title lengths, H1 branch counts, database content, live canonicals, and rendering modes are source-derived where possible and explicitly marked otherwise. No Search Console or production database was accessed.

### Complete route-related file inventory (116)

```text
src/app/about/page.tsx
src/app/account/applications/page.tsx
src/app/account/layout.tsx
src/app/account/notifications/page.tsx
src/app/account/page.tsx
src/app/account/profile/page.tsx
src/app/account/purchases/page.tsx
src/app/account/referral/page.tsx
src/app/account/resume/[id]/ats/page.tsx
src/app/account/resume/[id]/edit/page.tsx
src/app/account/resume/[id]/jd-match/page.tsx
src/app/account/resume/[id]/layout.tsx
src/app/account/resume/[id]/preview/page.tsx
src/app/account/resume/[id]/projects/page.tsx
src/app/account/resume/[id]/versions/page.tsx
src/app/account/resume/import/page.tsx
src/app/account/resume/page.tsx
src/app/account/saved-jobs/page.tsx
src/app/account/saved-projects/page.tsx
src/app/account/wallet/page.tsx
src/app/api/announcements/route.ts
src/app/api/auth/verify-email/route.ts
src/app/api/auth/verify-recovery/route.ts
src/app/api/coding-problems/judge/route.ts
src/app/api/coding-problems/submit/route.ts
src/app/api/compiler/run/route.ts
src/app/api/custom-projects/understand/route.ts
src/app/api/learning/progress/route.ts
src/app/api/practice/judge/route.ts
src/app/api/practice/submit/route.ts
src/app/api/problems/solution/route.ts
src/app/api/resume/assist/route.ts
src/app/api/resume/export/docx/route.ts
src/app/api/resume/export/pdf/route.ts
src/app/api/resume/parse/route.ts
src/app/api/revalidate/route.ts
src/app/api/search/route.ts
src/app/api/session/route.ts
src/app/auth/callback/route.ts
src/app/auth/confirm/page.tsx
src/app/blog/[slug]/page.tsx
src/app/blog/page.tsx
src/app/coding-problems/[problemSlug]/page.tsx
src/app/community-guidelines/page.tsx
src/app/compiler/page.tsx
src/app/contact/page.tsx
src/app/cookie-policy/page.tsx
src/app/custom-projects/checkout/page.tsx
src/app/custom-projects/estimate/page.tsx
src/app/custom-projects/features/page.tsx
src/app/custom-projects/my-projects/[id]/page.tsx
src/app/custom-projects/my-projects/page.tsx
src/app/custom-projects/page.tsx
src/app/custom-projects/start/page.tsx
src/app/data-and-permissions/page.tsx
src/app/delete-account/page.tsx
src/app/disclaimer/page.tsx
src/app/email-verified/page.tsx
src/app/error.tsx
src/app/faq/page.tsx
src/app/forgot-password/page.tsx
src/app/grievance/page.tsx
src/app/jobs/[id]/page.tsx
src/app/jobs/companies/[id]/page.tsx
src/app/jobs/companies/page.tsx
src/app/jobs/page.tsx
src/app/layout.tsx
src/app/learning/[gridSlug]/[topicSlug]/page.tsx
src/app/learning/[gridSlug]/page.tsx
src/app/learning/page.tsx
src/app/legal/page.tsx
src/app/login/page.tsx
src/app/logout/page.tsx
src/app/mock-tests/[testId]/page.tsx
src/app/mock-tests/[testId]/result/[attemptId]/page.tsx
src/app/not-found.tsx
src/app/onboarding/page.tsx
src/app/page.tsx
src/app/placement/notes/[id]/page.tsx
src/app/placement/notes/page.tsx
src/app/placement/page.tsx
src/app/practice/interview-questions/[category]/[topic]/page.tsx
src/app/practice/interview-questions/[category]/page.tsx
src/app/practice/interview-questions/page.tsx
src/app/practice/page.tsx
src/app/practice/problems/[slug]/page.tsx
src/app/practice/problems/page.tsx
src/app/practice/submissions/page.tsx
src/app/premium/page.tsx
src/app/privacy-policy/page.tsx
src/app/project-license/page.tsx
src/app/projects/[id]/page.tsx
src/app/projects/category/[category]/loading.tsx
src/app/projects/category/[category]/page.tsx
src/app/projects/page.tsx
src/app/projects/trending/page.tsx
src/app/r/[token]/page.tsx
src/app/referral/page.tsx
src/app/refund-policy/page.tsx
src/app/register/page.tsx
src/app/reset-password/page.tsx
src/app/resume/page.tsx
src/app/resume/templates/page.tsx
src/app/robots.ts
src/app/search/page.tsx
src/app/sitemap.xml/route.ts
src/app/sitemaps/blog.xml/route.ts
src/app/sitemaps/interview-questions.xml/route.ts
src/app/sitemaps/jobs.xml/route.ts
src/app/sitemaps/learning.xml/route.ts
src/app/sitemaps/problems.xml/route.ts
src/app/sitemaps/projects.xml/route.ts
src/app/sitemaps/static.xml/route.ts
src/app/support/page.tsx
src/app/terms/page.tsx
middleware.ts
```

## Route-by-route SEO table

Counts are **source text Unicode characters**, before Next title-template application. `i` = inherited root metadata from `src/app/layout.tsx:41-60` (64-character default title, 152-character description); `*` = legal JSON source before token interpolation (`src/legal/seo.ts:12-22`); `var` = database/query-dependent and cannot have one honest fixed count. A child title may gain ` | CampusEduX`; rendered length needs a crawl. `1?` = one H1 indicated through an imported component or conditional branch, not an observed live DOM count. OG/Twitter `root` means inherited, `page` means declared by the page, `legal helper` means `src/legal/seo.ts`. Every HTML page also gets Organization and WebSite JSON-LD from `src/app/layout.tsx:95-96`; table lists local types where present. `static`/`dynamic` in sitemap column refer to `src/lib/sitemap/build.ts:39-57,133-321`; `conditional` noindex depends on content or missing row. `SSR+cache` means request-rendered HTML with cached data; an exported `revalidate` does not make a `searchParams` page static. Handler routes return non-HTML and have no page metadata.

| Route | Title / description (chars) | Canonical | H1 count | OG / Twitter | JSON-LD type | In sitemap? | noindex? | SSR/SSG/ISR/CSR | Issues and source |
|---|---:|---|---:|---|---|---|---|---|---|
| `/about` | 16 / 180 | self | 1 | root / root | root Org,WebSite | static | no | SSG/SSR | `src/app/about/page.tsx:9` |
| `/account/applications` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/applications/page.tsx:1` |
| `/account/notifications` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/notifications/page.tsx:1` |
| `/account` | 64i / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/page.tsx:1` |
| `/account/profile` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/profile/page.tsx:1` |
| `/account/purchases` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/purchases/page.tsx:1` |
| `/account/referral` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/referral/page.tsx:1` |
| `/account/resume/[id]/ats` | 64i / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/resume/[id]/ats/page.tsx:1` |
| `/account/resume/[id]/edit` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/resume/[id]/edit/page.tsx:1` |
| `/account/resume/[id]/jd-match` | 64i / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/resume/[id]/jd-match/page.tsx:1` |
| `/account/resume/[id]/preview` | 14 / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/resume/[id]/preview/page.tsx:14` |
| `/account/resume/[id]/projects` | 64i / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/resume/[id]/projects/page.tsx:1` |
| `/account/resume/[id]/versions` | 64i / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/resume/[id]/versions/page.tsx:1` |
| `/account/resume/import` | 64i / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/resume/import/page.tsx:1` |
| `/account/resume` | — / — | redirect | 0 | — / — | — | — | n/a | redirect | `src/app/account/resume/page.tsx:5` |
| `/account/saved-jobs` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/saved-jobs/page.tsx:1` |
| `/account/saved-projects` | 14 / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/saved-projects/page.tsx:10` |
| `/account/wallet` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/account/wallet/page.tsx:1` |
| `/auth/confirm` | 64i / 152i | — | 1 per state | root / root | root Org,WebSite | — | not set; robots disallow | CSR flow | `src/app/auth/confirm/page.tsx:1; inherited metadata` |
| `/blog/[slug]` | var / var | self | 1 | page / page | Article,FAQPage?,BreadcrumbList | dynamic | conditional | ISR 1800 | `src/app/blog/[slug]/page.tsx:42` |
| `/blog` | 39 / 159 | self | 1? | page / page | root Org,WebSite + local | dynamic | no | SSR+cache | `src/app/blog/page.tsx:27` |
| `/coding-problems/[problemSlug]` | var / var | self | 1? | page / page | root Org,WebSite + local | dynamic | conditional | ISR 86400 | `src/app/coding-problems/[problemSlug]/page.tsx:21; thin noindex` |
| `/community-guidelines` | 20* / 63* | self | 1? | legal helper / root | root Org,WebSite | static | no | SSG/SSR | `src/app/community-guidelines/page.tsx:4` |
| `/compiler` | 20 / 150 | self | 1 | page / page | WebApplication,BreadcrumbList | static | no | SSR shell + client | `src/app/compiler/page.tsx:9` |
| `/contact` | 10* / 72* | self | 1? | legal helper / root | root Org,WebSite | static | no | SSG/SSR | `src/app/contact/page.tsx:11` |
| `/cookie-policy` | 13* / 67* | self | 1? | legal helper / root | root Org,WebSite | — | no | SSG/SSR | `src/app/cookie-policy/page.tsx:4` |
| `/custom-projects/checkout` | 22 / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/custom-projects/checkout/page.tsx:12` |
| `/custom-projects/estimate` | 16 / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/custom-projects/estimate/page.tsx:21` |
| `/custom-projects/features` | 15 / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/custom-projects/features/page.tsx:8` |
| `/custom-projects/my-projects/[id]` | 14 / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/custom-projects/my-projects/[id]/page.tsx:34` |
| `/custom-projects/my-projects` | 18 / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/custom-projects/my-projects/page.tsx:14` |
| `/custom-projects` | 15 / 152i | self | 1 | root / root | root Org,WebSite | static | no | ISR 300 | `src/app/custom-projects/page.tsx:8; inherited description` |
| `/custom-projects/start` | 22 / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/custom-projects/start/page.tsx:6` |
| `/data-and-permissions` | 18* / 74* | self | 1? | legal helper / root | root Org,WebSite | — | no | SSG/SSR | `src/app/data-and-permissions/page.tsx:4` |
| `/delete-account` | 14* / 80* | self | 1? | legal helper / root | root Org,WebSite | — | no | SSG/SSR | `src/app/delete-account/page.tsx:6` |
| `/disclaimer` | 10* / 42* | self | 1? | legal helper / root | root Org,WebSite | static | no | SSG/SSR | `src/app/disclaimer/page.tsx:4` |
| `/email-verified` | 18 / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSG/SSR | `src/app/email-verified/page.tsx:7` |
| `/faq` | 26 / 143 | self | 1 | root / root | FAQPage? | static | conditional | ISR 300 | `src/app/faq/page.tsx:21` |
| `/forgot-password` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR shell + client | `src/app/forgot-password/page.tsx:6` |
| `/grievance` | 19 / 73 | — | 1? | root / root | root Org,WebSite | static | no | SSG/SSR | `src/app/grievance/page.tsx:13` |
| `/jobs/[id]` | var / var | self | 1 | page / page | JobPosting,BreadcrumbList | dynamic | conditional | ISR 300 | `src/app/jobs/[id]/page.tsx:45; closed noindex` |
| `/jobs/companies/[id]` | var / var | self | 1 | root / root | root Org,WebSite + local | dynamic | conditional | ISR 300 | `src/app/jobs/companies/[id]/page.tsx:25` |
| `/jobs/companies` | 30 / 118 | self | 1 | page / root | root Org,WebSite + local | dynamic | conditional | ISR 300 | `src/app/jobs/companies/page.tsx:24` |
| `/jobs` | 18 / 147 | self | 1 | page / root | root Org,WebSite + local | dynamic | conditional | SSR+cache | `src/app/jobs/page.tsx:21` |
| `/learning/[gridSlug]/[topicSlug]` | var / var | self | 1 | page / page | TechArticle,FAQPage?,BreadcrumbList | dynamic | conditional | ISR 86400 | `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:54; empty/premium bodies` |
| `/learning/[gridSlug]` | var / var | self | 1? | page / page | Course,BreadcrumbList | dynamic | conditional | ISR 21600 | `src/app/learning/[gridSlug]/page.tsx:23` |
| `/learning` | 60 / 152 | self | 1 | page / page | ItemList,BreadcrumbList | dynamic | no | SSR+cache | `src/app/learning/page.tsx:24` |
| `/legal` | 15 / 95 | self | 1 | page / root | root Org,WebSite | static | no | SSG/SSR | `src/app/legal/page.tsx:9` |
| `/login` | 6 / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR shell + client | `src/app/login/page.tsx:6` |
| `/logout` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSG/SSR | `src/app/logout/page.tsx:6` |
| `/mock-tests/[testId]` | var / 152i | self | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/mock-tests/[testId]/page.tsx:11` |
| `/mock-tests/[testId]/result/[attemptId]` | 64i / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSR | `src/app/mock-tests/[testId]/result/[attemptId]/page.tsx:8` |
| `/onboarding` | 64i / 152i | — | 1 | root / root | root Org,WebSite | — | yes | SSG/SSR | `src/app/onboarding/page.tsx:7` |
| `/` | 64 / 183 | self | 1? | page / root | Organization,WebSite,FAQPage? | static | no | ISR 300 | `src/app/page.tsx:39` |
| `/placement/notes/[id]` | — / — | redirect | 0 | — / — | — | — | n/a | redirect | `src/app/placement/notes/[id]/page.tsx:13` |
| `/placement/notes` | — / — | redirect | 0 | — / — | — | — | n/a | redirect | `src/app/placement/notes/page.tsx:13` |
| `/placement` | — / — | redirect | 0 | — / — | — | — | n/a | redirect | `src/app/placement/page.tsx:8` |
| `/practice/interview-questions/[category]/[topic]` | var / var | self | 1 | page / page | FAQPage?,BreadcrumbList | dynamic | conditional | ISR 86400 | `src/app/practice/interview-questions/[category]/[topic]/page.tsx:24` |
| `/practice/interview-questions/[category]` | var / var | self | 1? | page / root | root Org,WebSite + local | dynamic | conditional | ISR 21600 | `src/app/practice/interview-questions/[category]/page.tsx:23` |
| `/practice/interview-questions` | 51 / 153 | self | 1? | page / root | root Org,WebSite + local | dynamic | no | ISR 21600 | `src/app/practice/interview-questions/page.tsx:16` |
| `/practice` | 8 / 172 | self | 1? | page / root | root Org,WebSite + local | dynamic | no | ISR 21600 | `src/app/practice/page.tsx:11` |
| `/practice/problems/[slug]` | var / var | self | 1? | page / page | root Org,WebSite + local | dynamic | conditional | ISR 86400 | `src/app/practice/problems/[slug]/page.tsx:25` |
| `/practice/problems` | 15 / 156 | self | 1? | root / root | root Org,WebSite + local | dynamic | no | SSR+cache | `src/app/practice/problems/page.tsx:20` |
| `/practice/submissions` | 11 / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/practice/submissions/page.tsx:10` |
| `/premium` | 7 / 152i | self | 1 | root / root | root Org,WebSite | static | conditional | ISR 300 | `src/app/premium/page.tsx:38; inherited description` |
| `/privacy-policy` | 14* / 61* | self | 1? | legal helper / root | root Org,WebSite | static | no | SSG/SSR | `src/app/privacy-policy/page.tsx:4` |
| `/project-license` | 22* / 64* | self | 1? | legal helper / root | root Org,WebSite | static | no | SSG/SSR | `src/app/project-license/page.tsx:4` |
| `/projects/[id]` | var / var | self | 1 | page / page | Product,BreadcrumbList | dynamic | conditional | ISR 300 | `src/app/projects/[id]/page.tsx:26` |
| `/projects/category/[category]` | var / var | self | 1 | page / root | root Org,WebSite + local | dynamic | conditional | ISR 300 | `src/app/projects/category/[category]/page.tsx:30` |
| `/projects` | 19 / 153 | self | 1 | page / root | root Org,WebSite + local | dynamic | conditional | SSR+cache | `src/app/projects/page.tsx:38` |
| `/projects/trending` | 17 / 147 | self | 1 | page / root | root Org,WebSite + local | dynamic | conditional | ISR 300 | `src/app/projects/trending/page.tsx:27` |
| `/r/[token]` | 64i / 152i | — | 0 | root / root | root Org,WebSite | — | yes | SSR | `src/app/r/[token]/page.tsx:18; no H1` |
| `/referral` | 16 / 152i | self | 1? | root / root | root Org,WebSite | — | conditional | ISR 300 | `src/app/referral/page.tsx:12; inherited description` |
| `/refund-policy` | 28* / 67* | self | 1? | legal helper / root | root Org,WebSite | — | no | SSG/SSR | `src/app/refund-policy/page.tsx:4` |
| `/register` | 14 / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR shell + client | `src/app/register/page.tsx:6` |
| `/reset-password` | 64i / 152i | — | 1? | root / root | root Org,WebSite | — | yes | SSR shell + client | `src/app/reset-password/page.tsx:6` |
| `/resume` | 14 / 140 | self | 1 | page / root | root Org,WebSite | static | no | SSR | `src/app/resume/page.tsx:18` |
| `/resume/templates` | 16 / 134 | self | 1? | page / root | root Org,WebSite | static | no | ISR 300 | `src/app/resume/templates/page.tsx:12` |
| `/search` | 6 / 86 | — | 1? | root / root | root Org,WebSite | — | yes | SSR | `src/app/search/page.tsx:11` |
| `/support` | 7 / 152i | self | 1 | root / root | root Org,WebSite | static | no | SSG/SSR | `src/app/support/page.tsx:6` |
| `/terms` | 18* / 68* | self | 1? | legal helper / root | root Org,WebSite | static | no | SSG/SSR | `src/app/terms/page.tsx:4` |
| `/api/announcements` | — / — | — | — | — | — | — | n/a | response | `src/app/api/announcements/route.ts:1` API/auth response, non-HTML |
| `/api/auth/verify-email` | — / — | — | — | — | — | — | n/a | response | `src/app/api/auth/verify-email/route.ts:1` API/auth response, non-HTML |
| `/api/auth/verify-recovery` | — / — | — | — | — | — | — | n/a | response | `src/app/api/auth/verify-recovery/route.ts:1` API/auth response, non-HTML |
| `/api/coding-problems/judge` | — / — | — | — | — | — | — | n/a | response | `src/app/api/coding-problems/judge/route.ts:1` API/auth response, non-HTML |
| `/api/coding-problems/submit` | — / — | — | — | — | — | — | n/a | response | `src/app/api/coding-problems/submit/route.ts:1` API/auth response, non-HTML |
| `/api/compiler/run` | — / — | — | — | — | — | — | n/a | response | `src/app/api/compiler/run/route.ts:1` API/auth response, non-HTML |
| `/api/custom-projects/understand` | — / — | — | — | — | — | — | n/a | response | `src/app/api/custom-projects/understand/route.ts:1` API/auth response, non-HTML |
| `/api/learning/progress` | — / — | — | — | — | — | — | n/a | response | `src/app/api/learning/progress/route.ts:1` API/auth response, non-HTML |
| `/api/practice/judge` | — / — | — | — | — | — | — | n/a | response | `src/app/api/practice/judge/route.ts:1` API/auth response, non-HTML |
| `/api/practice/submit` | — / — | — | — | — | — | — | n/a | response | `src/app/api/practice/submit/route.ts:1` API/auth response, non-HTML |
| `/api/problems/solution` | — / — | — | — | — | — | — | n/a | response | `src/app/api/problems/solution/route.ts:1` API/auth response, non-HTML |
| `/api/resume/assist` | — / — | — | — | — | — | — | n/a | response | `src/app/api/resume/assist/route.ts:1` API/auth response, non-HTML |
| `/api/resume/export/docx` | — / — | — | — | — | — | — | n/a | response | `src/app/api/resume/export/docx/route.ts:1` API/auth response, non-HTML |
| `/api/resume/export/pdf` | — / — | — | — | — | — | — | n/a | response | `src/app/api/resume/export/pdf/route.ts:1` API/auth response, non-HTML |
| `/api/resume/parse` | — / — | — | — | — | — | — | n/a | response | `src/app/api/resume/parse/route.ts:1` API/auth response, non-HTML |
| `/api/revalidate` | — / — | — | — | — | — | — | n/a | response | `src/app/api/revalidate/route.ts:1` API/auth response, non-HTML |
| `/api/search` | — / — | — | — | — | — | — | n/a | response | `src/app/api/search/route.ts:1` API/auth response, non-HTML |
| `/api/session` | — / — | — | — | — | — | — | n/a | response | `src/app/api/session/route.ts:1` API/auth response, non-HTML |
| `/auth/callback` | — / — | — | — | — | — | — | n/a | response | `src/app/auth/callback/route.ts:1` API/auth response, non-HTML |
| `/sitemap.xml` | — / — | — | — | — | — | — | n/a | response | `src/app/sitemap.xml/route.ts:1` XML, non-HTML |
| `/sitemaps/blog.xml` | — / — | — | — | — | — | — | n/a | response | `src/app/sitemaps/blog.xml/route.ts:1` XML, non-HTML |
| `/sitemaps/interview-questions.xml` | — / — | — | — | — | — | — | n/a | response | `src/app/sitemaps/interview-questions.xml/route.ts:1` XML, non-HTML |
| `/sitemaps/jobs.xml` | — / — | — | — | — | — | — | n/a | response | `src/app/sitemaps/jobs.xml/route.ts:1` XML, non-HTML |
| `/sitemaps/learning.xml` | — / — | — | — | — | — | — | n/a | response | `src/app/sitemaps/learning.xml/route.ts:1` XML, non-HTML |
| `/sitemaps/problems.xml` | — / — | — | — | — | — | — | n/a | response | `src/app/sitemaps/problems.xml/route.ts:1` XML, non-HTML |
| `/sitemaps/projects.xml` | — / — | — | — | — | — | — | n/a | response | `src/app/sitemaps/projects.xml/route.ts:1` XML, non-HTML |
| `/sitemaps/static.xml` | — / — | — | — | — | — | — | n/a | response | `src/app/sitemaps/static.xml/route.ts:1` XML, non-HTML |

## Dynamic routes and sitemap completeness

There is **no `sitemap.ts`** in this app. `src/app/sitemap.xml/route.ts:1-10` returns an index; seven child routes are named in `src/lib/sitemap/build.ts:18-26` and loaded by `src/lib/sitemap/data.ts:196-243`. Child entries are cached for one hour (`src/lib/sitemap/data.ts:48,206-223`); `readAllPages` pages through queries with a 50,000-row safety cap (`:54-73`). A live sitemap or database export is required to verify actual URL counts and RPC definitions; the browsing tool could not fetch the XML endpoints.

| Family | `generateMetadata`? | Sitemap query and exclusions | What it misses / cannot prove |
|---|---|---|---|
| `/jobs/[id]`, companies | Yes: `src/app/jobs/[id]/page.tsx:45-73`, `src/app/jobs/companies/[id]/page.tsx:25-35` | `src/lib/sitemap/data.ts:159-169` pages `onlyActiveJobs(jobs)` and all companies; `src/lib/sitemap/build.ts:249-273` outputs active job URLs and companies with at least one active role. | Closed/expired jobs are intentionally excluded and noindexed (`src/app/jobs/[id]/page.tsx:45-50`); company pages without open roles are excluded. Whether database/RLS returns every expected active row is unverified. |
| `/projects/[id]`, category, trending | Yes: `src/app/projects/[id]/page.tsx:53-65`, `src/app/projects/category/[category]/page.tsx:30-42`, `src/app/projects/trending/page.tsx:27-43` | `src/lib/sitemap/data.ts:171-180` pages anon-visible `projects` and `categories`; `src/lib/sitemap/build.ts:282-303` lists project detail, nonempty categories, list and trending hubs. | Empty categories are deliberately omitted. The query has no explicit published/status predicate (`data.ts:173-177`), as do list/detail queries (`src/lib/cache.ts:175-194,256-268`); visibility depends on deployed RLS, which this source audit cannot validate. |
| `/learning/[gridSlug]`, topic | Yes: grid `src/app/learning/[gridSlug]/page.tsx:23-47`; lesson `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:72-104` | `src/lib/sitemap/data.ts:91-99` pages `learning_sitemap(p_platform:'website')`; `src/lib/sitemap/build.ts:133-157` outputs grids and topics, dropping detected templated GenAI topics. | RPC publication/visibility rules are outside this website folder. Empty-body published topics are **not** excluded by the builder (`build.ts:139-149`) although page may show “No content yet” (`src/app/learning/[gridSlug]/[topicSlug]/page.tsx:244-245`). |
| `/coding-problems/[problemSlug]`, `/practice/problems/[slug]` | Yes: `src/app/coding-problems/[problemSlug]/page.tsx:21-64`; `src/app/practice/problems/[slug]/page.tsx:25-57` | `src/lib/sitemap/data.ts:128-149` pages `coding_problems_sitemap`, `practice_problems_sitemap`, plus thin-check rows; `src/lib/sitemap/build.ts:190-207` drops thin topic-linked coding problems. | Thin coding problems are intentionally noindexed/excluded. Global practice problem rows are output as provided by RPC; deployed RPC coverage cannot be proved from this folder. |
| `/practice/interview-questions/[category]/[topic]` | Yes: `src/app/practice/interview-questions/[category]/[topic]/page.tsx:24-53` | `src/lib/sitemap/data.ts:152-157` pages `interview_questions_sitemap`; `src/lib/sitemap/build.ts:216-235` emits hub, categories with topics and topic URLs. | Categories with no visible topic are omitted. Actual published/website-visible population depends on the RPC. |
| `/blog/[slug]` | Yes: `src/app/blog/[slug]/page.tsx:42-79` | `src/lib/sitemap/data.ts:183-194` pages published `blog_posts`; `src/lib/sitemap/build.ts:312-320` excludes posts whose canonical points to another URL. | Externally canonicalized posts are intentionally omitted. Live published count and content quality are unverified. |
| Static and utility | Static pages have own metadata or `legalMetadata` (`src/legal/seo.ts:12-37`) | `src/lib/sitemap/build.ts:39-57,114-120` conditionally includes FAQ/Premium. | `/delete-account`, `/cookie-policy`, `/refund-policy`, `/data-and-permissions`, and `/referral` are deliberately omitted even though they can be indexable (`src/lib/sitemap/build.ts:59-74`, `src/app/referral/page.tsx:12-19`). Private, auth and redirect routes are omitted. |

`generateStaticParams` is **not** the sitemap: jobs/projects prerender a top 40 (`src/app/jobs/[id]/page.tsx:37-41`, `src/app/projects/[id]/page.tsx:16-22`); lessons and both problem types return `[]` to use on-demand ISR (`src/app/learning/[gridSlug]/[topicSlug]/page.tsx:32-42`, `src/app/coding-problems/[problemSlug]/page.tsx:12-19`, `src/app/practice/problems/[slug]/page.tsx:13-19`). Their long-tail URLs rely on the sitemap RPC/query paths above. `generateMetadata` exists for each dynamic content family listed; missing rows return a noindex fallback and page redirects/404s as coded.

## Duplicates, inherited metadata, rendering, linking, and images

1. **Duplicated/inherited public descriptions.** `/custom-projects` declares only title/canonical (`src/app/custom-projects/page.tsx:7-11`), `/premium` only title/canonical/robots (`src/app/premium/page.tsx:38-45`), `/referral` the same (`src/app/referral/page.tsx:12-19`), and `/support` only title/canonical (`src/app/support/page.tsx:6-9`). All inherit the generic 152-character root description from `src/app/layout.tsx:31-47`. This yields duplicate description text across distinct public intents. Exact rendered metadata still needs a crawl.
2. **Private/utility default metadata.** Account descendants inherit root title/description but also account-layout noindex (`src/app/account/layout.tsx:7-10`). `/auth/confirm` is a client page with no own metadata (`src/app/auth/confirm/page.tsx:1-9`), while robots disallows `/auth/` (`src/app/robots.ts:10-15`); add explicit noindex in a server layout if this page must be kept out of results. Filtered `/jobs`, `/projects`, `/blog`, and `/learning` query URLs share their hub title/canonical (`src/app/jobs/page.tsx:21-45`, `src/app/projects/page.tsx:38-65`, `src/app/blog/page.tsx:27-30,51-56`, `src/app/learning/page.tsx:24-27,130-132`). That is deliberate URL consolidation, so query variants should not be counted as separately indexable pages.
3. **OG/Twitter.** Root defaults are at `src/app/layout.tsx:49-60`. The shared legal helper creates a page OG object without `images` (`src/legal/seo.ts:12-22,25-37`); the repository itself notes that a child OG object shadows the root OG image (`src/lib/seo.ts:10-16`). Legal share previews therefore need an explicit image if image cards are desired. `/projects/[id]` provides an OG fallback but only gives Twitter an image when a thumbnail exists (`src/app/projects/[id]/page.tsx:57-64`). These affect sharing, not direct indexing.
4. **Crawler-visible content.** The primary home, catalog, job, learning, blog and project page functions are server components (`src/app/page.tsx:80-89`, `src/app/projects/page.tsx:80-100`, `src/app/learning/[gridSlug]/page.tsx:49-80`, `src/app/blog/[slug]/page.tsx:81-113`). The exception of SEO interest is premium lesson body: the server always renders a locked shell, while content is fetched by a client island after sign-in (`src/app/learning/[gridSlug]/[topicSlug]/page.tsx:233-245`, `src/app/learning/[gridSlug]/[topicSlug]/PremiumTopicContent.tsx:17-29,48-77`). The compiler's interactive editor is also client-side, but its H1 and WebApplication schema are server-rendered (`src/app/compiler/page.tsx:28-52`).
5. **Orphans and breadcrumbs.** No **confirmed indexable static orphan** appeared in the source link scan: the footer links major hubs and legal index (`src/components/Footer.tsx:40-78`), while learning curriculum exposes lesson links in server HTML (`src/app/learning/[gridSlug]/page.tsx:49-86`). The noindex `/email-verified` route has no literal internal link; it is an auth utility (`src/app/email-verified/page.tsx:7-9`). Dynamic CMS links and actual click depth need crawl. Detail pages such as project, job, learning and blog render BreadcrumbList (`src/app/projects/[id]/page.tsx:95-103`, `src/app/jobs/[id]/page.tsx:151-159`, `src/app/learning/[gridSlug]/page.tsx:64-72`, `src/app/blog/[slug]/page.tsx:102-114`). The public `/custom-projects`, `/premium`, and `/referral` pages contain no local breadcrumb component/schema (`src/app/custom-projects/page.tsx:65-71`, `src/app/premium/page.tsx:94-101`, `src/app/referral/page.tsx:22-37`); add one if navigation testing shows need.
6. **Image alt audit.** AST inspection of **16** `<img>`/`<Image>` tags in the imported page component graph found **zero missing `alt` attributes**. Representative paths include `src/components/ProjectCard.tsx:36-43`, `src/components/blog/BlogImage.tsx:34-46`, and Markdown-rendered images `src/components/learning/Markdown.tsx:182`. Empty alt appears deliberately for decorative thumbnails (`src/app/projects/[id]/Gallery.tsx:50`, `src/app/account/notifications/NotificationRow.tsx:35`). CMS-provided alt quality and rendered background images remain unverified.
7. **Schema syntax.** Local JSON-LD is serialized with `JSON.stringify` and HTML-safe escaping (`src/components/JsonLd.tsx:12-27`). Schema type/payload accuracy for dynamic database values requires rendered sample URLs; this audit did not claim Rich Results eligibility from code alone.

## Top five source-backed reasons many URLs may be absent from Google's index

These are **ranked hypotheses from code, not a Search Console diagnosis**. “Not indexed” can be intentional and does not necessarily mean an SEO defect.

1. **Templated Generative AI lessons are deliberately `noindex`.** The website classifier records markers associated with 206 of 207 seeded topics (`src/lib/contentQuality.ts:7-22`); lesson metadata applies `index:false` when those markers occur (`src/app/learning/[gridSlug]/[topicSlug]/page.tsx:83-103`), and the sitemap excludes them (`src/lib/sitemap/build.ts:139-149`). Current database count is unverified. Rewrite substantive bodies before seeking indexing.
2. **Thin topic-linked coding problems are deliberately `noindex` and absent from XML.** Pages with no examples, constraints or starter code are noindexed (`src/app/coding-problems/[problemSlug]/page.tsx:45-62`); the shared classifier and sitemap drop them (`src/lib/contentQuality.ts:25-40`, `src/lib/sitemap/build.ts:190-207`). Populate real problem material before changing index rules.
3. **Filtered listing URLs canonicalize to a single hub.** Jobs and projects accept query filters but canonicalize to `/jobs` and `/projects` (`src/app/jobs/page.tsx:21-45`, `src/app/projects/page.tsx:38-65`); blog and learning do the same (`src/app/blog/page.tsx:27-30,51-56`, `src/app/learning/page.tsx:24-27,130-132`). Google has a reason to consolidate many URL variants. Keep this if filters are not meant as separate landing pages.
4. **Closed or expired jobs are noindexed and removed from the sitemap.** Job metadata returns `index:false` unless the job is open (`src/app/jobs/[id]/page.tsx:45-50`); job status/deadline logic is at `src/lib/jobsActive.ts:20-31`, and only active jobs enter XML (`src/lib/sitemap/data.ts:159-169`, `src/lib/sitemap/build.ts:249-273`). This is appropriate for stale postings but explains missing old job URLs.
5. **Some lesson URLs have too little public HTML.** A published topic with no blocks renders “No content yet” but is not excluded by the sitemap (`src/app/learning/[gridSlug]/[topicSlug]/page.tsx:244-245`, `src/lib/sitemap/build.ts:139-149`). Premium topic bodies are withheld from crawler HTML while the page stays indexable (`src/app/learning/[gridSlug]/[topicSlug]/page.tsx:94-103,233-245`; `PremiumTopicContent.tsx:17-29`). Inventory these URLs, add substantial public summaries where appropriate, and noindex genuinely empty pages until content exists.

**Additional conditional risk:** catalog metadata converts a missing count to zero, so a transient query failure may temporarily produce `noindex` (`src/lib/cache.ts:175-194,212-230`; `src/app/projects/page.tsx:62-65`; `src/app/jobs/page.tsx:44-46`). Distinguish query errors from a true empty catalog before emitting robots metadata. Verify this with fault-injection tests; no live outage was observed.

# Website route indexing inventory

Source inventory for the October 24, 2026 audit. These are route patterns, not production URL counts. Conditional outcomes depend on anonymous runtime data. Body/content quality was sampled separately; this table is not a claim that every database row was reviewed.

| Route | Indexing policy | Canonical source | File |
|---|---|---|---|
| `/about` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/about/page.tsx) |
| `/account/applications` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/applications/page.tsx) |
| `/account/notifications` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/notifications/page.tsx) |
| `/account` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/page.tsx) |
| `/account/profile` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/profile/page.tsx) |
| `/account/purchases` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/purchases/page.tsx) |
| `/account/referral` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/referral/page.tsx) |
| `/account/resume/[id]/ats` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/resume/[id]/ats/page.tsx) |
| `/account/resume/[id]/edit` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/resume/[id]/edit/page.tsx) |
| `/account/resume/[id]/jd-match` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/resume/[id]/jd-match/page.tsx) |
| `/account/resume/[id]/preview` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/resume/[id]/preview/page.tsx) |
| `/account/resume/[id]/projects` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/resume/[id]/projects/page.tsx) |
| `/account/resume/[id]/versions` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/resume/[id]/versions/page.tsx) |
| `/account/resume/import` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/resume/import/page.tsx) |
| `/account/resume` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/resume/page.tsx) |
| `/account/saved-jobs` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/saved-jobs/page.tsx) |
| `/account/saved-projects` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/saved-projects/page.tsx) |
| `/account/wallet` | Private: account layout noindex + requireUser | Not needed for excluded/redirect route | [page.tsx](../website/src/app/account/wallet/page.tsx) |
| `/auth/confirm` | Intentional noindex: authentication | Noindex inherited from auth/confirm layout | [page.tsx](../website/src/app/auth/confirm/page.tsx) |
| `/blog/[slug]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/blog/[slug]/page.tsx) |
| `/blog` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/blog/page.tsx) |
| `/coding-problems/[problemSlug]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/coding-problems/[problemSlug]/page.tsx) |
| `/community-guidelines` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/community-guidelines/page.tsx) |
| `/compiler` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/compiler/page.tsx) |
| `/contact` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/contact/page.tsx) |
| `/cookie-policy` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/cookie-policy/page.tsx) |
| `/custom-projects/checkout` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/custom-projects/checkout/page.tsx) |
| `/custom-projects/estimate` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/custom-projects/estimate/page.tsx) |
| `/custom-projects/features` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/custom-projects/features/page.tsx) |
| `/custom-projects/my-projects/[id]` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/custom-projects/my-projects/[id]/page.tsx) |
| `/custom-projects/my-projects` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/custom-projects/my-projects/page.tsx) |
| `/custom-projects` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/custom-projects/page.tsx) |
| `/custom-projects/start` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/custom-projects/start/page.tsx) |
| `/data-and-permissions` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/data-and-permissions/page.tsx) |
| `/delete-account` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/delete-account/page.tsx) |
| `/disclaimer` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/disclaimer/page.tsx) |
| `/email-verified` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/email-verified/page.tsx) |
| `/faq` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/faq/page.tsx) |
| `/forgot-password` | Intentional noindex: authentication | Not needed for excluded/redirect route | [page.tsx](../website/src/app/forgot-password/page.tsx) |
| `/grievance` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/grievance/page.tsx) |
| `/jobs/[id]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/jobs/[id]/page.tsx) |
| `/jobs/companies/[id]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/jobs/companies/[id]/page.tsx) |
| `/jobs/companies` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/jobs/companies/page.tsx) |
| `/jobs` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/jobs/page.tsx) |
| `/learning/[gridSlug]/[topicSlug]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/learning/[gridSlug]/[topicSlug]/page.tsx) |
| `/learning/[gridSlug]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/learning/[gridSlug]/page.tsx) |
| `/learning` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/learning/page.tsx) |
| `/legal` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/legal/page.tsx) |
| `/login` | Intentional noindex: authentication | Not needed for excluded/redirect route | [page.tsx](../website/src/app/login/page.tsx) |
| `/logout` | Intentional noindex: authentication | Not needed for excluded/redirect route | [page.tsx](../website/src/app/logout/page.tsx) |
| `/mock-tests/[testId]` | Intentional noindex: private or workflow | Explicit page canonical | [page.tsx](../website/src/app/mock-tests/[testId]/page.tsx) |
| `/mock-tests/[testId]/result/[attemptId]` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/mock-tests/[testId]/result/[attemptId]/page.tsx) |
| `/onboarding` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/onboarding/page.tsx) |
| `/` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/page.tsx) |
| `/placement/notes/[id]` | Intentional permanent redirect | Not needed for excluded/redirect route | [page.tsx](../website/src/app/placement/notes/[id]/page.tsx) |
| `/placement/notes` | Intentional permanent redirect | Not needed for excluded/redirect route | [page.tsx](../website/src/app/placement/notes/page.tsx) |
| `/placement` | Intentional permanent redirect | Not needed for excluded/redirect route | [page.tsx](../website/src/app/placement/page.tsx) |
| `/practice/interview-questions/[category]/[topic]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/practice/interview-questions/[category]/[topic]/page.tsx) |
| `/practice/interview-questions/[category]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/practice/interview-questions/[category]/page.tsx) |
| `/practice/interview-questions` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/practice/interview-questions/page.tsx) |
| `/practice` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/practice/page.tsx) |
| `/practice/problems/[slug]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/practice/problems/[slug]/page.tsx) |
| `/practice/problems` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/practice/problems/page.tsx) |
| `/practice/submissions` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/practice/submissions/page.tsx) |
| `/premium` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/premium/page.tsx) |
| `/privacy-policy` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/privacy-policy/page.tsx) |
| `/project-license` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/project-license/page.tsx) |
| `/projects/[id]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/projects/[id]/page.tsx) |
| `/projects/category/[category]` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/projects/category/[category]/page.tsx) |
| `/projects` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/projects/page.tsx) |
| `/projects/trending` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/projects/trending/page.tsx) |
| `/r/[token]` | Intentional noindex: private or workflow | Not needed for excluded/redirect route | [page.tsx](../website/src/app/r/[token]/page.tsx) |
| `/referral` | Public: conditional noindex for missing/empty/thin/unavailable data | Explicit page canonical | [page.tsx](../website/src/app/referral/page.tsx) |
| `/refund-policy` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/refund-policy/page.tsx) |
| `/register` | Intentional noindex: authentication | Not needed for excluded/redirect route | [page.tsx](../website/src/app/register/page.tsx) |
| `/reset-password` | Intentional noindex: authentication | Not needed for excluded/redirect route | [page.tsx](../website/src/app/reset-password/page.tsx) |
| `/resume` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/resume/page.tsx) |
| `/resume/templates` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/resume/templates/page.tsx) |
| `/search` | Intentional noindex: search results | Not needed for excluded/redirect route | [page.tsx](../website/src/app/search/page.tsx) |
| `/support` | Public: page metadata and canonical | Explicit page canonical | [page.tsx](../website/src/app/support/page.tsx) |
| `/terms` | Public policy/contact page: shared metadata and canonical | Shared legal metadata | [page.tsx](../website/src/app/terms/page.tsx) |

# Raw HTML sample — captured before the Compiler duplicate fix

This table preserves the actual response observations; retries do not erase failures. Empty robots metadata means no explicit restriction, not a failed check. Private/search/404 pages intentionally omit canonical. All captured script nonces matched the response CSP.

| URL | HTTP | Title/description | Canonical | Social metadata | H1 | Breadcrumb parity | Nonces |
|---|---:|---|---|---|---|---|---|
| / | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /learning | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /learning/dbms-sql-tutorial | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /learning/dbms-sql-tutorial/1nf | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /blog | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /blog/ai-vs-humans-will-artificial-intelligence-replace-humans | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /practice | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /practice/interview-questions | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /practice/interview-questions/java | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /practice/interview-questions/java/abstract-classes | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /practice/problems | 200 | FAIL | FAIL | FAIL | PASS | PASS | PASS |
| /practice/problems/activity-selection | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /coding-problems/aiml-accuracy-precision-recall-f1-score-1 | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /jobs | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /jobs/companies | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /jobs/companies/amazon | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /projects | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /projects/trending | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /resume | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /resume/templates | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /about | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /compiler | 200 | PASS | PASS | PASS | PASS | FAIL — corrected, retry required | PASS |
| /custom-projects | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /premium | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /referral | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /privacy-policy | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /login | 200 | PASS | omitted intentionally | PASS | FAIL (2) | PASS | PASS |
| /search?q=python | 200 | PASS | omitted intentionally | PASS | PASS | PASS | PASS |
| /seo-verification-missing-page | 404 | PASS | omitted intentionally | PASS | PASS | PASS | PASS |
| /learning/dbms-sql-tutorial/complex-views | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /learning/java-tutorial/thread | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /learning/dbms-sql-tutorial/savepoint | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /learning/dbms-sql-tutorial/set-operation-performance | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /learning/dbms-sql-tutorial/simple-views | 200 | PASS | PASS | PASS | PASS | PASS | PASS |
| /project-license | 200 | PASS | PASS | PASS | PASS | PASS | PASS |

The Practice Problems listing lacked metadata in one response. Login has two H1s and is noindex. Compiler rendered two breadcrumb navs; the final source now uses one shared Home-first breadcrumb inside the workspace. See subsequent verification for final-build results.

Raw fields, response times and cache headers: `09-final-raw-html.csv`. Browser evidence, including failed attempts: `09-final-browser.csv`.

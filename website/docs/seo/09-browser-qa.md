# Final mobile browser smoke checks

390×844 viewport, local production build with nonce mode enabled. No CSP refusal appeared during these short checks; this is not a complete interaction audit.

| Path | HTTP | Width / scroll width | H1 count | Nonce present / JSON-LD matches | Console |
|---|---|---|---|---|---|
| /practice/interview-questions/java | 200 | 390 / 390 | 1 | true / true | No errors observed |
| /practice/interview-questions/java/abstract-classes | 200 | 390 / 390 | 1 | true / true | No errors observed |
| /coding-problems/above-their-departments-average | 200 | 390 / 390 | 1 | true / true | No errors observed |
| /practice/problems/activity-selection | 200 | 390 / 390 | 1 | true / true | Failed to load resource: the server responded with a status of 401 (Unauthorized) |
| /seo-audit-missing-page | 404 | 390 / 390 | 1 | true / true | Failed to load resource: the server responded with a status of 404 (Not Found) |

The practice page had a 401 resource response while signed out; no authorization was bypassed. The missing-page 404 console entry is expected. Previously failing interview/coding routes now return 200 with their own canonical, one H1 and matching JSON-LD nonce.

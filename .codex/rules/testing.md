# Testing Rules

- Read the nearest existing tests and package scripts; run the smallest relevant check first, then the required checks for affected surfaces.
- Test behavior and contracts, including relevant invalid, denied, and failure paths. Use the repository's test runners and database harness; do not install tools without approval.
- For database/RLS changes, use the ordered local SQL harness when available; never substitute an application-only test for database authorization evidence.
- Report exact commands and outcomes, including failures, skips, and environment blockers. Never claim a check ran when it did not.
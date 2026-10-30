# Security Rules

- Treat authentication, authorization, RLS, secrets, payments, protected content, uploads, and production configuration as sensitive boundaries.
- Never print, copy, request, or commit secret values or private user data. Use approved secret references and avoid echoing credentials in diagnostics.
- Enforce access at trusted server/database boundaries; do not weaken RLS, identity checks, payment verification, or content gating.
- Require explicit human approval before high-risk security or credential changes. Clearly destructive or credential-exposing actions must be blocked.
- Validate untrusted input and test both permitted and denied behavior at the actual enforcement point.
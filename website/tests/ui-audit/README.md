This browser harness exercises actual website components with mocked auth, Supabase,
and Server Actions. It does not make production writes. It uses the already available
Playwright, esbuild, and sharp installations; no manifest or lockfile changes were made.
It is separate from the Node-only Vitest suite.

From the repository root, with Chromium available at the indicated path:

```bash
node website/tests/ui-audit/build-fixture.cjs
node website/node_modules/tailwindcss/lib/cli.js -c website/tailwind.config.ts -i website/src/app/globals.css -o /tmp/campusedux-ui-audit/style.css --content 'website/src/**/*.{ts,tsx}'
PLAYWRIGHT_BROWSERS_PATH=/tmp/campusedux-browsers node website/tests/ui-audit/check.cjs
```

The harness binds loopback port 4178. Results and screenshots go to
`/tmp/campusedux-ui-audit`. The comparison bundle reads tracked source from `HEAD`;
run before committing the fixes to reproduce the original comparison. Normal-state
screenshots allow at most 499 differing color channels with a maximum difference of
5/255, to accommodate subpixel rasterization. Focus is matched between screenshots.

The 20 scenarios cover overlay focus/scroll behavior, rejected requests, stale
session/search responses, account-isolated bookmarks, elapsed-time test countdown,
share revocation failures, latest-value draft saves, and cancellation on draft clear, and serialized resume autosaves.
Mocked component tests do not establish live RLS, payment, email, or OAuth behavior.

# CampusEduX Website — Performance Phase 3: Client Bundle

**Date:** 2026-09-06 · **Branch:** `audit/full-project-review`
**Scope:** items 18–21. Behaviour-preserving. No UI/UX change. typecheck + lint + build green.

---

## Summary

This codebase's client bundle was **already lean** — most of Phase 3's checklist
found nothing to fix (no `moment`, no chart lib, no rich-text editor, no date
pickers, no whole-icon-pack imports, no duplicate versions, no unused deps, and
the Supabase browser client is already a singleton). The real work was **three
lazy-load / server-move splits in the résumé builder** and one targeted
re-render fix in the editor's live preview.

| Route | Phase 2 | Phase 3 |
|---|---|---|
| `/resume` (Builder hub) | 111 kB | **102 kB** (−9) |
| `/resume/templates` | 112 kB | **104 kB** (−8) |
| `/account/resume/[id]/edit` | 125 kB | **119 kB** (−6) |

Build ~43 s, unchanged. 10 files touched (résumé builder + the Supabase browser factory).

---

## 18 — Code-split heavy client-only features

The analyzer's only splittable client-only weights were all in the résumé area
(`prismjs` on `/compiler` is already `next/dynamic({ ssr:false })`; `@react-pdf/renderer`
/ `docx` / `mammoth` / `pdf-parse` are server-only in `/api/*` — verified).

**A. `qrcode.react` (~8 kB gz) → lazy inside `ShareModal`.**
It was statically imported by `ShareModal` → `ResumeEditor`, so it shipped in the
`/account/resume/[id]/edit` route bundle even though the QR code only paints
inside an open Share modal on an active link. Now:
`dynamic(() => import("qrcode.react").then(m => m.QRCodeSVG), { ssr:false })` —
its own chunk (`5398.js`), fetched only when the modal opens.

**B. `demoResumes.ts` (~6 kB gz, 4 full demo personas) → off the client entirely.**
`ResumeThumbnail` (`"use client"`) computed each template's demo render model at
runtime, dragging `demoResumes` + `renderModel` + `content` into the `/resume` and
`/resume/templates` client bundles. Now the **server** computes the model:
- `TemplateShowcaseCard` (server component) builds `demoRenderModel(t.id)` and
  passes `model={…}` to `ResumeThumbnail`.
- `/resume/templates/page.tsx` (server) builds `{ [id]: { model, persona } }` for
  every template and threads it through `TemplateGallery` → `TemplateGalleryCard`
  (→ `ResumeThumbnail`) and → `TemplatePreviewModal`.
- `ResumeThumbnail` and `TemplatePreviewModal` no longer import `demoResumes`;
  `ResumeThumbnail`'s `model` prop is now required.
Result: **`demoResumes` appears in zero client chunks** (verified) — it's
server-only, alongside the `resumeBuilder.ts` server action that already used it.

**C. `TemplatePreviewModal` → `next/dynamic` from `TemplateGallery`.**
The full-screen A4 preview (with `ResumeDocumentView` + zoom logic) only mounts
when a card's "Preview" is clicked — now its own lazy chunk (`7621.js`), out of
the initial `/resume/templates` bundle.

Not split: the editor's own panels (`DesignPanel`, `SectionEditor`, etc.). The
whole editor chunk is 13 kB gz; splitting it into 4 button-triggered lazy chunks
would save ~4 kB gz on an authenticated, low-traffic page at the cost of a
loading flash each time a panel opens — not worth it.

## 19 — Bundle bloat

**Nothing to fix — the dependency tree is already minimal:**

| Check | Finding |
|---|---|
| `moment` → `date-fns`/`dayjs` | **No `moment`** (or `dayjs`/`date-fns`/`luxon`). Dates use `Intl.DateTimeFormat` + a hand-rolled `timeAgo` in `lib/format.ts`. |
| Charts / rich-text / date-pickers | **None present.** |
| Icon imports | **All named** (`import { X } from "lucide-react"`, 97 sites) — no `import * as` / no deep-path pack imports. Next 14.2 `optimizePackageImports` covers `lucide-react` by default; the analyzer confirms per-icon modules. |
| Unused deps | **None.** All 13 runtime deps are imported in `src/` (`prismjs`→compiler, `qrcode.react`→ShareModal, `@react-pdf`/`docx`/`mammoth`/`pdf-parse`/`@anthropic-ai/sdk`→`/api/*`, `zod`→9 files, …). |
| Duplicate versions | **None.** `npm ls` shows every shared dep `deduped`; `@supabase/*` all at `2.112.4`, single `react@18.3.1`, single `zod`. **Do not run `npm dedupe`** — its dry-run only wants to add Windows/WASI optional platform binaries, which would bloat the lockfile for zero benefit. |

(Phase 2 already added `optimizePackageImports: ["@/components/ui"]` for the local
UI barrel — the one barrel-import issue that did exist.)

## 20 — Supabase client singleton

**Already a singleton** — `@supabase/ssr`'s `createBrowserClient` memoises
internally once it detects a browser, so the ~10 call sites
(`useSessionProfile` ×4, `AnnouncementBar`, every form) share **one**
`GoTrueClient` + one refresh timer + one storage listener, not one per component.

Hardened anyway: `src/lib/supabase/browser.ts` now keeps its own module-level
instance, because `@supabase/ssr`'s internal heuristic has shifted across 0.x
releases — this pins the singleton guarantee regardless of the library version.

Server clients are correctly **not** singletons: `getPublicSupabase()` is cheap
(no listeners, no network on construct) and its hot reads are wrapped in
`unstable_cache` (Phase 2); `createAuthedServerSupabase()` must be per-request
(it binds to the request's cookies) and its callers are `cache()`-memoised.

## 21 — Unnecessary re-renders in list-heavy screens

Server-rendered lists (project / job grids) have no re-render cost. The one
client screen with a genuine per-keystroke re-render problem is the **résumé
editor's live preview**:

- `ResumeEditor` holds `content` in `useState`; every keystroke re-runs
  `buildResumeRenderModel(...)` and re-renders the entire `<ResumeDocumentView>`
  (the full A4 document — dozens to ~150 DOM nodes) synchronously, competing with
  the text input for the main thread.
- Autosave is **already debounced** (800 ms) — not the issue.

Fix (React-18 primitives, no UX change — the preview still tracks every edit,
just at lower priority):
- `ResumeEditor` passes `useDeferredValue(content)` / `useDeferredValue(personalDetails)`
  to `<ResumePreview>` → the keystroke paints first, the preview catches up when
  the main thread is free.
- `ResumePreview` `useMemo`s the render model / spec / accent, and renders a
  `memo()`-wrapped `ResumeDocumentView`, so during the deferred catch-up the
  document subtree is skipped when nothing actually changed.

Deliberately **not** done: speculative `memo`/`useCallback` on the editor's
section-list rows and other components. The lists are small (a résumé has ~10–25
blocks), keys are stable, and the brief says "only where profiling shows a real
problem" — there is no profiler in this environment and 20 lightweight rows is
not one. The preview change above is the one place the re-render cost is
structurally large (a whole document tree) and on the interaction path (typing).

## Files

```
 M src/lib/supabase/browser.ts                          explicit singleton
 M src/components/resumeBuilder/ShareModal.tsx           qrcode.react -> next/dynamic
 M src/components/resumeBuilder/ResumeThumbnail.tsx      model prop now required (no demoResumes import)
 M src/components/resumeBuilder/TemplateShowcaseCard.tsx server-computes demo model
 M src/components/resumeBuilder/TemplateGalleryCard.tsx  accepts demoModel prop
 M src/components/resumeBuilder/TemplatePreviewModal.tsx model/persona props (no demoResumes import)
 M src/app/resume/templates/page.tsx                     builds per-template demo map server-side
 M src/app/resume/templates/TemplateGallery.tsx          threads demos; lazy TemplatePreviewModal
 M src/app/account/resume/[id]/edit/ResumeEditor.tsx     useDeferredValue for the preview
 M src/app/account/resume/[id]/edit/ResumePreview.tsx    useMemo + memo(ResumeDocumentView)
```

## Verified

- `typecheck` / `lint` / `build` (43 s) green.
- `/resume/templates` renders 4 server-side résumé thumbnails (200, `ResumeDocumentView`
  in the HTML); `/resume` renders the hub; `/r/<bad-token>` still 404s. No server errors.
- Analyzer: `demoResumes` in **0** client chunks; `qrcode.react` and
  `TemplatePreviewModal` each isolated to their own on-demand chunk.

## Still the biggest lever (unchanged from Phase 0/1/2)

The nav/session islands (`useSessionProfile` ×4 + `AnnouncementBar`) still pull
`@supabase/supabase-js` (~64 kB gz — `6608` + `44530001` chunks) into **every**
route's first-load JS. That is a `SessionProfileProvider` + `next/dynamic`
refactor of the header — its own phase (Phase 0 B1/B2). Nothing in Phase 3 could
touch it without changing hydration behaviour.

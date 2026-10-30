# CampusEduX website audit — Part 4: UI consistency and dead code

**Date:** 15 October 2026 UTC. **Scope:** `website/` only. Application source was read only; this audit report and `AUDIT_FINAL.md` are the only intended writes. Parts 1–3 supplied route and risk context; their checks were not repeated. **Files read: 607 of 607** regular `website/` files outside `node_modules/` and `.next/` at scan time, including 433 TS/TSX/JS source files, 14 CSS/JSON source files and 21 public assets. Every file was read bytewise; the AST graph covers the 433 code files. Manual UI review was concentrated on shared primitives, navigation, representative pages and divergent routes. Scores and viewport issues are source assessments, not claims of a live browser test.

## Method and limits

- Import graph: `node /tmp/audit4.js > /tmp/audit4.json` using the installed TypeScript compiler AST. It resolves `@/`, relative imports, re-exports, literal `require`, literal `import()` and `next/dynamic`'s nested literal imports. 115 route/layout/error/loading source seeds reach 424/433 source files before adding framework conventions and middleware. `src/app/manifest.ts`, five `opengraph-image.tsx` files, and `middleware.ts` dependencies are Next entry points, not dead files (`src/app/manifest.ts:1`; `src/app/blog/[slug]/opengraph-image.tsx:1`; `middleware.ts:1`). The graph does not prove exports unused, string-built paths safe, or CMS asset references absent.
- Text searches used `grep -RIn` under `website/src`; the exact conservative no-reference command for a candidate basename is `grep -RFn --exclude-dir=node_modules --exclude-dir=.next --exclude='AUDIT_*.md' 'BASENAME' website/src website/public website/next.config.js website/middleware.ts website/scripts website/tests`. `git ls-files website` was checked for tracked files and secrets. The asset inventory also searched source CSS/JSON, `next.config.js` and `middleware.ts` for exact public paths and path fragments.
- No production database, CMS rows, or running DOM was available. At 320, 375, 768 and 1440 px, collision findings below are CSS deductions requiring browser verification.

## A. Design-token inventory

| Role | Canonical definition | Divergence or gap |
|---|---|---|
| Colors | `tailwind.config.ts:35-66`; light/dark RGB in `src/app/globals.css:14-82`; primary 50–900, canvas/card/surface/line/ink, semantic success/danger/warning, six fixed accents | 220 hex matches in 433 code files (includes data/brand/IDE/PDF); nav tints are literal in `src/components/nav/navConfig.ts:41-74`, dark hero panels in `src/app/premium/page.tsx:92-109` and `src/app/custom-projects/page.tsx:65-86`. Token roles do not cover custom hero/IDE/PDF palettes. |
| Fonts | `tailwind.config.ts:68-76`; display Bricolage and sans Plus Jakarta via `src/app/layout.tsx:82,88` | IDE/resume documents intentionally use their own typography (`src/app/compiler/CompilerShell.tsx:244`; `src/components/resumeBuilder/ResumeDocumentView.tsx:1`). |
| Type size | Tailwind defaults plus `.eyebrow`, `.h-display`, `.h-hero`, `.h-section`, `.lede`, `.section-title` at `src/app/globals.css:209-230,259` | 300 arbitrary utility matches across source/CSS. Common one-offs: `text-[11px]` bottom tabs (`src/components/nav/BottomNav.tsx:30`), `text-[13px]` header and editor (`src/components/nav/HeaderLinks.tsx:45`; `src/app/compiler/CompilerShell.tsx:244`), `text-[0.95rem]` hero CTA (`src/app/premium/page.tsx:109`). Some sizes are deliberate compact UI. |
| Spacing | Tailwind 4px base scale; shells `container-page`, `container-prose`, `page-shell` (`src/app/globals.css:184-207`) | Separate hardcoded hero/panel paddings (`src/components/home/CustomProjectPromo.tsx:35`; `src/app/premium/page.tsx:92`). No extended spacing tokens exist in `tailwind.config.ts:34-116`. |
| Radius/shadow | sm 8, default/md 12, lg/2xl 16, xl 20 px; card/card-lg/glow (`tailwind.config.ts:78-91`; `globals.css:42-44,79-81`) | Comment promises 3xl 24px but no 3xl override (`tailwind.config.ts:78-86`), so Tailwind default 3xl applies. Standalone `.empty-state` radius differs in composition (`globals.css:301-309`). |
| Buttons | `<Button>` variants primary, secondary, ghost, danger, text; sizes 36/44/48px (`src/components/ui/Button.tsx:11-31`); `.btn-primary/secondary/ghost` (`globals.css:236-249`) | Two APIs remain; filters/auth use CSS classes (`src/components/marketplace/JobFilters.tsx:70-73`; `src/app/login/LoginView.tsx:177`) while newer pages use component. Hero CTAs build a third recipe (`src/app/custom-projects/page.tsx:80-86`). |
| Cards/badges | `<Card>` padding none/sm/md/lg and hover (`src/components/ui/Card.tsx:4-42`); `.card`, `.card-hover`, `<Badge>` seven tones (`globals.css:250-256`; `src/components/ui/Badge.tsx:7-34`) | `.badge` CSS and `<Badge>` coexist; premium/new/trending use palette-specific text classes while primary/success/danger use semantic aliases (`Badge.tsx:9-16`), so variant contrast needs rendered verification. |
| Inputs | `<Input>`, `<Textarea>`, `<Select>` 44px, `Field`, `OptionChips` (`src/components/ui/Field.tsx:10-66,69-92,100-135`) | IDE has separate control design (`src/app/compiler/CompilerToolbar.tsx:105,222-253`); `Field` error text is not automatically bound with `aria-describedby`/`aria-invalid` (`Field.tsx:80-91`). |
| Motion/focus | Global focus outline and reduced-motion guards (`globals.css:166-180,184-191`) | JS scroll/animation behavior needs runtime reduced-motion check; shared modal/drawer lack focus trap (`src/components/ui/Modal.tsx:30-68`; `Drawer.tsx:36-95`). |

**Computed token contrast** (WCAG relative luminance, opaque foreground on card): light ink 18.51, muted 6.06, faint 5.08, primary text 6.46, success text 5.93, danger text 5.74; dark ink 15.80, muted 8.40, faint 5.93, primary text 6.60, success text 10.40, danger text 6.55. White on primary is 6.46 light and 5.10 dark. **Failures/risks:** light warning `#F59E0B` on card is **2.15:1**; dark primary *fill* on card is **3.55:1**, hence `text-primary` correctly maps to `--primary-text` (`tailwind.config.ts:62-66`). Badge success/danger aliases correctly map to text tokens (`tailwind.config.ts:62-66`); check computed CSS in a browser for all badge tones (`Badge.tsx:9-16`). Alpha surfaces, external CMS colors, gradients and hover states require rendered contrast testing.

## Route-by-route UI assessment

Scores are static consistency estimates. **new** = token shells/shared primitives; **mixed** = token base with older CSS or one-off styles; **old** = substantial independent interface. `—` means no concrete mismatch found in the route wrapper; shared component findings still apply. Redirect-only routes `/account/resume`, `/placement`, `/placement/notes`, `/placement/notes/[id]` are excluded because they have no rendered UI (`src/app/account/resume/page.tsx:5`; `src/app/placement/page.tsx:8`). The table covers 77 rendered pages (all Part 1 user-facing HTML routes plus account pages, including utility flows).

| Route | Score | System | Specific mismatch or evidence |
|---|---:|---|---|
| `/about` | 9 | new | —; route wrapper/source at `src/app/about/page.tsx:1` |
| `/account/applications` | 9 | new | —; route wrapper/source at `src/app/account/applications/page.tsx:1` |
| `/account/notifications` | 9 | new | —; route wrapper/source at `src/app/account/notifications/page.tsx:1` |
| `/account` | 8 | mixed | `src/app/account/page.tsx:49` arbitrary size |
| `/account/profile` | 9 | new | —; route wrapper/source at `src/app/account/profile/page.tsx:1` |
| `/account/purchases` | 9 | new | —; route wrapper/source at `src/app/account/purchases/page.tsx:1` |
| `/account/referral` | 9 | new | —; route wrapper/source at `src/app/account/referral/page.tsx:1` |
| `/account/resume/[id]/ats` | 5 | mixed | `src/app/account/resume/[id]/ats/page.tsx:33` arbitrary size; `src/app/account/resume/[id]/ats/page.tsx:38` inline style; specialized workspace/imported UI |
| `/account/resume/[id]/edit` | 7 | mixed | —; route wrapper/source at `src/app/account/resume/[id]/edit/page.tsx:1`; specialized workspace/imported UI |
| `/account/resume/[id]/jd-match` | 7 | mixed | `src/app/account/resume/[id]/jd-match/page.tsx:15` arbitrary size; specialized workspace/imported UI |
| `/account/resume/[id]/preview` | 7 | mixed | `src/app/account/resume/[id]/preview/page.tsx:42` arbitrary size; specialized workspace/imported UI |
| `/account/resume/[id]/projects` | 7 | mixed | `src/app/account/resume/[id]/projects/page.tsx:24` arbitrary size; specialized workspace/imported UI |
| `/account/resume/[id]/versions` | 7 | mixed | `src/app/account/resume/[id]/versions/page.tsx:19` arbitrary size; specialized workspace/imported UI |
| `/account/resume/import` | 8 | mixed | `src/app/account/resume/import/page.tsx:14` arbitrary size |
| `/account/saved-jobs` | 9 | new | —; route wrapper/source at `src/app/account/saved-jobs/page.tsx:1` |
| `/account/saved-projects` | 9 | new | —; route wrapper/source at `src/app/account/saved-projects/page.tsx:1` |
| `/account/wallet` | 9 | new | —; route wrapper/source at `src/app/account/wallet/page.tsx:1` |
| `/auth/confirm` | 8 | mixed | `src/app/auth/confirm/page.tsx:17` arbitrary size |
| `/blog/[slug]` | 8 | mixed | `src/app/blog/[slug]/page.tsx:113` arbitrary size |
| `/blog` | 9 | new | —; route wrapper/source at `src/app/blog/page.tsx:1` |
| `/coding-problems/[problemSlug]` | 7 | mixed | —; route wrapper/source at `src/app/coding-problems/[problemSlug]/page.tsx:1`; specialized workspace/imported UI |
| `/community-guidelines` | 9 | new | —; route wrapper/source at `src/app/community-guidelines/page.tsx:1` |
| `/compiler` | 7 | mixed | —; route wrapper/source at `src/app/compiler/page.tsx:1`; specialized workspace/imported UI |
| `/contact` | 8 | mixed | `src/app/contact/page.tsx:20` arbitrary size |
| `/cookie-policy` | 9 | new | —; route wrapper/source at `src/app/cookie-policy/page.tsx:1` |
| `/custom-projects/checkout` | 6 | old | `src/app/custom-projects/checkout/page.tsx:35` arbitrary size; `src/app/custom-projects/checkout/page.tsx:36` arbitrary size |
| `/custom-projects/estimate` | 6 | old | `src/app/custom-projects/estimate/page.tsx:60` arbitrary size; `src/app/custom-projects/estimate/page.tsx:64` arbitrary size |
| `/custom-projects/features` | 6 | old | `src/app/custom-projects/features/page.tsx:23` arbitrary size; `src/app/custom-projects/features/page.tsx:24` arbitrary size |
| `/custom-projects/my-projects/[id]` | 7 | mixed | `src/app/custom-projects/my-projects/[id]/page.tsx:161` arbitrary size; `src/app/custom-projects/my-projects/[id]/page.tsx:177` inline style |
| `/custom-projects/my-projects` | 7 | mixed | `src/app/custom-projects/my-projects/page.tsx:42` arbitrary size; `src/app/custom-projects/my-projects/page.tsx:84` inline style |
| `/custom-projects` | 5 | old | `src/app/custom-projects/page.tsx:65` hardcoded color; `src/app/custom-projects/page.tsx:69` hardcoded color |
| `/custom-projects/start` | 7 | mixed | `src/app/custom-projects/start/page.tsx:19` arbitrary size; `src/app/custom-projects/start/page.tsx:22` arbitrary size |
| `/data-and-permissions` | 9 | new | —; route wrapper/source at `src/app/data-and-permissions/page.tsx:1` |
| `/delete-account` | 8 | mixed | `src/app/delete-account/page.tsx:16` arbitrary size |
| `/disclaimer` | 9 | new | —; route wrapper/source at `src/app/disclaimer/page.tsx:1` |
| `/email-verified` | 9 | new | —; route wrapper/source at `src/app/email-verified/page.tsx:1` |
| `/faq` | 9 | new | —; route wrapper/source at `src/app/faq/page.tsx:1` |
| `/forgot-password` | 9 | new | —; route wrapper/source at `src/app/forgot-password/page.tsx:1` |
| `/grievance` | 8 | mixed | `src/app/grievance/page.tsx:90` arbitrary size |
| `/jobs/[id]` | 5 | old | `src/app/jobs/[id]/page.tsx:172` arbitrary size; `src/app/jobs/[id]/page.tsx:173` arbitrary size |
| `/jobs/companies/[id]` | 8 | mixed | `src/app/jobs/companies/[id]/page.tsx:68` arbitrary size |
| `/jobs/companies` | 9 | new | —; route wrapper/source at `src/app/jobs/companies/page.tsx:1` |
| `/jobs` | 8 | mixed | `src/app/jobs/page.tsx:185` arbitrary size |
| `/learning/[gridSlug]/[topicSlug]` | 5 | old | `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:192` arbitrary size; `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:203` arbitrary size |
| `/learning/[gridSlug]` | 9 | new | —; route wrapper/source at `src/app/learning/[gridSlug]/page.tsx:1` |
| `/learning` | 8 | mixed | `src/app/learning/page.tsx:179` arbitrary size |
| `/legal` | 8 | mixed | `src/app/legal/page.tsx:28` arbitrary size |
| `/login` | 9 | new | —; route wrapper/source at `src/app/login/page.tsx:1` |
| `/logout` | 9 | new | —; route wrapper/source at `src/app/logout/page.tsx:1` |
| `/mock-tests/[testId]` | 7 | mixed | —; route wrapper/source at `src/app/mock-tests/[testId]/page.tsx:1`; specialized workspace/imported UI |
| `/mock-tests/[testId]/result/[attemptId]` | 7 | mixed | —; route wrapper/source at `src/app/mock-tests/[testId]/result/[attemptId]/page.tsx:1`; specialized workspace/imported UI |
| `/onboarding` | 9 | new | —; route wrapper/source at `src/app/onboarding/page.tsx:1` |
| `/` | 9 | new | —; route wrapper/source at `src/app/page.tsx:1` |
| `/practice/interview-questions/[category]/[topic]` | 8 | mixed | `src/app/practice/interview-questions/[category]/[topic]/page.tsx:97` arbitrary size |
| `/practice/interview-questions/[category]` | 9 | new | —; route wrapper/source at `src/app/practice/interview-questions/[category]/page.tsx:1` |
| `/practice/interview-questions` | 9 | new | —; route wrapper/source at `src/app/practice/interview-questions/page.tsx:1` |
| `/practice` | 8 | mixed | `src/app/practice/page.tsx:82` inline style |
| `/practice/problems/[slug]` | 9 | new | —; route wrapper/source at `src/app/practice/problems/[slug]/page.tsx:1` |
| `/practice/problems` | 9 | new | —; route wrapper/source at `src/app/practice/problems/page.tsx:1` |
| `/practice/submissions` | 9 | new | —; route wrapper/source at `src/app/practice/submissions/page.tsx:1` |
| `/premium` | 5 | old | `src/app/premium/page.tsx:92` hardcoded color; `src/app/premium/page.tsx:99` hardcoded color |
| `/privacy-policy` | 9 | new | —; route wrapper/source at `src/app/privacy-policy/page.tsx:1` |
| `/project-license` | 9 | new | —; route wrapper/source at `src/app/project-license/page.tsx:1` |
| `/projects/[id]` | 8 | mixed | `src/app/projects/[id]/page.tsx:111` arbitrary size |
| `/projects/category/[category]` | 9 | new | —; route wrapper/source at `src/app/projects/category/[category]/page.tsx:1` |
| `/projects` | 8 | mixed | `src/app/projects/page.tsx:238` arbitrary size |
| `/projects/trending` | 9 | new | —; route wrapper/source at `src/app/projects/trending/page.tsx:1` |
| `/r/[token]` | 9 | new | —; route wrapper/source at `src/app/r/[token]/page.tsx:1` |
| `/referral` | 8 | mixed | `src/app/referral/page.tsx:33` hardcoded color |
| `/refund-policy` | 9 | new | —; route wrapper/source at `src/app/refund-policy/page.tsx:1` |
| `/register` | 9 | new | —; route wrapper/source at `src/app/register/page.tsx:1` |
| `/reset-password` | 9 | new | —; route wrapper/source at `src/app/reset-password/page.tsx:1` |
| `/resume` | 8 | mixed | `src/app/resume/page.tsx:163` arbitrary size |
| `/resume/templates` | 9 | new | —; route wrapper/source at `src/app/resume/templates/page.tsx:1` |
| `/search` | 9 | new | —; route wrapper/source at `src/app/search/page.tsx:1` |
| `/support` | 9 | new | —; route wrapper/source at `src/app/support/page.tsx:1` |
| `/terms` | 9 | new | —; route wrapper/source at `src/app/terms/page.tsx:1` |

The route-wrapper scan does not certify imported components. For example `/compiler` has a visually hidden H1 (`src/app/compiler/page.tsx:48-49`) while its IDE is in `CompilerShell.tsx:125-298`; `/login` delegates visual markup to `LoginView.tsx:131-177`. Scores are relative cleanup priorities, not usability test results.

## Navigation, responsive and accessibility findings

| ID | Finding and evidence | Impact / verification |
|---|---|---|
| UI-01 | `Modal` handles Escape and scroll lock but has no initial focus, Tab containment or focus restoration (`src/components/ui/Modal.tsx:30-68`). `Drawer` has the same gap (`src/components/ui/Drawer.tsx:36-95`); unnamed drawer is invoked from `MobileNav.tsx:48` with no `title`. | Keyboard focus can remain behind an aria-modal overlay. Confirm with keyboard and screen reader. |
| UI-02 | Bottom tab link content has 7px top/bottom padding, a 28px inner icon block and 11px label (`src/components/nav/BottomNav.tsx:27-42`); total link height is about 54px, but announcement dismiss is `p-1` plus 16px icon (~24px, `AnnouncementBar.tsx:61-75`), toast dismiss ~20px (`src/components/ui/Toast.tsx:66-73`), desktop nav 32px (`HeaderLinks.tsx:40-50`), compiler toolbar icon 36px (`CompilerToolbar.tsx:222-253`). | Make pointer targets at least 44px or use `.hit-44` (`globals.css:265-280`); test densely packed 320px header. |
| UI-03 | Header sticky `z-50`, bottom nav fixed `z-40`, project buy bar `z-30`, drawer `z-[100]`, modal `z-[110]`, toast `z-[150]` (`src/components/nav/Header.tsx:25`; `BottomNav.tsx:20`; `src/app/projects/[id]/page.tsx:195`; `src/components/ui/Drawer.tsx:60`; `Modal.tsx:45`; `Toast.tsx:51`). Global bottom spacer is ~64px (`src/app/layout.tsx:104-106`), but project buy bar adds another fixed row without an equal page-bottom reserve (`projects/[id]/page.tsx:194-202`). | At 320/375, final content may sit behind buy bar; at 768 the buy bar moves to bottom 0 until lg. Verify with browser and safe-area simulation. |
| UI-04 | Bottom nav active check uses `pathname.startsWith(href)` without segment boundary (`src/components/nav/BottomNav.tsx:13-15`); desktop uses exact or `href + "/"` (`HeaderLinks.tsx:28-33`). | A route such as `/jobs-old` would activate Jobs. Current routes may not collide; unify matcher and test nested active states. |
| UI-05 | Announcement title/body are `truncate` (`src/components/home/AnnouncementBar.tsx:54-59`), so long urgent copy is hidden without an expansion affordance; async insertion after fetch (`:23-53`) can shift page. | Check 320/375 and slow connection; reserve height or present full text with wrapping. |
| UI-06 | `Field` renders error text separately but does not bind it to the control (`src/components/ui/Field.tsx:80-91`); `OptionChips` have ~36px vertical box (`:119-132`). | Bind errors through stable ids and aria attributes; enlarge chip targets. |
| UI-07 | `/compiler` H1 is sr-only (`src/app/compiler/page.tsx:48-49`). This preserves semantic H1, but sighted users lack a visible title. | Add visible page heading or explicit IDE title; test heading order. |
| UI-08 | Premium comparison table has `min-w-[36rem]` inside named scroll region (`src/app/premium/page.tsx:182-183`); submissions table has `min-w-[640px]` in overflow wrapper (`src/app/practice/submissions/page.tsx:115-116`). | Horizontal *table* scrolling is intentional; test keyboard scrolling and 320px content clipping. |
| UI-09 | Project gallery uses `Image fill` for thumbs (`src/app/projects/[id]/Gallery.tsx:50`) and cards use aspect footprints (`src/components/ui/Skeleton.tsx:19-29`). Verify every remote image container reserves size; the CMS image paths vary. | Actual CLS needs rendered image/network testing. |
| UI-10 | Empty-state API and `.empty-state` CSS coexist (`src/components/ui/EmptyState.tsx:10-39`; `src/app/globals.css:301-309`; `src/app/custom-projects/features/page.tsx:31`). Errors sometimes use EmptyState (`src/app/account/resume/[id]/projects/page.tsx:31`) instead of ErrorState (`src/components/ui/ErrorState.tsx:11-45`); compiler has a separate fallback skeleton (`src/app/compiler/CompilerFallback.tsx:10-16`). | Standardize action and retry behavior; keep specialized skeleton dimensions where they match an editor. |
| UI-11 | No common dark token applies to IDE; explicit `theme-light` and dark IDE colors are intentional (`src/app/compiler/CompilerShell.tsx:125-157`; `src/app/globals.css:87-127`). Resume paper is also an intentional light island (`globals.css:87-94`). | Test theme switch across dialogs, payments and editor; no sitewide dark mode break proven by source. |

**Viewport checklist:** at 320/375, check header controls and long announcement, drawer focus, bottom nav plus purchase bar, CTA and toast clearance; at 768, buy bar bottom 0 and account two-column threshold (`src/app/account/layout.tsx:16-36`); at 1440, sticky header/desktop nav and long table. These are verification cases, not observed screenshots. `prefers-reduced-motion` CSS guard is present (`src/app/globals.css:174-191`).

### UI verdict and top ten fixes by impact/effort

**UI score: 72/100.** The token base is coherent, but the interface is not fully unified. Priority: (1) modal/drawer focus; (2) fixed buy-bar clearance; (3) 44px icon targets; (4) error/empty state semantics; (5) announcement wrapping and layout reserve; (6) bind field errors; (7) align Button/CSS button usage; (8) consolidate card/badge recipes; (9) replace repeated hardcoded brand colors with named hero/accent tokens; (10) confirm four viewport/theme/CLS states in browser. Implement tokens first (`tailwind.config.ts:34-91`, `globals.css:14-127`), then shared `Button/Card/Badge/Field/Modal/Drawer` (`src/components/ui/Button.tsx:11-31`; `Card.tsx:4-42`; `Badge.tsx:7-34`; `Field.tsx:10-92`; `Modal.tsx:30-68`; `Drawer.tsx:36-95`), then migrate divergent pages starting premium/custom projects/IDE (`src/app/premium/page.tsx:92-109`; `src/app/custom-projects/page.tsx:65-86`; `src/app/compiler/CompilerShell.tsx:125-157`).

## B. Dead code, files and dependencies

### Import graph and code hygiene

The seven zero-inbound source files from the AST scan are **all conventions or alternate entry points**, not proven unused: five `opengraph-image.tsx` routes (`src/app/blog/[slug]/opengraph-image.tsx:1`; `src/app/coding-problems/[problemSlug]/opengraph-image.tsx:1`; `src/app/learning/[gridSlug]/[topicSlug]/opengraph-image.tsx:1`; `src/app/learning/[gridSlug]/opengraph-image.tsx:1`; `src/app/practice/problems/[slug]/opengraph-image.tsx:1`), manifest (`src/app/manifest.ts:1`), and middleware helper imported by out-of-graph `middleware.ts:1` (`src/lib/middlewarePaths.ts:1`). `src/lib/ogImage.tsx:1` and `src/lib/brandLogoData.ts:1` are reachable from OG convention files. **No TS/TSX source file is proven safe to delete.** All literal dynamic imports found by AST were included, including `src/app/compiler/CompilerShell.tsx:16`, `src/app/resume/templates/TemplateGallery.tsx:17`, and `src/app/learning/[gridSlug]/[topicSlug]/PremiumTopicContent.tsx:15`. String-built and runtime/config references remain VERIFY FIRST.

- No Tailwind `safelist` entry exists (`tailwind.config.ts:29-117`); no candidate to remove. Unused exports/classes require symbol-level and runtime/CMS class analysis; zero-inbound graph alone cannot prove them. `.empty-state` is referenced at `src/app/custom-projects/features/page.tsx:31`, so it is not dead (`src/app/globals.css:301-309`).
- Commented-out code: heuristic `^\s*//\s*(const|let|var|return|if|for|await|set[A-Z]|<\w)` returned **7 matches**, all explanatory comments when inspected (for example `src/app/login/page.tsx:1`, `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:1`). **0 confirmed commented-out code blocks.** `grep -RInE 'TODO|FIXME|HACK|XXX' website/src --include='*.ts' --include='*.tsx'` returned 0 implementation markers.
- `grep -RInE 'console\.(log|debug|warn|error)|\bdebugger\b|\balert\(' website/src --include='*.ts' --include='*.tsx'`: 6 executable `console.error` sites (`src/app/error.tsx:10`; `src/app/api/auth/verify-email/route.ts:42`; `src/app/api/auth/verify-recovery/route.ts:45`; `src/app/auth/callback/route.ts:37,51`; `src/app/forgot-password/ForgotPasswordView.tsx:53`), one `console.log` inside an editor sample string (`src/lib/compiler/languages.ts:43`), no debugger or alert. The error logs are diagnostics, not proven leftover debug code. 
- Duplicate logic: Razorpay callback verification/recovery patterns are copied in wallet, premium, project and custom checkout (`src/app/account/wallet/TopUpForm.tsx:45-58`; `src/components/PremiumSubscribeButton.tsx:71-82`; `src/app/projects/[id]/ProjectPurchasePanel.tsx:77-88`; `src/app/custom-projects/checkout/CustomProjectCheckout.tsx:67-79`). Shared payment status UI and callback error handling would reduce drift. `JobFilters.tsx:70-73` and `ProjectFilters.tsx:87-90` repeat form CTA classes; keep route-specific query controls.

### Dependencies

Exact search: `grep -RFl --exclude=package.json --exclude=package-lock.json --exclude-dir=node_modules --exclude-dir=.next PACKAGE website/src website/scripts website/tests website/next.config.js website/tailwind.config.ts website/postcss.config.js website/vitest.config.ts website/.eslintrc.json`. All 14 production dependencies have at least one source/config/test reference (`package.json:12-28`). `qrcode.react` is confined to one dynamic modal import (`src/components/resumeBuilder/ShareModal.tsx:4-12`), **VERIFY FIRST** due to functionality. No redundant date or markdown package pair appears (`package.json:12-28`). `@types/*`, `postcss`, `eslint-config-next`, `sharp` can be build/tooling dependencies even with zero textual imports (`package.json:29-42`; `postcss.config.js:1`; `next.config.js:1`); **do not label unused from grep alone**. No missing package import was established by the AST scan, and Part 2's build/lint/typecheck passed (`AUDIT_BUGS_PART2.md:7-16`).

### Public assets (21/21)

An exact path search in source/CSS/JSON/config found the following. **0 refs means no literal source reference, not proof of no runtime/CMS/metadata/manifest URL.** Sizes are bytes; >200 KB marked oversized. `ads.txt` and `app-ads.txt` are well-known public endpoints, never deletion candidates based on imports (`public/ads.txt:1`; `public/app-ads.txt:1`).

| Asset | Bytes | Literal source refs | Disposition |
|---|---:|---:|---|
| `public/ads.txt` | 216 | 0 | VERIFY FIRST |
| `public/app-ads.txt` | 191 | 0 | VERIFY FIRST |
| `public/blog/ai-hero.svg` | 2,879 | 0 | VERIFY FIRST |
| `public/blog/ai-how-it-works.svg` | 3,367 | 0 | VERIFY FIRST |
| `public/blog/ai-in-the-world.svg` | 3,329 | 0 | VERIFY FIRST |
| `public/blog/ai-vs-humans-compare.svg` | 2,480 | 0 | VERIFY FIRST |
| `public/blog/ai-vs-humans-hero.svg` | 2,502 | 0 | VERIFY FIRST |
| `public/blog/human-ai-collaboration.svg` | 2,133 | 0 | VERIFY FIRST |
| `public/brand/icon-192.png` | 27,754 | 1 | referenced |
| `public/brand/icon-512.png` | 125,064 | 1 | referenced |
| `public/brand/icon-maskable-512.png` | 60,649 | 1 | referenced |
| `public/brand/logo-full-white-bg.png` | 395,351 | 0 | VERIFY FIRST; >200 KB |
| `public/brand/logo-full-white-bg.webp` | 56,664 | 0 | VERIFY FIRST |
| `public/brand/logo-full.png` | 422,885 | 1 | referenced; >200 KB |
| `public/brand/logo-full.webp` | 86,336 | 0 | VERIFY FIRST |
| `public/brand/logo-mark.png` | 118,983 | 1 | referenced |
| `public/brand/logo-mark.webp` | 36,400 | 0 | VERIFY FIRST |
| `public/brand/logo-wordmark-horizontal.png` | 159,285 | 1 | referenced |
| `public/brand/logo-wordmark-horizontal.webp` | 47,400 | 0 | VERIFY FIRST |
| `public/brand/og-image.png` | 158,583 | 3 | referenced |
| `public/images/custom-project-banner.webp` | 98,234 | 1 | referenced |

`sha256sum website/public/brand/* website/public/blog/* | sort -k1,1` found **no byte-identical images**. PNG/WebP pairs are format variants, not exact duplicates (`public/brand/logo-full.png:1`; `public/brand/logo-full.webp:1`). Blog SVGs have no literal source references, but CMS HTML can store their URLs (`public/blog/ai-hero.svg:1`); verify DB/media inventory before removing. `logo-full.png` (422,885 B) and `logo-full-white-bg.png` (395,351 B) exceed 200 KB; prefer matching WebP only after confirming all consumers, including OG/social and external URLs (`public/brand/logo-full.png:1`; `public/brand/logo-full-white-bg.png:1`).

### Strays, routes and deletion lists

`find website -path 'website/node_modules' -prune -o -path 'website/.next' -prune -o -type f \( -name '*.bak' -o -name '*.old' -o -iname '*-copy.*' -o -name '*.log' -o -name '*.zip' -o -name '*.sql' \) -print` found only three SQL migration/perf files (`supabase/migrations/0001_contact_submissions.sql:1`; `docs/perf/suggested-indexes.sql:1`; `perf/phase1_indexes.sql:1`) plus the second migration and second perf SQL; these are project artifacts, not proven stray. One lockfile exists (`package-lock.json:1`). `git ls-files website | grep -E '(^|/)(\.env[^/]*|\.next|node_modules|\.DS_Store)|\.log$|tsconfig\.tsbuildinfo$'` returned **only tracked `.env.example`**; no tracked secret `.env.local`, generated `.next`, node_modules, log or tsbuildinfo. `.env.local` is local and untracked; contents were not reproduced. Prior `AUDIT_*.md` reports are needed for this merge and are not deletion candidates (`AUDIT_SEO_PART1.md:1`; `AUDIT_BUGS_PART2.md:1`; `AUDIT_ADSENSE_CONTENT_PART3.md:1`).

Static link/redirect/sitemap scan finds no proven orphan public route: framework route names and dynamic links can be data-built (`src/components/nav/navConfig.ts:41-83`; `src/components/Footer.tsx:40-86`; `src/lib/sitemap/build.ts:39-57`). `/email-verified` is an intentional auth utility (`src/app/email-verified/page.tsx:7`), as are `/r/[token]` and `/auth/confirm` (`src/app/r/[token]/page.tsx:18`; `src/app/auth/confirm/page.tsx:1`). Confirm dynamic destination coverage with a production crawl before pruning any route.

**SAFE TO DELETE** (path | size | proof of no references): **none**. The AST and grep checks yield no path whose framework, dynamic, config, CMS and public URL consumers are ruled out.

**VERIFY FIRST** (path | reason): five `opengraph-image.tsx` files and `src/app/manifest.ts` | Next file conventions; `src/lib/ogImage.tsx`, `src/lib/brandLogoData.ts` | convention graph descendants; `public/blog/*.svg` | CMS references unknown; `public/brand/*.webp` with 0 literal refs | external/metadata consumers unknown; `public/brand/logo-full-white-bg.png` | oversized, external use unknown; `public/ads.txt`, `public/app-ads.txt` | well-known ad URLs; `docs/perf/*.sql`, `perf/*.sql`, `scripts/*`, old reports | operational/history use unknown; `qrcode.react` | dynamic one-place feature. **No deletion performed.**

## Appendix: exhaustive source-style deviations from automated scan

These are **occurrences for review**, not 625 defects: tokens embedded in data, resumes, PDFs and IDE theme code may be intentional. The scan includes `src` TS/TSX/JS and CSS. Each `file:line` is an exact regex hit. Command: `node /tmp/audit4.js > /tmp/audit4.json`; the AST/regex script reads all `website/src` files and matches `#[0-9a-fA-F]{3,8}\b`, selected `*- [...]` arbitrary Tailwind utilities, and `style={`. The inventory was generated before these reports were written.

### Hex literals (220)

- `src/app/account/resume/[id]/edit/DesignPanel.tsx:107`
- `src/app/account/resume/[id]/edit/ResumeEditor.tsx:103`
- `src/app/account/resume/[id]/preview/page.tsx:33`
- `src/app/account/wallet/TopUpForm.tsx:70`
- `src/app/coding-problems/[problemSlug]/_components/CodeEditorPanel.tsx:26,71`
- `src/app/coding-problems/[problemSlug]/_components/CompilerPanel.tsx:103`
- `src/app/coding-problems/[problemSlug]/_components/CompilerToolbar.tsx:43`
- `src/app/coding-problems/[problemSlug]/_components/InputPanel.tsx:25`
- `src/app/coding-problems/[problemSlug]/_components/OutputPanel.tsx:23`
- `src/app/coding-problems/[problemSlug]/_components/ResizeHandle.tsx:62`
- `src/app/compiler/CodeEditor.tsx:69`
- `src/app/compiler/CompilerFallback.tsx:10,11`
- `src/app/compiler/CompilerShell.tsx:19,125,157,200,220,268`
- `src/app/compiler/CompilerToolbar.tsx:91,145`
- `src/app/compiler/CompilerWorkspace.tsx:292`
- `src/app/compiler/ResizeHandle.tsx:56`
- `src/app/compiler/editor.css:5,12,15,22,26,34,39,44,48,53,72,75,82,86,94,99,104,108,113`
- `src/app/custom-projects/checkout/CustomProjectCheckout.tsx:93`
- `src/app/custom-projects/my-projects/[id]/PayRemainingButton.tsx:64`
- `src/app/custom-projects/page.tsx:65,69,71,80`
- `src/app/layout.tsx:36,37`
- `src/app/learning/_components/Celebration.tsx:7` (repeat hits on a line included in count)
- `src/app/manifest.ts:14,15`
- `src/app/practice/page.tsx:31,32,39,40,47,48,55,56`
- `src/app/premium/page.tsx:92,99,101,109` (repeat hits on a line included in count)
- `src/app/projects/[id]/ProjectPurchasePanel.tsx:98`
- `src/app/r/[token]/page.tsx:41`
- `src/app/referral/page.tsx:33`
- `src/components/PremiumSubscribeButton.tsx:92`
- `src/components/auth/GoogleIcon.tsx:6,10,14,18`
- `src/components/home/CustomProjectPromo.tsx:30,42,51,59,81`
- `src/components/learning/CodeBlock.tsx:71`
- `src/components/learning/CourseCover.tsx:21,22`
- `src/components/nav/navConfig.ts:42,43,44,45,46,47,48,49,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74` (repeat hits on a line included in count)
- `src/components/referral/ReferralReminderButton.tsx:19` (repeat hits on a line included in count)
- `src/components/referral/ShareReferralLink.tsx:62` (repeat hits on a line included in count)
- `src/components/resumeBuilder/ResumeDocumentView.tsx:33,34,35,36,49,100,141,202` (repeat hits on a line included in count)
- `src/components/resumeBuilder/ResumeThumbnail.tsx:43`
- `src/components/ui/CategoryCard.tsx:15,16`
- `src/components/ui/ProgressRing.tsx:45`
- `src/components/ui/ResourceCard.tsx:18`
- `src/lib/courseCover.ts:11` (repeat hits on a line included in count)
- `src/lib/home.ts:27,28,29,30,31,32,33,34` (repeat hits on a line included in count)
- `src/lib/image.ts:5`
- `src/lib/ogImage.tsx:10,44,65,80,88,89`
- `src/lib/resumeBuilder/design.ts:38` (repeat hits on a line included in count)
- `src/lib/resumeBuilder/loadForExport.ts:23`
- `src/lib/resumeBuilder/pdfDocument.tsx:22,23,29,31,32,33,43,51,52` (repeat hits on a line included in count)
- `src/lib/resumeBuilder/templateSpecs.ts:129,130,131,132`

### Arbitrary utility values (300)

- `src/app/account/layout.tsx:19`
- `src/app/account/page.tsx:49,54,112` (repeat hits on a line included in count)
- `src/app/account/resume/[id]/ResumeSteps.tsx:66`
- `src/app/account/resume/[id]/ats/page.tsx:33,56,99`
- `src/app/account/resume/[id]/edit/CompletionChecklist.tsx:49`
- `src/app/account/resume/[id]/edit/ResumeEditor.tsx:155,224`
- `src/app/account/resume/[id]/edit/TagGroupsEditor.tsx:39`
- `src/app/account/resume/[id]/jd-match/page.tsx:15`
- `src/app/account/resume/[id]/preview/page.tsx:42`
- `src/app/account/resume/[id]/projects/page.tsx:24`
- `src/app/account/resume/[id]/versions/page.tsx:19`
- `src/app/account/resume/import/page.tsx:14`
- `src/app/auth/confirm/page.tsx:11,17`
- `src/app/blog/[slug]/page.tsx:113`
- `src/app/coding-problems/[problemSlug]/_components/CodingProblemLayout.tsx:37` (repeat hits on a line included in count)
- `src/app/coding-problems/[problemSlug]/_components/CompilerPanel.tsx:125` (repeat hits on a line included in count)
- `src/app/coding-problems/[problemSlug]/_components/IOPanel.tsx:28`
- `src/app/coding-problems/[problemSlug]/_components/InputPanel.tsx:72`
- `src/app/coding-problems/[problemSlug]/_components/OutputPanel.tsx:41`
- `src/app/coding-problems/[problemSlug]/_components/ProblemPanel.tsx:81,89,103,153`
- `src/app/coding-problems/[problemSlug]/_components/ProblemSolution.tsx:46`
- `src/app/coding-problems/[problemSlug]/_components/ResizeHandle.tsx:64` (repeat hits on a line included in count)
- `src/app/compiler/CompilerFallback.tsx:11,13` (repeat hits on a line included in count)
- `src/app/compiler/CompilerShell.tsx:140,172,200,244,298` (repeat hits on a line included in count)
- `src/app/compiler/CompilerWorkspace.tsx:292,311` (repeat hits on a line included in count)
- `src/app/compiler/ResizeHandle.tsx:58` (repeat hits on a line included in count)
- `src/app/contact/page.tsx:20`
- `src/app/custom-projects/_builder/ConfigSummary.tsx:56,60,64,71`
- `src/app/custom-projects/_builder/FeatureCard.tsx:81`
- `src/app/custom-projects/_builder/TrackingStepper.tsx:39`
- `src/app/custom-projects/checkout/page.tsx:35,36`
- `src/app/custom-projects/estimate/page.tsx:60,64,124`
- `src/app/custom-projects/features/BuilderFeatures.tsx:244,487`
- `src/app/custom-projects/features/page.tsx:23,24`
- `src/app/custom-projects/my-projects/[id]/MessageThread.tsx:66,72`
- `src/app/custom-projects/my-projects/[id]/page.tsx:161,318` (repeat hits on a line included in count)
- `src/app/custom-projects/my-projects/page.tsx:42`
- `src/app/custom-projects/page.tsx:69,70,71,73,80,86` (repeat hits on a line included in count)
- `src/app/custom-projects/start/page.tsx:19,22` (repeat hits on a line included in count)
- `src/app/delete-account/page.tsx:16`
- `src/app/email-verified/page.tsx:21`
- `src/app/forgot-password/ForgotPasswordView.tsx:12,18`
- `src/app/globals.css:191,215,218,221,224,251` (repeat hits on a line included in count)
- `src/app/grievance/page.tsx:90`
- `src/app/jobs/[id]/page.tsx:172,173,185,205,207,291` (repeat hits on a line included in count)
- `src/app/jobs/companies/[id]/page.tsx:68` (repeat hits on a line included in count)
- `src/app/jobs/page.tsx:185,222`
- `src/app/layout.tsx:91,100,105`
- `src/app/learning/[gridSlug]/[topicSlug]/LearningBookmarkButton.tsx:86`
- `src/app/learning/[gridSlug]/[topicSlug]/page.tsx:192,203,209,214,248,284` (repeat hits on a line included in count)
- `src/app/learning/[gridSlug]/page.tsx:82`
- `src/app/learning/_components/Celebration.tsx:43`
- `src/app/learning/_components/CourseCta.tsx:116`
- `src/app/learning/_components/CourseCurriculum.tsx:71,83`
- `src/app/learning/_components/CourseHero.tsx:93,108`
- `src/app/learning/_components/LessonComplete.tsx:38,93,136`
- `src/app/learning/_components/LessonShell.tsx:29,31,56` (repeat hits on a line included in count)
- `src/app/learning/_components/LessonSidebar.tsx:78`
- `src/app/learning/_components/ReadingProgress.tsx:39`
- `src/app/learning/page.tsx:179`
- `src/app/legal/page.tsx:28`
- `src/app/login/LoginView.tsx:18,24,134` (repeat hits on a line included in count)
- `src/app/logout/LogoutView.tsx:24`
- `src/app/onboarding/page.tsx:36`
- `src/app/page.tsx:234`
- `src/app/practice/interview-questions/[category]/[topic]/page.tsx:97`
- `src/app/practice/problems/PracticeProblemGrid.tsx:111,121`
- `src/app/practice/problems/page.tsx:66`
- `src/app/practice/submissions/page.tsx:116`
- `src/app/premium/page.tsx:99,100,103,109,183,198,255` (repeat hits on a line included in count)
- `src/app/projects/[id]/page.tsx:105,111,195` (repeat hits on a line included in count)
- `src/app/projects/page.tsx:238,272`
- `src/app/referral/page.tsx:33` (repeat hits on a line included in count)
- `src/app/register/RegisterView.tsx:17,23,153` (repeat hits on a line included in count)
- `src/app/reset-password/ResetPasswordView.tsx:14,20`
- `src/app/resume/page.tsx:163`
- `src/components/Footer.tsx:124,127,152`
- `src/components/JobCard.tsx:34,63,77,80`
- `src/components/ProjectCard.tsx:61,66,75,77,83,87`
- `src/components/account/AccountLearningCard.tsx:23,90`
- `src/components/account/AccountPageHeader.tsx:14` (repeat hits on a line included in count)
- `src/components/auth/GoogleIcon.tsx:4` (repeat hits on a line included in count)
- `src/components/blog/BlogCard.tsx:44`
- `src/components/home/CustomProjectPromo.tsx:35,41,42,44,51,59,65,81` (repeat hits on a line included in count)
- `src/components/home/HeroVisual.tsx:34,46`
- `src/components/home/HomeHero.tsx:27,62`
- `src/components/home/HomePersonal.tsx:70,142`
- `src/components/home/PopularCourses.tsx:25`
- `src/components/home/PremiumReferralCta.tsx:20,27,30,55,56`
- `src/components/home/Testimonials.tsx:23`
- `src/components/learning/Callout.tsx:37,64,69`
- `src/components/learning/CodeBlock.tsx:71,73,96`
- `src/components/learning/CourseCardProgress.tsx:27`
- `src/components/learning/CourseCover.tsx:69,96,108` (repeat hits on a line included in count)
- `src/components/learning/LessonSection.tsx:58,64,78,82,102,176` (repeat hits on a line included in count)
- `src/components/learning/Markdown.tsx:198`
- `src/components/nav/AuthMenu.tsx:62,69,75,111`
- `src/components/nav/BottomNav.tsx:20,32`
- `src/components/nav/HeaderLinks.tsx:45`
- `src/components/nav/MobileNav.tsx:91,93,114,116,122,128` (repeat hits on a line included in count)
- `src/components/referral/ReferralHero.tsx:13,14` (repeat hits on a line included in count)
- `src/components/referral/ReferralReminderButton.tsx:19` (repeat hits on a line included in count)
- `src/components/referral/ShareReferralLink.tsx:62` (repeat hits on a line included in count)
- `src/components/resumeBuilder/ShareModal.tsx:12` (repeat hits on a line included in count)
- `src/components/resumeBuilder/TemplatePreviewModal.tsx:69`
- `src/components/search/GlobalSearch.tsx:233,234,314,345,392` (repeat hits on a line included in count)
- `src/components/support/WhatsAppSupport.tsx:105` (repeat hits on a line included in count)
- `src/components/ui/Badge.tsx:31`
- `src/components/ui/Button.tsx:23,25`
- `src/components/ui/CategoryCard.tsx:41`
- `src/components/ui/Chip.tsx:43`
- `src/components/ui/Drawer.tsx:52,54,55,60`
- `src/components/ui/FilterSheet.tsx:45`
- `src/components/ui/Modal.tsx:45`
- `src/components/ui/PageHeader.tsx:27`
- `src/components/ui/PremiumCard.tsx:37,42,44`
- `src/components/ui/PriceDisplay.tsx:29`
- `src/components/ui/ResourceCard.tsx:48`
- `src/components/ui/SectionHeader.tsx:38`
- `src/components/ui/ThemeToggle.tsx:82` (repeat hits on a line included in count)
- `src/components/ui/Toast.tsx:51`
- `src/legal/LegalProse.tsx:11,24,31,33,60`

### Inline JSX styles (105)

- `src/app/account/resume/[id]/ats/page.tsx:38`
- `src/app/account/resume/[id]/edit/CompletionChecklist.tsx:32`
- `src/app/account/resume/[id]/edit/DesignPanel.tsx:96`
- `src/app/coding-problems/[problemSlug]/_components/CodingProblemLayout.tsx:38`
- `src/app/coding-problems/[problemSlug]/_components/CompilerPanel.tsx:123`
- `src/app/coding-problems/[problemSlug]/_components/IOPanel.tsx:29`
- `src/app/compiler/CodeEditor.tsx:141,147,161,180`
- `src/app/compiler/CompilerShell.tsx:138,173`
- `src/app/custom-projects/_builder/StepBar.tsx:28`
- `src/app/custom-projects/my-projects/[id]/page.tsx:177`
- `src/app/custom-projects/my-projects/page.tsx:84`
- `src/app/learning/_components/Celebration.tsx:48`
- `src/app/learning/_components/CourseCta.tsx:125`
- `src/app/learning/_components/CourseCurriculum.tsx:182`
- `src/app/learning/_components/LessonSidebar.tsx:43`
- `src/app/practice/page.tsx:82`
- `src/components/CustomProjectBanner.tsx:32,48,61`
- `src/components/home/HomePersonal.tsx:84`
- `src/components/learning/CourseCard.tsx:61`
- `src/components/learning/CourseCover.tsx:49,66,67`
- `src/components/nav/MobileNav.tsx:89,91`
- `src/components/resumeBuilder/ResumeDashboard.tsx:64`
- `src/components/resumeBuilder/ResumeDocumentView.tsx:60,62,74,80,93,100,109,118,141,144,148,149,150,154,160,161,162,166,172,173,174,176,178,181,182,183,186,187,194,198,217,227,234,235,236`
- `src/components/resumeBuilder/ResumeSheetScaler.tsx:49,50,53`
- `src/components/resumeBuilder/ResumeThumbnail.tsx:43,46`
- `src/components/resumeBuilder/TemplatePreviewModal.tsx:104,105,108`
- `src/components/ui/CategoryCard.tsx:37,39`
- `src/components/ui/ProgressBar.tsx:53`
- `src/components/ui/ProgressRing.tsx:39`
- `src/components/ui/Rating.tsx:30,34`
- `src/components/ui/ResourceCard.tsx:37,49,52`
- `src/lib/ogImage.tsx:37,48,58,61,74,87,88,89`
- `src/lib/resumeBuilder/pdfDocument.tsx:59,60,61,62,63,66,70,71,72,76,79,83,84,91`


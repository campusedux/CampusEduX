| ID | Severity | Page/component | Pre-fix locations (relative to `website/src`) | Bug and root cause | Fix |
|---|---|---|---|---|---|
| 1 | High | Shared dialogs | `components/ui/Modal.tsx:30`<br>`components/ui/Drawer.tsx:36`<br>`components/resumeBuilder/TemplatePreviewModal.tsx:36`<br>`components/search/GlobalSearch.tsx:367` | No initial focus, keyboard containment, focus restoration, or shared nested scroll lock. | A shared focus/lock hook fixes all four overlays without changing their markup styling. |
| 2 | High | Modal overflow | `components/ui/Modal.tsx:52` | Background scroll is locked but tall dialog content has no viewport bound. | Bound only overflowing dialogs to the viewport and allow internal scrolling. |
| 3 | Medium | Mobile navigation | `components/nav/MobileNav.tsx:43`<br>`components/nav/MobileNav.tsx:80` | Unnamed dialog; selecting the active route does not change pathname and therefore does not close the drawer. | Add an accessible name and close on link selection. |
| 4 | High | Session state | `lib/useSessionProfile.ts:73` | An older in-flight response can overwrite a newer authentication result. | Ignore superseded responses using a per-hook request sequence. |
| 5 | High | Learning bookmarks | `lib/useLearningBookmarks.ts:13`<br>`lib/useLearningBookmarks.ts:39` | A permanent shared promise retains the first user’s data and logout leaves IDs visible. | Share only in-flight requests per user; clear local IDs on account changes. |
| 6 | Medium | Search | `components/search/GlobalSearch.tsx:21`<br>`components/search/GlobalSearch.tsx:93` | Old suggestions remain selectable while a new query loads; incoming defaultValue updates are ignored. | Clear stale results, abort obsolete fetches, match result query to current query, and sync incoming query. |
| 7 | Medium | Contact | `app/contact/ContactForm.tsx:14` | Rejected action skips busy cleanup and error display. | Catch rejection, preserve inputs, and reset sending in finally. |
| 8 | Medium | Profile | `app/account/profile/ProfileForm.tsx:38` | Rejected update leaves busy state; successful edit does not refresh header profile. | Catch/finally around update and emit existing session-change signal on success. |
| 9 | Medium | Withdrawal | `app/account/wallet/WithdrawForm.tsx:38` | Exact binary floating-point comparison rejects valid cents; rejected RPC leaves processing state. | Use a small arithmetic tolerance and existing failure state on rejection. |
| 10 | Medium | Notifications | `app/account/notifications/NotificationRow.tsx:21` | Optimistic read status never rolls back failed persistence. | Restore unread state on returned or thrown errors. |
| 11 | Medium | Project messages | `app/custom-projects/my-projects/[id]/MessageThread.tsx:39` | Rejected action leaves sending state; success clears newer text entered during the request. | Catch/finally and clear only the submitted text. |
| 12 | High | Async pending controls | `app/custom-projects/my-projects/[id]/AddonsPanel.tsx:36`<br>`app/custom-projects/my-projects/[id]/EditRequestPanel.tsx:56`<br>`app/account/saved-projects/RemoveSavedButton.tsx:7` | React 18 transition pending does not cover awaited requests, re-enabling controls too early. | Use explicit pending state through request completion and handle rejection. |
| 13 | Medium | Resume actions | `app/account/resume/[id]/projects/ProjectPicker.tsx:12`<br>`app/account/resume/[id]/jd-match/JdMatchPanel.tsx:13`<br>`app/account/resume/[id]/versions/VersionHistory.tsx:27`<br>`app/account/resume/[id]/versions/VersionHistory.tsx:40`<br>`app/account/resume/import/ImportWizard.tsx:115`<br>`app/resume/templates/TemplateGallery.tsx:52`<br>`components/resumeBuilder/ResumeCardActions.tsx:16`<br>`components/resumeBuilder/ResumeCardActions.tsx:28`<br>`components/resumeBuilder/ImportFromCampusEduxPanel.tsx:40` | Rejected actions bypass existing error displays and leave busy controls stuck. | Catch action rejection, reset busy state in finally, retain existing error UI. |
| 14 | High | Resume sharing | `components/resumeBuilder/ShareModal.tsx:32`<br>`components/resumeBuilder/ShareModal.tsx:38`<br>`components/resumeBuilder/ShareModal.tsx:45`<br>`components/resumeBuilder/ShareModal.tsx:95` | Clipboard errors escape; failed revoke/delete results are ignored; rejected create leaves busy state. | Check mutation results, propagate errors to existing modal error display, reset busy states. |
| 15 | High | Mock tests | `app/mock-tests/[testId]/MockTestRunner.tsx:58`<br>`app/mock-tests/[testId]/MockTestRunner.tsx:72`<br>`app/mock-tests/[testId]/MockTestRunner.tsx:56` | Rejected session/load/submit requests leave permanent gate/loading/submitting states. | Catch rejections and use existing error phase; release submission guard on failure. |
| 16 | Medium | Mock-test clock | `app/mock-tests/[testId]/MockTestRunner.tsx:161` | Timer counts callbacks instead of elapsed time, extending time under throttling. | Calculate remaining time from start timestamp and duration. |
| 17 | High | Job application state | `app/jobs/[id]/JobApplyPanel.tsx:79`<br>`app/jobs/[id]/JobApplyPanel.tsx:102` | An empty result does not clear the prior application; save rejection leaves pending state. | Clear absent application data and handle save rejection. |
| 18 | Medium | Input accessibility | `components/ui/Field.tsx:18`<br>`components/ui/Field.tsx:26`<br>`components/ui/Field.tsx:41` | invalid prop only sets styling, with no semantic invalid state. | Expose aria-invalid while preserving all CSS classes and caller overrides. |
| 19 | High | Custom-project draft | `app/custom-projects/_builder/useDraft.ts:48`<br>`app/custom-projects/_builder/useDraft.ts:78`<br>`app/custom-projects/_builder/useDraft.ts:83`<br>`app/custom-projects/start/BuilderStart.tsx:66`<br>`app/custom-projects/features/BuilderFeatures.tsx:285` | Immediate flush reads stale render state; errors are ignored; overlapping writes and pending autosave can undo clearing. | Keep latest draft in a ref, serialize writes, cancel timers on flush/clear, check DB errors, and stay on current step on failure. |
| 20 | Medium–High | Remaining rejected client actions | `app/onboarding/OnboardingForm.tsx:72`<br>`app/login/LoginView.tsx:53`<br>`app/register/RegisterView.tsx:47`<br>`app/jobs/[id]/JobApplyPanel.tsx:135`<br>`app/learning/[gridSlug]/[topicSlug]/LearningBookmarkButton.tsx:56`<br>`app/r/[token]/ReportShareButton.tsx:16`<br>`components/resumeBuilder/DemoContentBanner.tsx:29`<br>`components/resumeBuilder/DemoContentBanner.tsx:38`<br>`app/custom-projects/features/BuilderFeatures.tsx:215`<br>`app/custom-projects/features/BuilderFeatures.tsx:245`<br>`app/custom-projects/my-projects/[id]/EditRequestPanel.tsx:87`<br>`app/custom-projects/my-projects/[id]/EditRequestPanel.tsx:127` | Missing catches or ignored returned errors conceal failed operations or leave busy controls. | Use existing failure displays/toasts and reset busy flags; do not dismiss demo banner on failed mutation. |
| 21 | High | Resume autosave | `app/account/resume/[id]/edit/useAutosaveField.ts:29` | Overlapping saves can persist an older value last; obsolete completion can display Saved for a newer edit. | Serialize writes, suppress stale status callbacks, and skip unchanged mount values. |

Audit date: 26 October 2026 UTC. Findings were reported in chat before their corresponding edits. Locations above identify the baseline source; the full before/after diffs below have exact current hunk locations. Counts are **21 bug groups**, including repeated occurrences across components, not 21 individual statements.

**Result and scope**

All 21 reported groups are fixed. No dependencies, routes, branding, typography, colors, animations, or existing visible copy were changed. Existing generic error messages/toasts are reused for newly handled failure paths. Normal-state spacing is unchanged; the modal viewport bound fixes unreachable overflow. One small shared hook is necessary to coordinate focus and scroll ownership across nested overlays.

This is not a certification that the entire site is bug-free. Every website source file was included in the static inventory/compiler/lint scan; detailed manual review focused on interactive handlers and shared components. Dynamic routes and authenticated content require seeded fixtures to exercise completely. Admin and mobile source are outside the requested student-facing website scope; existing uncommitted work was preserved.

**Verification**

- Baseline and post-change Vitest: 935 passed, 12 intentionally skipped (85 test files passed, one skipped). Final continuation recheck also passed.
- Vitest still emits its existing Vite CJS API deprecation warning. This is a test-tooling warning, not a website runtime failure; tooling/config migration was left outside these UI fixes.
- Typecheck and lint passed; both the clean production build and final production build passed.
- All 20 browser regression scenarios passed using actual components with mocked backend failures (see `tests/ui-audit/README.md`).
- All 59 routes without dynamic IDs returned successful final responses (including signed-out redirects), with zero captured page runtime errors and no document-level horizontal overflow at 320, 375, 768, 1024, and 1920px. The remaining 22 dynamic route patterns were statically scanned, not fully browser-tested.
- Console warning coverage is limited: lint was clean, but the production smoke script captured page exceptions, not every console message. No claim is made that every runtime warning has been eliminated.
- Contact/modal screenshots at 320, 768, and 1920px preserve normal-state visuals. Tolerance: fewer than 500 color channels differ, each by no more than 5/255; one observed difference was 92 channels, max 4/255.
- Initial production smoke exposed stale generated module references (`undefined.call`). Preserving old `.next` under `/tmp` and rebuilding clean removed them; no source/config workaround was introduced.
- Literal internal href and local asset scan found no unmatched targets. Dynamic/CMS links are not proven by a literal scan.

**What remains unverified**

- Live payment settlement/reconciliation, email delivery, OAuth callback allowlists, session expiry, and two-user Supabase RLS isolation: require test accounts and provider/backend fixtures.
- Dynamic route records, authenticated page contents, all CMS images, empty/error combinations, and long-content layouts: static checks are not a substitute for real fixture data.
- Safari, Firefox, iOS/Android browsers and assistive-technology behavior: Chromium was exercised; no cross-browser certification.
- Performance under real production load and complete CLS/LCP measurement: not established by the smoke run.
- Existing audit suggestions that add downloads, sync local learning progress, alter design tokens/copy, or upgrade frameworks were not applied as UI bug fixes.

**Manual regression checklist**

- At 320/375/768/1024/1920px: open/close menu, search, share and preview; Tab/Shift+Tab remain inside, Escape closes only the top overlay, focus returns, and scrolling resumes.
- Go offline during contact/profile/onboarding, resume actions, bookmark, attachments, and withdrawal requests: errors appear, buttons recover, input remains available.
- Sign in as A, sign out, then sign in as B with delayed requests: header/bookmarks must not revert to A.
- Edit custom-project details and immediately continue; reload next step. Clear a draft while an autosave is queued; reload and confirm it stays cleared.
- Edit a resume repeatedly on a slow connection; latest value persists and Saved only appears after the latest write.
- Fail shared-resume revoke/delete: link remains shown with an error. Retry successfully and verify its public URL behavior.
- Background a running mock test, return, and check elapsed countdown; fail load/submit and verify recovery.
- With test payments and two test accounts, finish checkout/application/purchases and confirm owner-only access.

**Route coverage**

| Route pattern | Browser coverage |
|---|---|
| `/about` | HTTP 200; 0 page errors; five viewport widths |
| `/account/applications` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account/notifications` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account/profile` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account/purchases` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account/referral` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account/resume/[id]/ats` | Static only; needs dynamic ID/slug and backend fixture. |
| `/account/resume/[id]/edit` | Static only; needs dynamic ID/slug and backend fixture. |
| `/account/resume/[id]/jd-match` | Static only; needs dynamic ID/slug and backend fixture. |
| `/account/resume/[id]/preview` | Static only; needs dynamic ID/slug and backend fixture. |
| `/account/resume/[id]/projects` | Static only; needs dynamic ID/slug and backend fixture. |
| `/account/resume/[id]/versions` | Static only; needs dynamic ID/slug and backend fixture. |
| `/account/resume/import` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account/resume` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account/saved-jobs` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account/saved-projects` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/account/wallet` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/auth/confirm` | HTTP 200; 0 page errors; five viewport widths |
| `/blog/[slug]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/blog` | HTTP 200; 0 page errors; five viewport widths |
| `/coding-problems/[problemSlug]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/community-guidelines` | HTTP 200; 0 page errors; five viewport widths |
| `/compiler` | HTTP 200; 0 page errors; five viewport widths |
| `/contact` | HTTP 200; 0 page errors; five viewport widths |
| `/cookie-policy` | HTTP 200; 0 page errors; five viewport widths |
| `/custom-projects/checkout` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/custom-projects/estimate` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/custom-projects/features` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/custom-projects/my-projects/[id]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/custom-projects/my-projects` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/custom-projects` | HTTP 200; 0 page errors; five viewport widths |
| `/custom-projects/start` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/data-and-permissions` | HTTP 200; 0 page errors; five viewport widths |
| `/delete-account` | HTTP 200; 0 page errors; five viewport widths |
| `/disclaimer` | HTTP 200; 0 page errors; five viewport widths |
| `/email-verified` | HTTP 200; 0 page errors; five viewport widths |
| `/faq` | HTTP 200; 0 page errors; five viewport widths |
| `/forgot-password` | HTTP 200; 0 page errors; five viewport widths |
| `/grievance` | HTTP 200; 0 page errors; five viewport widths |
| `/jobs/[id]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/jobs/companies/[id]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/jobs/companies` | HTTP 200; 0 page errors; five viewport widths |
| `/jobs` | HTTP 200; 0 page errors; five viewport widths |
| `/learning/[gridSlug]/[topicSlug]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/learning/[gridSlug]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/learning` | HTTP 200; 0 page errors; five viewport widths |
| `/legal` | HTTP 200; 0 page errors; five viewport widths |
| `/login` | HTTP 200; 0 page errors; five viewport widths |
| `/logout` | HTTP 200; 0 page errors; five viewport widths; final URL `/` (redirect, protected content not tested) |
| `/mock-tests/[testId]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/mock-tests/[testId]/result/[attemptId]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/onboarding` | HTTP 200; 0 page errors; five viewport widths; final URL `/login` (redirect, protected content not tested) |
| `/` | HTTP 200; 0 page errors; five viewport widths |
| `/placement/notes/[id]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/placement/notes` | HTTP 200; 0 page errors; five viewport widths; final URL `/learning` (redirect, protected content not tested) |
| `/placement` | HTTP 200; 0 page errors; five viewport widths; final URL `/learning` (redirect, protected content not tested) |
| `/practice/interview-questions/[category]/[topic]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/practice/interview-questions/[category]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/practice/interview-questions` | HTTP 200; 0 page errors; five viewport widths |
| `/practice` | HTTP 200; 0 page errors; five viewport widths |
| `/practice/problems/[slug]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/practice/problems` | HTTP 200; 0 page errors; five viewport widths |
| `/practice/submissions` | HTTP 200; 0 page errors; five viewport widths |
| `/premium` | HTTP 200; 0 page errors; five viewport widths |
| `/privacy-policy` | HTTP 200; 0 page errors; five viewport widths |
| `/project-license` | HTTP 200; 0 page errors; five viewport widths |
| `/projects/[id]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/projects/category/[category]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/projects` | HTTP 200; 0 page errors; five viewport widths |
| `/projects/trending` | HTTP 200; 0 page errors; five viewport widths |
| `/r/[token]` | Static only; needs dynamic ID/slug and backend fixture. |
| `/referral` | HTTP 200; 0 page errors; five viewport widths |
| `/refund-policy` | HTTP 200; 0 page errors; five viewport widths |
| `/register` | HTTP 200; 0 page errors; five viewport widths |
| `/reset-password` | HTTP 200; 0 page errors; five viewport widths |
| `/resume` | HTTP 200; 0 page errors; five viewport widths |
| `/resume/templates` | HTTP 200; 0 page errors; five viewport widths |
| `/search` | HTTP 200; 0 page errors; five viewport widths |
| `/support` | HTTP 200; 0 page errors; five viewport widths |
| `/terms` | HTTP 200; 0 page errors; five viewport widths |

**Fixes, one file at a time — complete before/after diffs**

### website/src/app/account/notifications/NotificationRow.tsx (groups 10)

```diff
diff --git a/website/src/app/account/notifications/NotificationRow.tsx b/website/src/app/account/notifications/NotificationRow.tsx
index 29452e9..df89ff4 100644
--- a/website/src/app/account/notifications/NotificationRow.tsx
+++ b/website/src/app/account/notifications/NotificationRow.tsx
@@ -21,7 +21,12 @@ export default function NotificationRow({ notification }: { notification: Notifi
   async function markRead() {
     if (isRead) return;
     setIsRead(true);
-    await createBrowserSupabase().from("notifications").update({ is_read: true }).eq("id", notification.id);
+    try {
+      const { error } = await createBrowserSupabase().from("notifications").update({ is_read: true }).eq("id", notification.id);
+      if (error) setIsRead(false);
+    } catch {
+      setIsRead(false);
+    }
   }
 
   return (
```

### website/src/app/account/profile/ProfileForm.tsx (groups 8)

```diff
diff --git a/website/src/app/account/profile/ProfileForm.tsx b/website/src/app/account/profile/ProfileForm.tsx
index 9f2ad8f..bd3f065 100644
--- a/website/src/app/account/profile/ProfileForm.tsx
+++ b/website/src/app/account/profile/ProfileForm.tsx
@@ -2,6 +2,7 @@
 
 import { useMemo, useState } from "react";
 import { createBrowserSupabase } from "@/lib/supabase/browser";
+import { emitSessionChange } from "@/lib/sessionSignal";
 import type { AccountUser } from "@/lib/auth";
 import { Button, Field, Input, Select } from "@/components/ui";
 
@@ -37,25 +38,35 @@ export default function ProfileForm({ initial, catalog }: { initial: AccountUser
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
+    if (saving) return;
     setSaving(true);
     setError(null);
     setSaved(false);
-    const supabase = createBrowserSupabase();
-    const { error: updateError } = await supabase
-      .from("profiles")
-      .update({
-        full_name: fullName,
-        course,
-        branch,
-        year,
-        linkedin_url: linkedinUrl.trim() || null,
-        github_url: githubUrl.trim() || null,
-        portfolio_url: portfolioUrl.trim() || null,
-      })
-      .eq("id", initial.id);
-    setSaving(false);
-    if (updateError) setError(updateError.message);
-    else setSaved(true);
+    try {
+      const supabase = createBrowserSupabase();
+      const { error: updateError } = await supabase
+        .from("profiles")
+        .update({
+          full_name: fullName,
+          course,
+          branch,
+          year,
+          linkedin_url: linkedinUrl.trim() || null,
+          github_url: githubUrl.trim() || null,
+          portfolio_url: portfolioUrl.trim() || null,
+        })
+        .eq("id", initial.id);
+      setSaving(false);
+      if (updateError) setError(updateError.message);
+      else {
+        setSaved(true);
+        emitSessionChange();
+      }
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setSaving(false);
+    }
   }
 
   return (
```

### website/src/app/account/resume/[id]/edit/useAutosaveField.ts (groups 21)

```diff
diff --git a/website/src/app/account/resume/[id]/edit/useAutosaveField.ts b/website/src/app/account/resume/[id]/edit/useAutosaveField.ts
index a4f131e..e670c9f 100644
--- a/website/src/app/account/resume/[id]/edit/useAutosaveField.ts
+++ b/website/src/app/account/resume/[id]/edit/useAutosaveField.ts
@@ -15,32 +15,35 @@ export function useAutosaveField<T>(
   onStatusChange: (status: SaveStatus) => void,
   delayMs = 800,
 ) {
-  const isFirstRender = useRef(true);
+  const previousValue = useRef(value);
+  const writes = useRef<Promise<void>>(Promise.resolve());
   const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const latestValue = useRef(value);
   latestValue.current = value;
 
   useEffect(() => {
-    if (isFirstRender.current) {
-      isFirstRender.current = false;
-      return;
-    }
+    if (Object.is(previousValue.current, value)) return;
+    previousValue.current = value;
+    let current = true;
     if (timeoutRef.current) clearTimeout(timeoutRef.current);
     timeoutRef.current = setTimeout(() => {
       onStatusChange("saving");
       // A Server Action call also *rejects* on a transport failure (offline,
       // action-infra 5xx), not just resolves with `{ error }`. Without the
-      // `.catch` that becomes an unhandled rejection and the field is stuck
+      // catch that becomes an unhandled rejection and the field is stuck
       // on "Saving…" forever — surface it as a normal save error instead.
-      save(latestValue.current)
-        .then((result) => {
-          onStatusChange(result && typeof result === "object" && "ok" in result ? "saved" : "error");
-        })
-        .catch(() => {
-          onStatusChange("error");
-        });
+      const pendingValue = latestValue.current;
+      writes.current = writes.current.then(async () => {
+        try {
+          const result = await save(pendingValue);
+          if (current) onStatusChange(result && typeof result === "object" && "ok" in result ? "saved" : "error");
+        } catch {
+          if (current) onStatusChange("error");
+        }
+      });
     }, delayMs);
     return () => {
+      current = false;
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
     };
     // eslint-disable-next-line react-hooks/exhaustive-deps
```

### website/src/app/account/resume/[id]/jd-match/JdMatchPanel.tsx (groups 13)

```diff
diff --git a/website/src/app/account/resume/[id]/jd-match/JdMatchPanel.tsx b/website/src/app/account/resume/[id]/jd-match/JdMatchPanel.tsx
index 2327a02..1532a66 100644
--- a/website/src/app/account/resume/[id]/jd-match/JdMatchPanel.tsx
+++ b/website/src/app/account/resume/[id]/jd-match/JdMatchPanel.tsx
@@ -11,16 +11,23 @@ export default function JdMatchPanel({ resumeId }: { resumeId: string }) {
   const [checking, setChecking] = useState(false);
 
   async function handleCheck() {
+    if (checking) return;
     setChecking(true);
     setError(null);
-    const outcome = await matchResumeToJdAction(resumeId, jdText);
-    setChecking(false);
-    if ("error" in outcome) {
-      setError(outcome.error);
-      setResult(null);
-      return;
+    try {
+      const outcome = await matchResumeToJdAction(resumeId, jdText);
+      setChecking(false);
+      if ("error" in outcome) {
+        setError(outcome.error);
+        setResult(null);
+        return;
+      }
+      setResult(outcome);
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setChecking(false);
     }
-    setResult(outcome);
   }
 
   return (
```

### website/src/app/account/resume/[id]/projects/ProjectPicker.tsx (groups 13)

```diff
diff --git a/website/src/app/account/resume/[id]/projects/ProjectPicker.tsx b/website/src/app/account/resume/[id]/projects/ProjectPicker.tsx
index 1ebfd3a..74b1333 100644
--- a/website/src/app/account/resume/[id]/projects/ProjectPicker.tsx
+++ b/website/src/app/account/resume/[id]/projects/ProjectPicker.tsx
@@ -10,15 +10,22 @@ export default function ProjectPicker({ resumeId, projects }: { resumeId: string
   const [error, setError] = useState<string | null>(null);
 
   async function handleAdd(projectId: string) {
+    if (pendingId !== null) return;
     setPendingId(projectId);
     setError(null);
-    const result = await appendCustomProjectToResumeAction(resumeId, projectId);
-    setPendingId(null);
-    if ("error" in result) {
-      setError(result.error);
-      return;
+    try {
+      const result = await appendCustomProjectToResumeAction(resumeId, projectId);
+      setPendingId(null);
+      if ("error" in result) {
+        setError(result.error);
+        return;
+      }
+      setAddedIds((prev) => new Set(prev).add(projectId));
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setPendingId(null);
     }
-    setAddedIds((prev) => new Set(prev).add(projectId));
   }
 
   return (
```

### website/src/app/account/resume/[id]/versions/VersionHistory.tsx (groups 13)

```diff
diff --git a/website/src/app/account/resume/[id]/versions/VersionHistory.tsx b/website/src/app/account/resume/[id]/versions/VersionHistory.tsx
index f4a1f2a..9c213cd 100644
--- a/website/src/app/account/resume/[id]/versions/VersionHistory.tsx
+++ b/website/src/app/account/resume/[id]/versions/VersionHistory.tsx
@@ -25,31 +25,45 @@ export default function VersionHistory({ resumeId, initialVersions }: { resumeId
   }
 
   async function handleSaveVersion() {
+    if (saving || restoringId) return;
     setSaving(true);
     setError(null);
-    const result = await createResumeVersionAction(resumeId, label.trim() || "Manual save");
-    setSaving(false);
-    if ("error" in result) {
-      setError(result.error);
-      return;
+    try {
+      const result = await createResumeVersionAction(resumeId, label.trim() || "Manual save");
+      setSaving(false);
+      if ("error" in result) {
+        setError(result.error);
+        return;
+      }
+      setLabel("");
+      await refresh();
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setSaving(false);
     }
-    setLabel("");
-    await refresh();
   }
 
   async function handleRestore(versionId: string) {
+    if (saving || restoringId) return;
     if (!window.confirm("Restore this version? Your current content will be saved as a new version first, so you can undo this.")) {
       return;
     }
     setRestoringId(versionId);
     setError(null);
-    const result = await restoreResumeVersionAction(versionId);
-    setRestoringId(null);
-    if ("error" in result) {
-      setError(result.error);
-      return;
+    try {
+      const result = await restoreResumeVersionAction(versionId);
+      setRestoringId(null);
+      if ("error" in result) {
+        setError(result.error);
+        return;
+      }
+      router.push(`/account/resume/${resumeId}/edit`);
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setRestoringId(null);
     }
-    router.push(`/account/resume/${resumeId}/edit`);
   }
 
   return (
```

### website/src/app/account/resume/import/ImportWizard.tsx (groups 13)

```diff
diff --git a/website/src/app/account/resume/import/ImportWizard.tsx b/website/src/app/account/resume/import/ImportWizard.tsx
index 3b03659..82aac7a 100644
--- a/website/src/app/account/resume/import/ImportWizard.tsx
+++ b/website/src/app/account/resume/import/ImportWizard.tsx
@@ -113,27 +113,34 @@ export default function ImportWizard() {
   }
 
   async function handleImport() {
+    if (importing) return;
     if (!review) return;
     setImporting(true);
     setImportError(null);
-    const result = await createResumeFromImportAction({
-      fullName: review.fullName,
-      jobTitle: review.jobTitle,
-      email: review.email,
-      phone: review.phone,
-      location: review.location,
-      linkedin: review.linkedin,
-      website: review.website,
-      education: review.education,
-      technicalSkills: review.skillsText.split(",").map((s) => s.trim()).filter(Boolean),
-      sections: review.sections,
-    });
-    setImporting(false);
-    if ("error" in result) {
-      setImportError(result.error);
-      return;
+    try {
+      const result = await createResumeFromImportAction({
+        fullName: review.fullName,
+        jobTitle: review.jobTitle,
+        email: review.email,
+        phone: review.phone,
+        location: review.location,
+        linkedin: review.linkedin,
+        website: review.website,
+        education: review.education,
+        technicalSkills: review.skillsText.split(",").map((s) => s.trim()).filter(Boolean),
+        sections: review.sections,
+      });
+      setImporting(false);
+      if ("error" in result) {
+        setImportError(result.error);
+        return;
+      }
+      router.push(`/account/resume/${result.resumeId}/edit`);
+    } catch (err) {
+      setImportError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setImporting(false);
     }
-    router.push(`/account/resume/${result.resumeId}/edit`);
   }
 
   if (!review) {
```

### website/src/app/account/saved-projects/RemoveSavedButton.tsx (groups 12)

```diff
diff --git a/website/src/app/account/saved-projects/RemoveSavedButton.tsx b/website/src/app/account/saved-projects/RemoveSavedButton.tsx
index fbf701c..c63b9e9 100644
--- a/website/src/app/account/saved-projects/RemoveSavedButton.tsx
+++ b/website/src/app/account/saved-projects/RemoveSavedButton.tsx
@@ -1,22 +1,29 @@
 "use client";
 
-import { useState, useTransition } from "react";
+import { useState } from "react";
 import { removeFromWishlistAction } from "@/lib/actions/wishlist";
 
 export function RemoveSavedButton({ projectId }: { projectId: string }) {
-  const [pending, start] = useTransition();
+  const [pending, setPending] = useState(false);
   const [error, setError] = useState<string | null>(null);
   return (
     <div>
       <button
         type="button"
         disabled={pending}
-        onClick={() =>
-          start(async () => {
+        onClick={async () => {
+          if (pending) return;
+          setPending(true);
+          setError(null);
+          try {
             const r = await removeFromWishlistAction(projectId);
             setError("error" in r ? r.error : null);
-          })
-        }
+          } catch (err) {
+            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+          } finally {
+            setPending(false);
+          }
+        }}
         className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
       >
         {pending ? "Removing…" : "Remove from saved"}
```

### website/src/app/account/wallet/WithdrawForm.tsx (groups 9)

```diff
diff --git a/website/src/app/account/wallet/WithdrawForm.tsx b/website/src/app/account/wallet/WithdrawForm.tsx
index 7cc7ee5..9fcb52e 100644
--- a/website/src/app/account/wallet/WithdrawForm.tsx
+++ b/website/src/app/account/wallet/WithdrawForm.tsx
@@ -36,10 +36,11 @@ export default function WithdrawForm({
   }
 
   async function handleWithdraw() {
+    if (status === "processing") return;
     const value = Number(amount);
     let problem: string | null = null;
     if (!Number.isFinite(value) || value <= 0) problem = "Enter an amount to withdraw.";
-    else if (Math.round(value * 100) !== value * 100) problem = "Amount can have at most 2 decimal places.";
+    else if (Math.abs(Math.round(value * 100) - value * 100) > 1e-8) problem = "Amount can have at most 2 decimal places.";
     else if (value < minPayout) problem = `Minimum withdrawal amount is ${formatINR(minPayout)}.`;
     else if (value > balance) problem = "You can't withdraw more than your wallet balance.";
     else if (!isValidUpiId(upiId)) problem = "Enter a valid UPI ID (for example name@bank).";
@@ -51,19 +52,24 @@ export default function WithdrawForm({
 
     setStatus("processing");
     setError(null);
-    const { error: rpcError } = await createBrowserSupabase().rpc("request_withdrawal", {
-      p_amount: value,
-      p_upi_id: upiId.trim(),
-    });
-    if (rpcError) {
+    try {
+      const { error: rpcError } = await createBrowserSupabase().rpc("request_withdrawal", {
+        p_amount: value,
+        p_upi_id: upiId.trim(),
+      });
+      if (rpcError) {
+        setStatus("error");
+        setError(rpcError.message || "Couldn't submit your withdrawal request. Please try again.");
+        return;
+      }
+      setStatus("done");
+      setAmount("");
+      setUpiId("");
+      router.refresh();
+    } catch (err) {
       setStatus("error");
-      setError(rpcError.message || "Couldn't submit your withdrawal request. Please try again.");
-      return;
+      setError(err instanceof Error ? err.message : "Couldn't submit your withdrawal request. Please try again.");
     }
-    setStatus("done");
-    setAmount("");
-    setUpiId("");
-    router.refresh();
   }
 
   return (
```

### website/src/app/contact/ContactForm.tsx (groups 7)

```diff
diff --git a/website/src/app/contact/ContactForm.tsx b/website/src/app/contact/ContactForm.tsx
index ad698be..ea8a9cd 100644
--- a/website/src/app/contact/ContactForm.tsx
+++ b/website/src/app/contact/ContactForm.tsx
@@ -13,18 +13,25 @@ export default function ContactForm() {
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
+    if (status === "sending") return;
     setStatus("sending");
     setError(null);
-    const result = await submitContactMessageAction({ name, email, message });
-    if ("error" in result) {
-      setStatus("idle");
-      setError(result.error);
-      return;
+    try {
+      const result = await submitContactMessageAction({ name, email, message });
+      if ("error" in result) {
+        setStatus("idle");
+        setError(result.error);
+        return;
+      }
+      setStatus("sent");
+      setName("");
+      setEmail("");
+      setMessage("");
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setStatus((current) => current === "sending" ? "idle" : current);
     }
-    setStatus("sent");
-    setName("");
-    setEmail("");
-    setMessage("");
   }
 
   if (status === "sent") {
```

### website/src/app/custom-projects/_builder/useDraft.ts (groups 19)

```diff
diff --git a/website/src/app/custom-projects/_builder/useDraft.ts b/website/src/app/custom-projects/_builder/useDraft.ts
index ddaa409..313ae93 100644
--- a/website/src/app/custom-projects/_builder/useDraft.ts
+++ b/website/src/app/custom-projects/_builder/useDraft.ts
@@ -1,6 +1,7 @@
 "use client";
 
 import { useCallback, useEffect, useRef, useState } from "react";
+import { toast } from "@/components/ui/Toast";
 import { createBrowserSupabase } from "@/lib/supabase/browser";
 import { type BuilderDraft, emptyDraft, normalizeDraft } from "@/lib/customProjects";
 
@@ -16,6 +17,10 @@ export function useDraft() {
   const [userId, setUserId] = useState<string | null>(null);
   const [saving, setSaving] = useState(false);
   const dirtyRef = useRef(false);
+  const latestDraft = useRef(draft);
+  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
+  const writes = useRef<Promise<void>>(Promise.resolve());
+  const [loadError, setLoadError] = useState<Error | null>(null);
 
   // initial load
   useEffect(() => {
@@ -31,26 +36,40 @@ export function useDraft() {
         return;
       }
       setUserId(user.id);
-      const { data } = await supabase
+      const { data, error } = await supabase
         .from("custom_project_drafts")
         .select("payload")
         .eq("user_id", user.id)
         .maybeSingle();
       if (cancelled) return;
-      if (data?.payload) setDraft(normalizeDraft(data.payload));
+      if (error) throw new Error(error.message);
+      if (data?.payload) {
+        latestDraft.current = normalizeDraft(data.payload);
+        setDraft(latestDraft.current);
+      }
       setLoaded(true);
-    })();
+    })().catch((err) => {
+      if (!cancelled) setLoadError(err instanceof Error ? err : new Error("Something went wrong. Please try again."));
+    });
     return () => {
       cancelled = true;
     };
   }, []);
 
   const persist = useCallback(
-    async (payload: BuilderDraft, uid: string) => {
-      setSaving(true);
-      const supabase = createBrowserSupabase();
-      await supabase.from("custom_project_drafts").upsert({ user_id: uid, payload }, { onConflict: "user_id" });
-      setSaving(false);
+    (payload: BuilderDraft, uid: string) => {
+      const write = writes.current.catch(() => {}).then(async () => {
+        setSaving(true);
+        try {
+          const { error } = await createBrowserSupabase().from("custom_project_drafts")
+            .upsert({ user_id: uid, payload }, { onConflict: "user_id" });
+          if (error) throw new Error(error.message);
+        } finally {
+          setSaving(false);
+        }
+      });
+      writes.current = write;
+      return write;
     },
     [],
   );
@@ -58,35 +77,46 @@ export function useDraft() {
   // debounced autosave
   useEffect(() => {
     if (!loaded || !userId || !dirtyRef.current) return;
-    const t = setTimeout(() => {
-      persist(draft, userId);
+    timer.current = setTimeout(() => {
+      timer.current = null;
+      persist(latestDraft.current, userId).catch((err) => {
+        toast({ title: "Could not save", description: err instanceof Error ? err.message : undefined, tone: "error" });
+      });
     }, 700);
-    return () => clearTimeout(t);
+    return () => { if (timer.current) clearTimeout(timer.current); };
   }, [draft, loaded, userId, persist]);
 
   const patch = useCallback((p: Partial<BuilderDraft>) => {
     dirtyRef.current = true;
-    setDraft((d) => ({ ...d, ...p }));
+    latestDraft.current = { ...latestDraft.current, ...p };
+    setDraft(latestDraft.current);
   }, []);
 
   const update = useCallback((fn: (d: BuilderDraft) => BuilderDraft) => {
     dirtyRef.current = true;
-    setDraft((d) => fn(d));
+    latestDraft.current = fn(latestDraft.current);
+    setDraft(latestDraft.current);
   }, []);
 
   /** Flush any pending change immediately — call before navigating to the next step. */
   const saveNow = useCallback(async () => {
     if (!userId) return;
-    await persist(draft, userId);
-  }, [userId, draft, persist]);
+    if (timer.current) clearTimeout(timer.current);
+    await persist(latestDraft.current, userId);
+  }, [userId, persist]);
 
   const clearDraft = useCallback(async () => {
     if (!userId) return;
-    const supabase = createBrowserSupabase();
-    await supabase.from("custom_project_drafts").delete().eq("user_id", userId);
-    setDraft(emptyDraft());
+    if (timer.current) clearTimeout(timer.current);
+    await writes.current.catch(() => {});
+    const { error } = await createBrowserSupabase().from("custom_project_drafts").delete().eq("user_id", userId);
+    if (error) throw new Error(error.message);
     dirtyRef.current = false;
+    latestDraft.current = emptyDraft();
+    setDraft(latestDraft.current);
   }, [userId]);
 
+  if (loadError) throw loadError;
+
   return { draft, patch, update, saveNow, clearDraft, loaded, userId, saving };
 }
```

### website/src/app/custom-projects/features/BuilderFeatures.tsx (groups 19, 20)

```diff
diff --git a/website/src/app/custom-projects/features/BuilderFeatures.tsx b/website/src/app/custom-projects/features/BuilderFeatures.tsx
index 2cbb8c6..9e937dc 100644
--- a/website/src/app/custom-projects/features/BuilderFeatures.tsx
+++ b/website/src/app/custom-projects/features/BuilderFeatures.tsx
@@ -1,5 +1,7 @@
 "use client";
 
+import { toast } from "@/components/ui/Toast";
+
 import { useEffect, useMemo, useState } from "react";
 import Link from "next/link";
 import { useRouter } from "next/navigation";
@@ -147,10 +149,8 @@ export default function BuilderFeatures({
         </p>
         <Button
           className="mt-5"
-          onClick={async () => {
-            await saveNow();
-            router.push("/custom-projects/estimate");
-          }}
+          onClick={handleContinue}
+          loading={going}
         >
           Review mentoring estimate
         </Button>
@@ -237,6 +237,8 @@ export default function BuilderFeatures({
         return;
       }
       patch({ projectImagePath: path });
+    } catch (err) {
+      setUploadError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
     } finally {
       setImageBusy(false);
     }
@@ -277,6 +279,8 @@ export default function BuilderFeatures({
           ],
         }));
       }
+    } catch (err) {
+      setUploadError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
     } finally {
       setFileBusy(false);
     }
@@ -284,8 +288,14 @@ export default function BuilderFeatures({
 
   async function handleContinue() {
     setGoing(true);
-    await saveNow();
-    router.push("/custom-projects/estimate");
+    try {
+      await saveNow();
+      router.push("/custom-projects/estimate");
+    } catch (err) {
+      toast({ title: "Could not save", description: err instanceof Error ? err.message : undefined, tone: "error" });
+    } finally {
+      setGoing(false);
+    }
   }
 
   return (
```

### website/src/app/custom-projects/my-projects/[id]/AddonsPanel.tsx (groups 12)

```diff
diff --git a/website/src/app/custom-projects/my-projects/[id]/AddonsPanel.tsx b/website/src/app/custom-projects/my-projects/[id]/AddonsPanel.tsx
index 3533a0b..22399f9 100644
--- a/website/src/app/custom-projects/my-projects/[id]/AddonsPanel.tsx
+++ b/website/src/app/custom-projects/my-projects/[id]/AddonsPanel.tsx
@@ -1,6 +1,6 @@
 "use client";
 
-import { useState, useTransition } from "react";
+import { useState } from "react";
 import { useRouter } from "next/navigation";
 import { Pencil, Plus, Trash2 } from "lucide-react";
 import { Badge, Button, Field, Input, Textarea, toast, type BadgeTone } from "@/components/ui";
@@ -33,15 +33,19 @@ function AddonForm({
 }) {
   const [title, setTitle] = useState(initial?.title ?? "");
   const [description, setDescription] = useState(initial?.description ?? "");
-  const [pending, start] = useTransition();
+  const [pending, setPending] = useState(false);
   return (
     <form
       className="space-y-3 rounded-xl border border-line bg-surface p-4"
-      onSubmit={(e) => {
+      onSubmit={async (e) => {
         e.preventDefault();
-        start(async () => {
+        if (pending) return;
+        setPending(true);
+        try {
           if (await onSubmit({ title, description })) onCancel();
-        });
+        } finally {
+          setPending(false);
+        }
       }}
     >
       <Field label="Feature" htmlFor="addon-title" required>
@@ -81,14 +85,19 @@ export default function AddonsPanel({
   const [busyId, setBusyId] = useState<string | null>(null);
 
   async function run(result: Promise<{ ok: true } | { error: string }>, success: string): Promise<boolean> {
-    const res = await result;
-    if ("error" in res) {
-      toast({ title: "Something went wrong", description: res.error, tone: "error" });
+    try {
+      const res = await result;
+      if ("error" in res) {
+        toast({ title: "Something went wrong", description: res.error, tone: "error" });
+        return false;
+      }
+      toast({ title: success, tone: "success" });
+      router.refresh();
+      return true;
+    } catch (err) {
+      toast({ title: "Something went wrong", description: err instanceof Error ? err.message : undefined, tone: "error" });
       return false;
     }
-    toast({ title: success, tone: "success" });
-    router.refresh();
-    return true;
   }
 
   async function act(id: string, fn: () => Promise<boolean>) {
```

### website/src/app/custom-projects/my-projects/[id]/EditRequestPanel.tsx (groups 12, 20)

```diff
diff --git a/website/src/app/custom-projects/my-projects/[id]/EditRequestPanel.tsx b/website/src/app/custom-projects/my-projects/[id]/EditRequestPanel.tsx
index f20bc02..b3986c6 100644
--- a/website/src/app/custom-projects/my-projects/[id]/EditRequestPanel.tsx
+++ b/website/src/app/custom-projects/my-projects/[id]/EditRequestPanel.tsx
@@ -1,6 +1,6 @@
 "use client";
 
-import { useRef, useState, useTransition } from "react";
+import { useRef, useState } from "react";
 import { useRouter } from "next/navigation";
 import { Paperclip, Pencil, Plus, Trash2, X } from "lucide-react";
 import { Button, Field, Input, Textarea, toast } from "@/components/ui";
@@ -53,7 +53,7 @@ export default function EditRequestPanel({
   const router = useRouter();
   const [open, setOpen] = useState(false);
   const [form, setForm] = useState<EditableRequest>(initial);
-  const [pending, start] = useTransition();
+  const [pending, setPending] = useState(false);
   const [fileBusy, setFileBusy] = useState(false);
   const fileInput = useRef<HTMLInputElement | null>(null);
 
@@ -66,13 +66,15 @@ export default function EditRequestPanel({
     return out;
   }
 
-  function save() {
+  async function save() {
+    if (pending) return;
     const changes = changedFields();
     if (Object.keys(changes).length === 0) {
       setOpen(false);
       return;
     }
-    start(async () => {
+    setPending(true);
+    try {
       const res = await updateCustomProjectRequestAction({ requestId, changes });
       if ("error" in res) {
         toast({ title: "Could not save", description: res.error, tone: "error" });
@@ -81,7 +83,11 @@ export default function EditRequestPanel({
       toast({ title: "Request updated", description: "The team has been notified.", tone: "success" });
       setOpen(false);
       router.refresh();
-    });
+    } catch (err) {
+      toast({ title: "Could not save", description: err instanceof Error ? err.message : undefined, tone: "error" });
+    } finally {
+      setPending(false);
+    }
   }
 
   async function addFiles(list: FileList | null) {
@@ -118,6 +124,8 @@ export default function EditRequestPanel({
         }
       }
       router.refresh();
+    } catch (err) {
+      toast({ title: "Something went wrong", description: err instanceof Error ? err.message : undefined, tone: "error" });
     } finally {
       setFileBusy(false);
       if (fileInput.current) fileInput.current.value = "";
@@ -127,10 +135,16 @@ export default function EditRequestPanel({
   async function removeFile(id: string, name: string) {
     if (!window.confirm(`Remove "${name}"?`)) return;
     setFileBusy(true);
-    const res = await removeCustomProjectAttachmentAction({ fileId: id });
-    setFileBusy(false);
-    if ("error" in res) toast({ title: "Could not remove", description: res.error, tone: "error" });
-    else router.refresh();
+    try {
+      const res = await removeCustomProjectAttachmentAction({ fileId: id });
+      setFileBusy(false);
+      if ("error" in res) toast({ title: "Could not remove", description: res.error, tone: "error" });
+      else router.refresh();
+    } catch (err) {
+      toast({ title: "Could not remove", description: err instanceof Error ? err.message : undefined, tone: "error" });
+    } finally {
+      setFileBusy(false);
+    }
   }
 
   if (!open) {
```

### website/src/app/custom-projects/my-projects/[id]/MessageThread.tsx (groups 11)

```diff
diff --git a/website/src/app/custom-projects/my-projects/[id]/MessageThread.tsx b/website/src/app/custom-projects/my-projects/[id]/MessageThread.tsx
index 3aac662..f2f46fe 100644
--- a/website/src/app/custom-projects/my-projects/[id]/MessageThread.tsx
+++ b/website/src/app/custom-projects/my-projects/[id]/MessageThread.tsx
@@ -38,18 +38,25 @@ export default function MessageThread({
 
   async function handleSend(e: React.FormEvent) {
     e.preventDefault();
+    if (sending) return;
     const trimmed = body.trim();
     if (!trimmed) return;
     setSending(true);
     setError(null);
-    const result = await sendCustomProjectMessageAction({ requestId, body: trimmed });
-    setSending(false);
-    if ("error" in result) {
-      setError(result.error);
-      return;
+    try {
+      const result = await sendCustomProjectMessageAction({ requestId, body: trimmed });
+      setSending(false);
+      if ("error" in result) {
+        setError(result.error);
+        return;
+      }
+      setBody((current) => current.trim() === trimmed ? "" : current);
+      await refresh();
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setSending(false);
     }
-    setBody("");
-    await refresh();
   }
 
   return (
```

### website/src/app/custom-projects/start/BuilderStart.tsx (groups 19)

```diff
diff --git a/website/src/app/custom-projects/start/BuilderStart.tsx b/website/src/app/custom-projects/start/BuilderStart.tsx
index 7a46654..cb6ce28 100644
--- a/website/src/app/custom-projects/start/BuilderStart.tsx
+++ b/website/src/app/custom-projects/start/BuilderStart.tsx
@@ -1,5 +1,7 @@
 "use client";
 
+import { toast } from "@/components/ui/Toast";
+
 import { useRouter } from "next/navigation";
 import { useState } from "react";
 import { ArrowRight, ChevronDown, GraduationCap, Info, User, Briefcase, Layers, Rocket, Globe } from "lucide-react";
@@ -81,6 +83,8 @@ export default function BuilderStart() {
       }));
       await saveNow();
       router.push("/custom-projects/features");
+    } catch (err) {
+      toast({ title: "Could not save", description: err instanceof Error ? err.message : undefined, tone: "error" });
     } finally {
       setGoing(false);
     }
@@ -301,7 +305,9 @@ export default function BuilderStart() {
         <button
           type="button"
           onClick={() => {
-            if (confirm("Discard this draft and start over?")) clearDraft();
+            if (confirm("Discard this draft and start over?")) {
+              clearDraft().catch((err) => toast({ title: "Could not save", description: err instanceof Error ? err.message : undefined, tone: "error" }));
+            }
           }}
           className="text-xs font-medium text-ink-muted underline hover:text-danger disabled:opacity-50"
           disabled={!userId}
```

### website/src/app/jobs/[id]/JobApplyPanel.tsx (groups 17, 20)

```diff
diff --git a/website/src/app/jobs/[id]/JobApplyPanel.tsx b/website/src/app/jobs/[id]/JobApplyPanel.tsx
index 8ce98c7..856a0eb 100644
--- a/website/src/app/jobs/[id]/JobApplyPanel.tsx
+++ b/website/src/app/jobs/[id]/JobApplyPanel.tsx
@@ -76,7 +76,7 @@ export default function JobApplyPanel({ jobId, externalApply = false }: { jobId:
       supabase.from("resumes").select("id,file_name,uploaded_at").eq("user_id", user.id).order("uploaded_at", { ascending: false }),
     ]);
 
-    if (appliedRes.data) setApplied({ status: appliedRes.data.status, created_at: appliedRes.data.created_at });
+    setApplied(appliedRes.data ? { status: appliedRes.data.status, created_at: appliedRes.data.created_at } : null);
     setIsSaved(!!savedRes.data);
     const rows = (resumesRes.data ?? []) as ResumeRow[];
     setResumes(rows);
@@ -100,15 +100,22 @@ export default function JobApplyPanel({ jobId, externalApply = false }: { jobId:
   }, [sessionLoading, sessionUserId, load]);
 
   async function handleToggleSave() {
+    if (savePending) return;
     setSavePending(true);
     setSaveError(null);
-    const result = await toggleSaveJobAction(jobId);
-    setSavePending(false);
-    if ("error" in result) {
-      setSaveError(result.error);
-      return;
+    try {
+      const result = await toggleSaveJobAction(jobId);
+      setSavePending(false);
+      if ("error" in result) {
+        setSaveError(result.error);
+        return;
+      }
+      setIsSaved(result.saved);
+    } catch (err) {
+      setSaveError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setSavePending(false);
     }
-    setIsSaved(result.saved);
   }
 
   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
@@ -178,6 +185,8 @@ export default function JobApplyPanel({ jobId, externalApply = false }: { jobId:
       }
       setApplied({ status: "in_review", created_at: new Date().toISOString() });
       await load();
+    } catch (err) {
+      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
     } finally {
       setSubmitting(false);
     }
```

### website/src/app/learning/[gridSlug]/[topicSlug]/LearningBookmarkButton.tsx (groups 20)

```diff
diff --git a/website/src/app/learning/[gridSlug]/[topicSlug]/LearningBookmarkButton.tsx b/website/src/app/learning/[gridSlug]/[topicSlug]/LearningBookmarkButton.tsx
index bf081eb..30ba57c 100644
--- a/website/src/app/learning/[gridSlug]/[topicSlug]/LearningBookmarkButton.tsx
+++ b/website/src/app/learning/[gridSlug]/[topicSlug]/LearningBookmarkButton.tsx
@@ -56,28 +56,34 @@ export function LearningBookmarkButton({ topicId, slugPath }: { topicId: string;
   async function toggle() {
     setPending(true);
     setError(null);
-    const { createBrowserSupabase } = await import("@/lib/supabase/browser");
-    const supabase = createBrowserSupabase();
-    const {
-      data: { user },
-    } = await supabase.auth.getUser();
-    if (!user) {
-      setPhase("anon");
+    try {
+      const { createBrowserSupabase } = await import("@/lib/supabase/browser");
+      const supabase = createBrowserSupabase();
+      const {
+        data: { user },
+      } = await supabase.auth.getUser();
+      if (!user) {
+        setPhase("anon");
+        setPending(false);
+        return;
+      }
+      const next = !bookmarked;
+      const res = next
+        ? await supabase
+            .from("learning_bookmarks")
+            .upsert({ user_id: user.id, topic_id: topicId }, { onConflict: "user_id,topic_id" })
+        : await supabase.from("learning_bookmarks").delete().eq("user_id", user.id).eq("topic_id", topicId);
       setPending(false);
-      return;
-    }
-    const next = !bookmarked;
-    const res = next
-      ? await supabase
-          .from("learning_bookmarks")
-          .upsert({ user_id: user.id, topic_id: topicId }, { onConflict: "user_id,topic_id" })
-      : await supabase.from("learning_bookmarks").delete().eq("user_id", user.id).eq("topic_id", topicId);
-    setPending(false);
-    if (res.error) {
+      if (res.error) {
+        setError("Couldn't update the bookmark. Try again.");
+        return;
+      }
+      setBookmarked(next);
+    } catch {
       setError("Couldn't update the bookmark. Try again.");
-      return;
+    } finally {
+      setPending(false);
     }
-    setBookmarked(next);
   }
 
   // Same box as the button that replaces it (`max-sm:h-11` below, and roughly
```

### website/src/app/login/LoginView.tsx (groups 20)

```diff
diff --git a/website/src/app/login/LoginView.tsx b/website/src/app/login/LoginView.tsx
index 1b4bb32..da49df2 100644
--- a/website/src/app/login/LoginView.tsx
+++ b/website/src/app/login/LoginView.tsx
@@ -55,25 +55,30 @@ function LoginForm() {
     setError(null);
     setGoogleLoading(true);
 
-    const supabase = createBrowserSupabase();
-    // Reuses safeInternalPath so the callback route can only ever bounce back
-    // to a same-origin path — this "next" travels through the Google
-    // redirect round trip as a plain query param.
-    const redirectTo = new URL("/auth/callback", window.location.origin);
-    redirectTo.searchParams.set("next", safeInternalPath(searchParams.get("next")));
-
-    const { error: oauthError } = await supabase.auth.signInWithOAuth({
-      provider: "google",
-      options: { redirectTo: redirectTo.toString() },
-    });
-
-    if (oauthError) {
-      setError(oauthError.message ?? "Could not start Google sign-in.");
+    try {
+      const supabase = createBrowserSupabase();
+      // Reuses safeInternalPath so the callback route can only ever bounce back
+      // to a same-origin path — this "next" travels through the Google
+      // redirect round trip as a plain query param.
+      const redirectTo = new URL("/auth/callback", window.location.origin);
+      redirectTo.searchParams.set("next", safeInternalPath(searchParams.get("next")));
+
+      const { error: oauthError } = await supabase.auth.signInWithOAuth({
+        provider: "google",
+        options: { redirectTo: redirectTo.toString() },
+      });
+
+      if (oauthError) {
+        setError(oauthError.message ?? "Could not start Google sign-in.");
+        setGoogleLoading(false);
+        return;
+      }
+      // Success leaves googleLoading true — the browser is already navigating
+      // to Google, so there's no "done" state to return to on this page.
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
       setGoogleLoading(false);
-      return;
     }
-    // Success leaves googleLoading true — the browser is already navigating
-    // to Google, so there's no "done" state to return to on this page.
   }
 
   async function handleSubmit(e: React.FormEvent) {
```

### website/src/app/mock-tests/[testId]/MockTestRunner.tsx (groups 15, 16)

```diff
diff --git a/website/src/app/mock-tests/[testId]/MockTestRunner.tsx b/website/src/app/mock-tests/[testId]/MockTestRunner.tsx
index 947f266..0857637 100644
--- a/website/src/app/mock-tests/[testId]/MockTestRunner.tsx
+++ b/website/src/app/mock-tests/[testId]/MockTestRunner.tsx
@@ -63,7 +63,9 @@ export function MockTestRunner({
       } = await supabase.auth.getUser();
       if (!active) return;
       setPhase(user ? { k: "intro" } : { k: "signin" });
-    })();
+    })().catch(() => {
+      if (active) setPhase({ k: "error", message: "Couldn't load the questions. Please try again." });
+    });
     return () => {
       active = false;
     };
@@ -71,47 +73,51 @@ export function MockTestRunner({
 
   const startTest = useCallback(async () => {
     setPhase({ k: "loading" });
-    let questions: Question[];
-    if (scope === "topic") {
-      const { data, error } = await supabase
-        .from("test_questions")
-        .select("id,question_text,options,marks,sort_order")
-        .eq("test_id", testId)
-        .order("sort_order", { ascending: true });
-      if (error) {
-        setPhase({ k: "error", message: "Couldn't load the questions. Please try again." });
-        return;
+    try {
+      let questions: Question[];
+      if (scope === "topic") {
+        const { data, error } = await supabase
+          .from("test_questions")
+          .select("id,question_text,options,marks,sort_order")
+          .eq("test_id", testId)
+          .order("sort_order", { ascending: true });
+        if (error) {
+          setPhase({ k: "error", message: "Couldn't load the questions. Please try again." });
+          return;
+        }
+        questions = (data ?? []).map((r) => ({
+          id: r.id as string,
+          question_text: r.question_text as string,
+          options: (r.options ?? []) as string[],
+          marks: (r.marks ?? 1) as number,
+        }));
+      } else {
+        // Chapter / course tests: a fresh random sample every attempt, drawn
+        // server-side from the live pool (practice_test_pool, 0091/063).
+        const { data, error } = await supabase.rpc("practice_test_questions", { p_test_id: testId, p_platform: "website" });
+        if (error) {
+          setPhase({ k: "error", message: "Couldn't load the questions. Please try again." });
+          return;
+        }
+        questions = (Array.isArray(data) ? data : []).map((r) => ({
+          id: r.id as string,
+          question_text: r.question_text as string,
+          options: (r.options ?? []) as string[],
+          marks: (r.marks ?? 1) as number,
+        }));
       }
-      questions = (data ?? []).map((r) => ({
-        id: r.id as string,
-        question_text: r.question_text as string,
-        options: (r.options ?? []) as string[],
-        marks: (r.marks ?? 1) as number,
-      }));
-    } else {
-      // Chapter / course tests: a fresh random sample every attempt, drawn
-      // server-side from the live pool (practice_test_pool, 0091/063).
-      const { data, error } = await supabase.rpc("practice_test_questions", { p_test_id: testId, p_platform: "website" });
-      if (error) {
-        setPhase({ k: "error", message: "Couldn't load the questions. Please try again." });
+      if (questions.length === 0) {
+        setPhase(isPremium ? { k: "premium" } : { k: "error", message: "This test has no questions yet." });
         return;
       }
-      questions = (Array.isArray(data) ? data : []).map((r) => ({
-        id: r.id as string,
-        question_text: r.question_text as string,
-        options: (r.options ?? []) as string[],
-        marks: (r.marks ?? 1) as number,
-      }));
+      startedAt.current = Date.now();
+      setSecondsLeft(durationMinutes > 0 ? durationMinutes * 60 : null);
+      setCurrent(0);
+      setAnswers({});
+      setPhase({ k: "quiz", questions });
+    } catch {
+      setPhase({ k: "error", message: "Couldn't load the questions. Please try again." });
     }
-    if (questions.length === 0) {
-      setPhase(isPremium ? { k: "premium" } : { k: "error", message: "This test has no questions yet." });
-      return;
-    }
-    startedAt.current = Date.now();
-    setSecondsLeft(durationMinutes > 0 ? durationMinutes * 60 : null);
-    setCurrent(0);
-    setAnswers({});
-    setPhase({ k: "quiz", questions });
   }, [supabase, testId, durationMinutes, isPremium, scope]);
 
   const submit = useCallback(
@@ -124,29 +130,34 @@ export function MockTestRunner({
         selected_index: q.id in answers ? answers[q.id] : null,
       }));
       const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);
-      const { data, error } =
-        scope === "topic"
-          ? await supabase.rpc("submit_test_attempt", {
-              p_test_id: testId,
-              p_answers: payload,
-              p_time_taken_seconds: timeTaken,
-            })
-          : await supabase.rpc("submit_randomized_test_attempt", {
-              p_test_id: testId,
-              p_question_ids: questions.map((q) => q.id),
-              p_answers: payload,
-              p_time_taken_seconds: timeTaken,
-            });
-      const attempt = Array.isArray(data) ? data[0] : data;
-      if (error || !attempt?.id) {
+      try {
+        const { data, error } =
+          scope === "topic"
+            ? await supabase.rpc("submit_test_attempt", {
+                p_test_id: testId,
+                p_answers: payload,
+                p_time_taken_seconds: timeTaken,
+              })
+            : await supabase.rpc("submit_randomized_test_attempt", {
+                p_test_id: testId,
+                p_question_ids: questions.map((q) => q.id),
+                p_answers: payload,
+                p_time_taken_seconds: timeTaken,
+              });
+        const attempt = Array.isArray(data) ? data[0] : data;
+        if (error || !attempt?.id) {
+          submittedRef.current = false;
+          setPhase({
+            k: "error",
+            message: error?.message ? `Couldn't submit: ${error.message}` : "Couldn't submit your test. Please try again.",
+          });
+          return;
+        }
+        router.push(`${resultBase}/result/${attempt.id}`);
+      } catch {
         submittedRef.current = false;
-        setPhase({
-          k: "error",
-          message: error?.message ? `Couldn't submit: ${error.message}` : "Couldn't submit your test. Please try again.",
-        });
-        return;
+        setPhase({ k: "error", message: "Couldn't submit your test. Please try again." });
       }
-      router.push(`${resultBase}/result/${attempt.id}`);
     },
     [answers, supabase, testId, resultBase, router, scope],
   );
@@ -158,9 +169,9 @@ export function MockTestRunner({
       void submit(phase.questions);
       return;
     }
-    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
+    const t = setTimeout(() => setSecondsLeft(Math.max(0, Math.ceil((startedAt.current + durationMinutes * 60000 - Date.now()) / 1000))), 1000);
     return () => clearTimeout(t);
-  }, [phase, secondsLeft, submit]);
+  }, [phase, secondsLeft, submit, durationMinutes]);
 
   // ---- render ----
   if (phase.k === "gate") {
```

### website/src/app/onboarding/OnboardingForm.tsx (groups 20)

```diff
diff --git a/website/src/app/onboarding/OnboardingForm.tsx b/website/src/app/onboarding/OnboardingForm.tsx
index 8515f17..ed83481 100644
--- a/website/src/app/onboarding/OnboardingForm.tsx
+++ b/website/src/app/onboarding/OnboardingForm.tsx
@@ -71,21 +71,27 @@ export default function OnboardingForm({
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
-    if (!canContinue) return;
+    if (!canContinue || saving) return;
     setSaving(true);
     setError(null);
-    const { error: saveError } = await saveOnboardingProfile(createBrowserSupabase(), userId, {
-      course,
-      branch,
-      year,
-    });
-    setSaving(false);
-    if (saveError) {
-      setError(saveError);
-      return;
+    try {
+      const { error: saveError } = await saveOnboardingProfile(createBrowserSupabase(), userId, {
+        course,
+        branch,
+        year,
+      });
+      setSaving(false);
+      if (saveError) {
+        setError(saveError);
+        return;
+      }
+      router.push(ONBOARDING_COMPLETE_REDIRECT);
+      router.refresh();
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setSaving(false);
     }
-    router.push(ONBOARDING_COMPLETE_REDIRECT);
-    router.refresh();
   }
 
   return (
```

### website/src/app/r/[token]/ReportShareButton.tsx (groups 20)

```diff
diff --git a/website/src/app/r/[token]/ReportShareButton.tsx b/website/src/app/r/[token]/ReportShareButton.tsx
index d3d9621..40644b4 100644
--- a/website/src/app/r/[token]/ReportShareButton.tsx
+++ b/website/src/app/r/[token]/ReportShareButton.tsx
@@ -15,12 +15,16 @@ export default function ReportShareButton({ token }: { token: string }) {
 
   async function handleReport() {
     setState("sending");
-    const supabase = createBrowserSupabase();
-    const { data, error } = await supabase.rpc("report_shared_resume", {
-      p_token: token,
-      p_reason: "Reported by a viewer via the share page.",
-    });
-    setState(error || !data ? "error" : "sent");
+    try {
+      const supabase = createBrowserSupabase();
+      const { data, error } = await supabase.rpc("report_shared_resume", {
+        p_token: token,
+        p_reason: "Reported by a viewer via the share page.",
+      });
+      setState(error || !data ? "error" : "sent");
+    } catch {
+      setState("error");
+    }
   }
 
   if (state === "sent") return <p className="text-xs text-ink-faint">Thanks — this link has been reported.</p>;
```

### website/src/app/register/RegisterView.tsx (groups 20)

```diff
diff --git a/website/src/app/register/RegisterView.tsx b/website/src/app/register/RegisterView.tsx
index bed2685..dd257cd 100644
--- a/website/src/app/register/RegisterView.tsx
+++ b/website/src/app/register/RegisterView.tsx
@@ -49,27 +49,32 @@ function RegisterForm() {
     setError(null);
     setGoogleLoading(true);
 
-    const supabase = createBrowserSupabase();
-    // Same pattern as LoginView.handleGoogleSignIn — the referral code rides
-    // along as a plain query param on the callback URL (Google round-trips it
-    // unchanged) so /auth/callback can apply it once the session exists,
-    // since signInWithOAuth has no raw_user_meta_data-style channel the way
-    // signUp's options.data does.
-    const redirectTo = new URL("/auth/callback", window.location.origin);
-    redirectTo.searchParams.set("next", safeInternalPath(searchParams.get("next")));
-    if (referralCode) redirectTo.searchParams.set("ref", referralCode);
-
-    const { error: oauthError } = await supabase.auth.signInWithOAuth({
-      provider: "google",
-      options: { redirectTo: redirectTo.toString() },
-    });
-
-    if (oauthError) {
-      setError(oauthError.message ?? "Could not start Google sign-in.");
+    try {
+      const supabase = createBrowserSupabase();
+      // Same pattern as LoginView.handleGoogleSignIn — the referral code rides
+      // along as a plain query param on the callback URL (Google round-trips it
+      // unchanged) so /auth/callback can apply it once the session exists,
+      // since signInWithOAuth has no raw_user_meta_data-style channel the way
+      // signUp's options.data does.
+      const redirectTo = new URL("/auth/callback", window.location.origin);
+      redirectTo.searchParams.set("next", safeInternalPath(searchParams.get("next")));
+      if (referralCode) redirectTo.searchParams.set("ref", referralCode);
+
+      const { error: oauthError } = await supabase.auth.signInWithOAuth({
+        provider: "google",
+        options: { redirectTo: redirectTo.toString() },
+      });
+
+      if (oauthError) {
+        setError(oauthError.message ?? "Could not start Google sign-in.");
+        setGoogleLoading(false);
+        return;
+      }
+      // Success leaves googleLoading true — the browser is already navigating away.
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
       setGoogleLoading(false);
-      return;
     }
-    // Success leaves googleLoading true — the browser is already navigating away.
   }
 
   async function handleSubmit(e: React.FormEvent) {
```

### website/src/app/resume/templates/TemplateGallery.tsx (groups 13)

```diff
diff --git a/website/src/app/resume/templates/TemplateGallery.tsx b/website/src/app/resume/templates/TemplateGallery.tsx
index d1aab34..dda9a45 100644
--- a/website/src/app/resume/templates/TemplateGallery.tsx
+++ b/website/src/app/resume/templates/TemplateGallery.tsx
@@ -50,19 +50,26 @@ export function TemplateGallery({
   }, [templates, filter]);
 
   async function handleUse(templateId: string) {
+    if (pendingId) return;
     setError(null);
     setPendingId(templateId);
-    const result = await createResumeFromTemplateAction(templateId);
-    if (result.needsAuth) {
-      router.push(`/login?next=${encodeURIComponent("/resume/templates")}`);
-      return;
-    }
-    if (result.error || !result.resumeId) {
-      setError(result.error ?? "Something went wrong. Please try again.");
+    try {
+      const result = await createResumeFromTemplateAction(templateId);
+      if (result.needsAuth) {
+        router.push(`/login?next=${encodeURIComponent("/resume/templates")}`);
+        return;
+      }
+      if (result.error || !result.resumeId) {
+        setError(result.error ?? "Something went wrong. Please try again.");
+        setPendingId(null);
+        return;
+      }
+      router.push(`/account/resume/${result.resumeId}/edit`);
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
       setPendingId(null);
-      return;
     }
-    router.push(`/account/resume/${result.resumeId}/edit`);
   }
 
   return (
```

### website/src/components/nav/MobileNav.tsx (groups 3)

```diff
diff --git a/website/src/components/nav/MobileNav.tsx b/website/src/components/nav/MobileNav.tsx
index 1d93b57..7b96cde 100644
--- a/website/src/components/nav/MobileNav.tsx
+++ b/website/src/components/nav/MobileNav.tsx
@@ -40,7 +40,7 @@ export function MobileNav() {
         <Menu className="h-5 w-5" />
       </button>
 
-      <Drawer open={open} onClose={() => setOpen(false)} side="left">
+      <Drawer open={open} onClose={() => setOpen(false)} side="left" ariaLabel="Menu">
         {/* Gradient profile header */}
         <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent-violet px-5 pb-6 pt-12 text-white">
           <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
@@ -78,6 +78,7 @@ export function MobileNav() {
               <Link
                 key={item.label}
                 href={item.href}
+                onClick={() => setOpen(false)}
                 className={cn(
                   "mb-0.5 flex items-center justify-between rounded-xl px-3 py-2.5",
                   active ? "bg-primary-50" : "hover:bg-surface",
```

### website/src/components/resumeBuilder/DemoContentBanner.tsx (groups 20)

```diff
diff --git a/website/src/components/resumeBuilder/DemoContentBanner.tsx b/website/src/components/resumeBuilder/DemoContentBanner.tsx
index d7b804a..43474de 100644
--- a/website/src/components/resumeBuilder/DemoContentBanner.tsx
+++ b/website/src/components/resumeBuilder/DemoContentBanner.tsx
@@ -3,7 +3,7 @@
 import { useState } from "react";
 import { useRouter } from "next/navigation";
 import { Info, Loader2 } from "lucide-react";
-import { Button, Modal } from "@/components/ui";
+import { Button, Modal, toast } from "@/components/ui";
 import { clearResumeContentAction, setResumeDemoDismissedAction } from "@/lib/actions/resumeBuilder";
 
 /**
@@ -28,18 +28,36 @@ export default function DemoContentBanner({
 
   async function clearDemo() {
     setBusy("clear");
-    await clearResumeContentAction(resumeId);
-    setBusy(null);
-    setConfirmClear(false);
-    onDismiss();
-    router.refresh();
+    try {
+      const result = await clearResumeContentAction(resumeId);
+      if ("error" in result) {
+        toast({ title: "Something went wrong", description: result.error, tone: "error" });
+        return;
+      }
+      setConfirmClear(false);
+      onDismiss();
+      router.refresh();
+    } catch (err) {
+      toast({ title: "Something went wrong", description: err instanceof Error ? err.message : undefined, tone: "error" });
+    } finally {
+      setBusy(null);
+    }
   }
 
   async function keep() {
     setBusy("keep");
-    await setResumeDemoDismissedAction(resumeId);
-    setBusy(null);
-    onDismiss();
+    try {
+      const result = await setResumeDemoDismissedAction(resumeId);
+      if ("error" in result) {
+        toast({ title: "Something went wrong", description: result.error, tone: "error" });
+        return;
+      }
+      onDismiss();
+    } catch (err) {
+      toast({ title: "Something went wrong", description: err instanceof Error ? err.message : undefined, tone: "error" });
+    } finally {
+      setBusy(null);
+    }
   }
 
   return (
```

### website/src/components/resumeBuilder/ImportFromCampusEduxPanel.tsx (groups 13)

```diff
diff --git a/website/src/components/resumeBuilder/ImportFromCampusEduxPanel.tsx b/website/src/components/resumeBuilder/ImportFromCampusEduxPanel.tsx
index c1a52b1..6f04680 100644
--- a/website/src/components/resumeBuilder/ImportFromCampusEduxPanel.tsx
+++ b/website/src/components/resumeBuilder/ImportFromCampusEduxPanel.tsx
@@ -38,14 +38,21 @@ const ImportFromCampusEduxPanel = forwardRef<
   useImperativeHandle(ref, () => ({ open: load }));
 
   async function load() {
+    if (loading) return;
     setOpen(true);
     if (data) return;
     setLoading(true);
     setError(null);
-    const res = await getCampusEduxImportDataAction();
-    setLoading(false);
-    if ("error" in res) setError(res.error);
-    else setData(res);
+    try {
+      const res = await getCampusEduxImportDataAction();
+      setLoading(false);
+      if ("error" in res) setError(res.error);
+      else setData(res);
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setLoading(false);
+    }
   }
 
   const importablePersonalKeys = data
```

### website/src/components/resumeBuilder/ResumeCardActions.tsx (groups 13)

```diff
diff --git a/website/src/components/resumeBuilder/ResumeCardActions.tsx b/website/src/components/resumeBuilder/ResumeCardActions.tsx
index 99ac911..5cf012c 100644
--- a/website/src/components/resumeBuilder/ResumeCardActions.tsx
+++ b/website/src/components/resumeBuilder/ResumeCardActions.tsx
@@ -14,28 +14,42 @@ export default function ResumeCardActions({ resumeId, title }: { resumeId: strin
   const [error, setError] = useState<string | null>(null);
 
   async function duplicate() {
+    if (busy) return;
     setBusy("dup");
     setError(null);
-    const res = await duplicateResumeAction(resumeId);
-    setBusy(null);
-    if ("error" in res) {
-      setError(res.error);
-      return;
+    try {
+      const res = await duplicateResumeAction(resumeId);
+      setBusy(null);
+      if ("error" in res) {
+        setError(res.error);
+        return;
+      }
+      router.push(`/account/resume/${res.resumeId}/edit`);
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setBusy(null);
     }
-    router.push(`/account/resume/${res.resumeId}/edit`);
   }
 
   async function remove() {
+    if (busy) return;
     setBusy("del");
     setError(null);
-    const res = await deleteResumeAction(resumeId);
-    setBusy(null);
-    if ("error" in res) {
-      setError(res.error);
-      return;
+    try {
+      const res = await deleteResumeAction(resumeId);
+      setBusy(null);
+      if ("error" in res) {
+        setError(res.error);
+        return;
+      }
+      setConfirmOpen(false);
+      router.refresh();
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setBusy(null);
     }
-    setConfirmOpen(false);
-    router.refresh();
   }
 
   return (
```

### website/src/components/resumeBuilder/ShareModal.tsx (groups 14)

```diff
diff --git a/website/src/components/resumeBuilder/ShareModal.tsx b/website/src/components/resumeBuilder/ShareModal.tsx
index 4c7f20e..bb3cecf 100644
--- a/website/src/components/resumeBuilder/ShareModal.tsx
+++ b/website/src/components/resumeBuilder/ShareModal.tsx
@@ -24,29 +24,47 @@ function shareUrl(token: string): string {
   return absoluteUrl(`/r/${token}`);
 }
 
-function ShareRow({ share, onChange }: { share: ResumeShare; onChange: () => void }) {
+function ShareRow({ share, onChange, onError }: { share: ResumeShare; onChange: () => Promise<void>; onError: (message: string) => void }) {
   const [copied, setCopied] = useState(false);
   const [busy, setBusy] = useState(false);
   const url = shareUrl(share.token);
 
   async function copy() {
-    await navigator.clipboard.writeText(url);
-    setCopied(true);
-    setTimeout(() => setCopied(false), 1500);
+    try {
+      await navigator.clipboard.writeText(url);
+      setCopied(true);
+      setTimeout(() => setCopied(false), 1500);
+    } catch (err) {
+      onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    }
   }
 
   async function toggle() {
+    if (busy) return;
     setBusy(true);
-    await toggleResumeShareAction(share.id, !share.isActive);
-    setBusy(false);
-    onChange();
+    try {
+      const result = await toggleResumeShareAction(share.id, !share.isActive);
+      if ("error" in result) { onError(result.error); return; }
+      await onChange();
+    } catch (err) {
+      onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setBusy(false);
+    }
   }
 
   async function remove() {
+    if (busy) return;
     setBusy(true);
-    await deleteResumeShareAction(share.id);
-    setBusy(false);
-    onChange();
+    try {
+      const result = await deleteResumeShareAction(share.id);
+      if ("error" in result) { onError(result.error); return; }
+      await onChange();
+    } catch (err) {
+      onError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setBusy(false);
+    }
   }
 
   return (
@@ -89,19 +107,27 @@ export default function ShareModal({ resumeId, initialShares }: { resumeId: stri
     // Re-fetching the full list keeps view counts/active state accurate after any change.
     const { listResumeSharesAction } = await import("@/lib/actions/resumeBuilder");
     const result = await listResumeSharesAction(resumeId);
-    if (!("error" in result)) setShares(result);
+    if ("error" in result) setError(result.error);
+    else setShares(result);
   }
 
   async function handleCreate() {
+    if (creating) return;
     setCreating(true);
     setError(null);
-    const result = await createResumeShareAction(resumeId);
-    setCreating(false);
-    if ("error" in result) {
-      setError(result.error);
-      return;
+    try {
+      const result = await createResumeShareAction(resumeId);
+      setCreating(false);
+      if ("error" in result) {
+        setError(result.error);
+        return;
+      }
+      setShares((prev) => [result, ...prev]);
+    } catch (err) {
+      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
+    } finally {
+      setCreating(false);
     }
-    setShares((prev) => [result, ...prev]);
   }
 
   return (
@@ -124,7 +150,7 @@ export default function ShareModal({ resumeId, initialShares }: { resumeId: stri
           {shares.length === 0 ? (
             <p className="text-sm text-ink-faint">No share links yet.</p>
           ) : (
-            shares.map((share) => <ShareRow key={share.id} share={share} onChange={refresh} />)
+            shares.map((share) => <ShareRow key={share.id} share={share} onChange={refresh} onError={setError} />)
           )}
         </div>
```

### website/src/components/resumeBuilder/TemplatePreviewModal.tsx (groups 1)

```diff
diff --git a/website/src/components/resumeBuilder/TemplatePreviewModal.tsx b/website/src/components/resumeBuilder/TemplatePreviewModal.tsx
index 1c275ca..45ebbf5 100644
--- a/website/src/components/resumeBuilder/TemplatePreviewModal.tsx
+++ b/website/src/components/resumeBuilder/TemplatePreviewModal.tsx
@@ -1,7 +1,8 @@
 "use client";
 
-import { useEffect, useLayoutEffect, useRef, useState } from "react";
+import { useLayoutEffect, useRef, useState } from "react";
 import { X, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
+import { useDialog } from "@/lib/useDialog";
 import { Badge } from "@/components/ui";
 import { ResumeDocumentView, SHEET_WIDTH_PX, SHEET_MIN_HEIGHT_PX } from "./ResumeDocumentView";
 import type { ResolvedTemplate } from "@/lib/resumeBuilder/templateSpecs";
@@ -33,17 +34,7 @@ export function TemplatePreviewModal({
   const [zoomMult, setZoomMult] = useState(1);
   const [pages, setPages] = useState(1);
 
-  useEffect(() => {
-    if (!template) return;
-    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
-    document.addEventListener("keydown", onKey);
-    const prev = document.body.style.overflow;
-    document.body.style.overflow = "hidden";
-    return () => {
-      document.removeEventListener("keydown", onKey);
-      document.body.style.overflow = prev;
-    };
-  }, [template, onClose]);
+  const dialogRef = useDialog(Boolean(template && model), onClose);
 
   useLayoutEffect(() => {
     if (!template) return;
@@ -66,7 +57,7 @@ export function TemplatePreviewModal({
   const scale = fitScale * zoomMult;
 
   return (
-    <div className="fixed inset-0 z-[120] flex flex-col bg-scrim/70" role="dialog" aria-modal="true" aria-label={`${template.label} template preview`}>
+    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[120] flex flex-col bg-scrim/70" role="dialog" aria-modal="true" aria-label={`${template.label} template preview`}>
       {/* Top bar */}
       <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-card px-5 py-4">
         <div className="flex min-w-0 items-center gap-3">
```

### website/src/components/search/GlobalSearch.tsx (groups 1, 6)

```diff
diff --git a/website/src/components/search/GlobalSearch.tsx b/website/src/components/search/GlobalSearch.tsx
index 2f6edb1..22aaa59 100644
--- a/website/src/components/search/GlobalSearch.tsx
+++ b/website/src/components/search/GlobalSearch.tsx
@@ -4,6 +4,7 @@ import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
 import { createPortal } from "react-dom";
 import { useRouter, usePathname } from "next/navigation";
 import { Search, Loader2, CornerDownLeft, X, ArrowRight } from "lucide-react";
+import { useDialog } from "@/lib/useDialog";
 import { cn } from "@/lib/cn";
 import {
   type GlobalSearchResult,
@@ -39,6 +40,7 @@ function useSuggest(rawTerm: string) {
       return;
     }
     let live = true;
+    setResult(null);
     setLoading(true);
     const t = setTimeout(async () => {
       abort.current?.abort();
@@ -59,6 +61,7 @@ function useSuggest(rawTerm: string) {
     return () => {
       live = false;
       clearTimeout(t);
+      abort.current?.abort();
     };
   }, [term]);
 
@@ -91,6 +94,7 @@ export function GlobalSearchField({
   const optionRefs = useRef<(HTMLElement | null)[]>([]);
 
   const [value, setValue] = useState(defaultValue);
+  useEffect(() => setValue(defaultValue), [defaultValue]);
   const [focused, setFocused] = useState(false);
   const [active, setActive] = useState(-1);
 
@@ -98,8 +102,8 @@ export function GlobalSearchField({
   const withSubmit = showSubmit ?? variant === "page";
 
   const items: SearchResultItem[] = useMemo(
-    () => result?.groups.flatMap((g) => g.items) ?? [],
-    [result],
+    () => result?.q === term ? result.groups.flatMap((g) => g.items) : [],
+    [result, term],
   );
   const searchable = isSearchableTerm(term);
   const open = focused && searchable && (loading || !!result);
@@ -371,17 +375,7 @@ export function GlobalSearchTrigger() {
 
   useEffect(() => setMounted(true), []);
   useEffect(() => setOpen(false), [pathname]);
-  useEffect(() => {
-    if (!open) return;
-    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
-    document.addEventListener("keydown", onKey);
-    const prev = document.body.style.overflow;
-    document.body.style.overflow = "hidden";
-    return () => {
-      document.removeEventListener("keydown", onKey);
-      document.body.style.overflow = prev;
-    };
-  }, [open]);
+  const dialogRef = useDialog(open && mounted, () => setOpen(false));
 
   // The site header carries `backdrop-filter`, which makes it the containing
   // block for `position: fixed` descendants — a fixed overlay rendered inline
@@ -391,7 +385,7 @@ export function GlobalSearchTrigger() {
       ? createPortal(
           <div className="fixed inset-0 z-[100] xl:hidden">
             <div className="absolute inset-0 bg-scrim/60" onClick={() => setOpen(false)} aria-hidden />
-            <div className="absolute inset-x-0 top-0 border-b border-line bg-card p-3 shadow-card-lg">
+            <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Search CampusEduX" className="absolute inset-x-0 top-0 border-b border-line bg-card p-3 shadow-card-lg">
               <div className="container-page flex items-center gap-2">
                 <GlobalSearchField
                   variant="page"
```

### website/src/components/ui/Drawer.tsx (groups 1)

```diff
diff --git a/website/src/components/ui/Drawer.tsx b/website/src/components/ui/Drawer.tsx
index 5114bdd..257fb6a 100644
--- a/website/src/components/ui/Drawer.tsx
+++ b/website/src/components/ui/Drawer.tsx
@@ -3,6 +3,7 @@
 import { useEffect, useState } from "react";
 import { createPortal } from "react-dom";
 import { X } from "lucide-react";
+import { useDialog } from "@/lib/useDialog";
 import { cn } from "@/lib/cn";
 
 /**
@@ -20,6 +21,7 @@ export function Drawer({
   onClose,
   side = "right",
   title,
+  ariaLabel,
   children,
   className,
 }: {
@@ -27,23 +29,14 @@ export function Drawer({
   onClose: () => void;
   side?: "left" | "right" | "bottom";
   title?: string;
+  ariaLabel?: string;
   children: React.ReactNode;
   className?: string;
 }) {
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
 
-  useEffect(() => {
-    if (!open) return;
-    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
-    document.addEventListener("keydown", onKey);
-    const prev = document.body.style.overflow;
-    document.body.style.overflow = "hidden";
-    return () => {
-      document.removeEventListener("keydown", onKey);
-      document.body.style.overflow = prev;
-    };
-  }, [open, onClose]);
+  const dialogRef = useDialog(open && mounted, onClose);
 
   if (!mounted) return null;
 
@@ -71,9 +64,11 @@ export function Drawer({
         onClick={onClose}
       />
       <div
+        ref={dialogRef}
+        tabIndex={-1}
         role="dialog"
         aria-modal="true"
-        aria-label={title}
+        aria-label={title ?? ariaLabel}
         className={cn(
           "absolute flex flex-col bg-card shadow-card-lg transition-transform duration-200 ease-out motion-reduce:transition-none",
           panelPos,
```

### website/src/components/ui/Field.tsx (groups 18)

```diff
diff --git a/website/src/components/ui/Field.tsx b/website/src/components/ui/Field.tsx
index f586a76..700ee0c 100644
--- a/website/src/components/ui/Field.tsx
+++ b/website/src/components/ui/Field.tsx
@@ -19,7 +19,7 @@ export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
   { className, invalid, ...rest },
   ref,
 ) {
-  return <input ref={ref} className={cn(control, "h-11", invalid && invalidRing, className)} {...rest} />;
+  return <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-11", invalid && invalidRing, className)} {...rest} />;
 });
 
 export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
@@ -31,6 +31,7 @@ export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function
     <textarea
       ref={ref}
       rows={rows}
+      aria-invalid={invalid || undefined}
       className={cn(control, "py-2.5 leading-relaxed", invalid && invalidRing, className)}
       {...rest}
     />
@@ -46,6 +47,7 @@ export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select
     <div className="relative">
       <select
         ref={ref}
+        aria-invalid={invalid || undefined}
         className={cn(control, "h-11 appearance-none pr-9", invalid && invalidRing, className)}
         {...rest}
       >
```

### website/src/components/ui/Modal.tsx (groups 1, 2)

```diff
diff --git a/website/src/components/ui/Modal.tsx b/website/src/components/ui/Modal.tsx
index 482296b..e201d37 100644
--- a/website/src/components/ui/Modal.tsx
+++ b/website/src/components/ui/Modal.tsx
@@ -1,7 +1,7 @@
 "use client";
 
-import { useEffect } from "react";
 import { X } from "lucide-react";
+import { useDialog } from "@/lib/useDialog";
 import { cn } from "@/lib/cn";
 
 /**
@@ -27,17 +27,7 @@ export function Modal({
   ariaLabel?: string;
   className?: string;
 }) {
-  useEffect(() => {
-    if (!open) return;
-    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
-    document.addEventListener("keydown", onKey);
-    const prev = document.body.style.overflow;
-    document.body.style.overflow = "hidden";
-    return () => {
-      document.removeEventListener("keydown", onKey);
-      document.body.style.overflow = prev;
-    };
-  }, [open, onClose]);
+  const dialogRef = useDialog(open, onClose);
 
   if (!open) return null;
 
@@ -45,11 +35,13 @@ export function Modal({
     <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6">
       <div className="absolute inset-0 animate-fade-in bg-scrim/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
       <div
+        ref={dialogRef}
+        tabIndex={-1}
         role="dialog"
         aria-modal="true"
         aria-label={title ?? ariaLabel}
         className={cn(
-          "relative w-full max-w-lg animate-slide-up rounded-t-3xl border border-line bg-card shadow-card-lg sm:animate-scale-in sm:rounded-3xl",
+          "relative max-h-[100dvh] overflow-y-auto sm:max-h-[calc(100dvh-3rem)] w-full max-w-lg animate-slide-up rounded-t-3xl border border-line bg-card shadow-card-lg sm:animate-scale-in sm:rounded-3xl",
           className,
         )}
       >
```

### website/src/lib/useLearningBookmarks.ts (groups 5)

```diff
diff --git a/website/src/lib/useLearningBookmarks.ts b/website/src/lib/useLearningBookmarks.ts
index 4e46859..139f21d 100644
--- a/website/src/lib/useLearningBookmarks.ts
+++ b/website/src/lib/useLearningBookmarks.ts
@@ -8,40 +8,43 @@ import { useSessionProfile } from "@/lib/useSessionProfile";
  * `learning_bookmarks` table, RLS: own rows — same `select topic_id` the
  * lesson Bookmark button already runs). The Supabase browser client is
  * imported lazily, only for signed-in visitors, so it never lands in a page's
- * first-load JS. One request per page load, shared by every caller.
+ * first-load JS. In-flight requests are shared by callers for the same user.
  */
-let pending: Promise<Set<string>> | null = null;
+const pending = new Map<string, Promise<Set<string>>>();
 
-function loadBookmarks(): Promise<Set<string>> {
-  if (!pending) {
-    pending = (async () => {
-      try {
-        const { createBrowserSupabase } = await import("@/lib/supabase/browser");
-        const supabase = createBrowserSupabase();
-        const {
-          data: { user },
-        } = await supabase.auth.getUser();
-        if (!user) return new Set<string>();
-        const { data } = await supabase.from("learning_bookmarks").select("topic_id").eq("user_id", user.id);
-        return new Set((data ?? []).map((r: { topic_id: string }) => r.topic_id));
-      } catch {
-        return new Set<string>();
-      }
-    })();
-  }
-  return pending;
+function loadBookmarks(userId: string): Promise<Set<string>> {
+  const existing = pending.get(userId);
+  if (existing) return existing;
+  const request = (async () => {
+    try {
+      const { createBrowserSupabase } = await import("@/lib/supabase/browser");
+      const supabase = createBrowserSupabase();
+      const {
+        data: { user },
+      } = await supabase.auth.getUser();
+      if (!user || user.id !== userId) return new Set<string>();
+      const { data } = await supabase.from("learning_bookmarks").select("topic_id").eq("user_id", user.id);
+      return new Set((data ?? []).map((r: { topic_id: string }) => r.topic_id));
+    } catch {
+      return new Set<string>();
+    }
+  })().finally(() => { pending.delete(userId); });
+  pending.set(userId, request);
+  return request;
 }
 
 export function useLearningBookmarks(): Set<string> {
   const { profile } = useSessionProfile();
   const [ids, setIds] = useState<Set<string>>(() => new Set());
+  const userId = profile?.id;
   useEffect(() => {
-    if (!profile) return;
+    setIds(new Set());
+    if (!userId) return;
     let active = true;
-    loadBookmarks().then((s) => active && setIds(s));
+    loadBookmarks(userId).then((s) => active && setIds(s));
     return () => {
       active = false;
     };
-  }, [profile]);
+  }, [userId]);
   return ids;
 }
```

### website/src/lib/useSessionProfile.ts (groups 4)

```diff
diff --git a/website/src/lib/useSessionProfile.ts b/website/src/lib/useSessionProfile.ts
index cf8dcca..760bcad 100644
--- a/website/src/lib/useSessionProfile.ts
+++ b/website/src/lib/useSessionProfile.ts
@@ -69,10 +69,12 @@ export function useSessionProfile(): Result {
 
   useEffect(() => {
     let active = true;
+    let request = 0;
 
     async function load(force = false) {
+      const current = ++request;
       const profile = await fetchProfile(force);
-      if (active) setState({ loading: false, profile });
+      if (active && current === request) setState({ loading: false, profile });
     }
 
     load();
```

### website/src/lib/useDialog.ts (group 1, shared focus/scroll coordination)

```diff
diff --git a/website/src/lib/useDialog.ts b/website/src/lib/useDialog.ts
new file mode 100644
index 0000000..bccae6d
--- /dev/null
+++ b/website/src/lib/useDialog.ts
@@ -0,0 +1,59 @@
+"use client";
+
+import { useEffect, useRef } from "react";
+
+const dialogs: HTMLElement[] = [];
+let previousOverflow = "";
+
+/** Share the lock and focus stack so closing one overlay cannot unlock another. */
+export function useDialog(open: boolean, onClose: () => void) {
+  const ref = useRef<HTMLDivElement>(null);
+  const close = useRef(onClose);
+  close.current = onClose;
+
+  useEffect(() => {
+    const panel = ref.current;
+    if (!open || !panel) return;
+    const previousFocus = document.activeElement as HTMLElement | null;
+    if (!dialogs.length) {
+      previousOverflow = document.body.style.overflow;
+      document.body.style.overflow = "hidden";
+    }
+    dialogs.push(panel);
+    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>(
+      'a[href], button, input, select, textarea, [tabindex]',
+    )).filter((el) => el.tabIndex >= 0 && !el.matches(':disabled') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
+    const focusFirst = () => (focusable()[0] ?? panel).focus({ preventScroll: true });
+    if (!panel.contains(document.activeElement)) focusFirst();
+    const onFocus = (event: FocusEvent) => {
+      if (dialogs.at(-1) === panel && !panel.contains(event.target as Node)) focusFirst();
+    };
+    const onKey = (event: KeyboardEvent) => {
+      if (dialogs.at(-1) !== panel || event.defaultPrevented) return;
+      if (event.key === "Escape") {
+        event.preventDefault();
+        close.current();
+      } else if (event.key === "Tab") {
+        const elements = focusable();
+        const first = elements[0];
+        const last = elements.at(-1);
+        if (!first || (event.shiftKey ? document.activeElement === first || document.activeElement === panel : document.activeElement === last)) {
+          event.preventDefault();
+          (event.shiftKey ? last ?? panel : first ?? panel).focus();
+        }
+      }
+    };
+    document.addEventListener("keydown", onKey);
+    document.addEventListener("focusin", onFocus);
+    return () => {
+      document.removeEventListener("keydown", onKey);
+      document.removeEventListener("focusin", onFocus);
+      const wasTop = dialogs.at(-1) === panel;
+      dialogs.splice(dialogs.indexOf(panel), 1);
+      if (!dialogs.length) document.body.style.overflow = previousOverflow;
+      if (wasTop && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
+    };
+  }, [open]);
+
+  return ref;
+}
```

**File inventory**

Each source/config/test entry was inventoried before edits. This list denotes automated coverage, not a claim of line-by-line human review. Binary assets and secret environment files are not printed.

| File | Lines at inventory |
|---|---|
| `website/.eslintrc.json` | 5 |
| `website/lighthouserc.json` | 66 |
| `website/middleware.ts` | 42 |
| `website/next-env.d.ts` | 5 |
| `website/next.config.js` | 150 |
| `website/package-lock.json` | 9530 |
| `website/package.json` | 46 |
| `website/postcss.config.js` | 3 |
| `website/src/app/about/page.tsx` | 72 |
| `website/src/app/account/applications/page.tsx` | 66 |
| `website/src/app/account/layout.tsx` | 40 |
| `website/src/app/account/notifications/NotificationRow.tsx` | 48 |
| `website/src/app/account/notifications/page.tsx` | 33 |
| `website/src/app/account/page.tsx` | 124 |
| `website/src/app/account/profile/ProfileForm.tsx` | 146 |
| `website/src/app/account/profile/page.tsx` | 31 |
| `website/src/app/account/purchases/page.tsx` | 67 |
| `website/src/app/account/referral/page.tsx` | 129 |
| `website/src/app/account/resume/[id]/ResumeSteps.tsx` | 110 |
| `website/src/app/account/resume/[id]/ats/page.tsx` | 133 |
| `website/src/app/account/resume/[id]/edit/CompletionChecklist.tsx` | 56 |
| `website/src/app/account/resume/[id]/edit/DesignPanel.tsx` | 156 |
| `website/src/app/account/resume/[id]/edit/EntryListEditor.tsx` | 143 |
| `website/src/app/account/resume/[id]/edit/LinkListEditor.tsx` | 43 |
| `website/src/app/account/resume/[id]/edit/PersonalDetailsForm.tsx` | 57 |
| `website/src/app/account/resume/[id]/edit/ResumeEditor.tsx` | 275 |
| `website/src/app/account/resume/[id]/edit/ResumePreview.tsx` | 51 |
| `website/src/app/account/resume/[id]/edit/SectionEditor.tsx` | 100 |
| `website/src/app/account/resume/[id]/edit/SectionManagerRail.tsx` | 204 |
| `website/src/app/account/resume/[id]/edit/TagGroupsEditor.tsx` | 78 |
| `website/src/app/account/resume/[id]/edit/TagInput.tsx` | 57 |
| `website/src/app/account/resume/[id]/edit/page.tsx` | 49 |
| `website/src/app/account/resume/[id]/edit/useAutosaveField.ts` | 48 |
| `website/src/app/account/resume/[id]/edit/useDragSort.ts` | 43 |
| `website/src/app/account/resume/[id]/jd-match/JdMatchPanel.tsx` | 83 |
| `website/src/app/account/resume/[id]/jd-match/page.tsx` | 24 |
| `website/src/app/account/resume/[id]/layout.tsx` | 16 |
| `website/src/app/account/resume/[id]/preview/page.tsx` | 68 |
| `website/src/app/account/resume/[id]/projects/ProjectPicker.tsx` | 49 |
| `website/src/app/account/resume/[id]/projects/page.tsx` | 43 |
| `website/src/app/account/resume/[id]/versions/VersionHistory.tsx` | 99 |
| `website/src/app/account/resume/[id]/versions/page.tsx` | 32 |
| `website/src/app/account/resume/import/ImportWizard.tsx` | 256 |
| `website/src/app/account/resume/import/page.tsx` | 23 |
| `website/src/app/account/resume/page.tsx` | 6 |
| `website/src/app/account/saved-jobs/page.tsx` | 43 |
| `website/src/app/account/saved-projects/RemoveSavedButton.tsx` | 27 |
| `website/src/app/account/saved-projects/page.tsx` | 55 |
| `website/src/app/account/wallet/TopUpForm.tsx` | 113 |
| `website/src/app/account/wallet/WithdrawForm.tsx` | 105 |
| `website/src/app/account/wallet/page.tsx` | 85 |
| `website/src/app/api/announcements/route.ts` | 49 |
| `website/src/app/api/auth/verify-email/route.ts` | 56 |
| `website/src/app/api/auth/verify-recovery/route.ts` | 47 |
| `website/src/app/api/coding-problems/judge/route.ts` | 121 |
| `website/src/app/api/coding-problems/submit/route.ts` | 223 |
| `website/src/app/api/compiler/run/route.ts` | 62 |
| `website/src/app/api/custom-projects/understand/route.ts` | 75 |
| `website/src/app/api/learning/progress/route.ts` | 28 |
| `website/src/app/api/practice/judge/route.ts` | 119 |
| `website/src/app/api/practice/submit/route.ts` | 220 |
| `website/src/app/api/problems/solution/route.ts` | 39 |
| `website/src/app/api/resume/assist/route.ts` | 92 |
| `website/src/app/api/resume/export/docx/route.ts` | 43 |
| `website/src/app/api/resume/export/pdf/route.ts` | 42 |
| `website/src/app/api/resume/parse/route.ts` | 84 |
| `website/src/app/api/revalidate/route.ts` | 111 |
| `website/src/app/api/search/route.ts` | 37 |
| `website/src/app/api/session/route.ts` | 48 |
| `website/src/app/auth/callback/route.ts` | 59 |
| `website/src/app/auth/confirm/layout.tsx` | 7 |
| `website/src/app/auth/confirm/page.tsx` | 107 |
| `website/src/app/blog/[slug]/opengraph-image.tsx` | 15 |
| `website/src/app/blog/[slug]/page.tsx` | 272 |
| `website/src/app/blog/page.tsx` | 203 |
| `website/src/app/coding-problems/[problemSlug]/CodingProblemBody.tsx` | 60 |
| `website/src/app/coding-problems/[problemSlug]/CodingProblemPremiumGate.tsx` | 171 |
| `website/src/app/coding-problems/[problemSlug]/CodingProblemWorkspace.tsx` | 413 |
| `website/src/app/coding-problems/[problemSlug]/_components/CodeEditorPanel.tsx` | 79 |
| `website/src/app/coding-problems/[problemSlug]/_components/CodingProblemLayout.tsx` | 56 |
| `website/src/app/coding-problems/[problemSlug]/_components/CompilerPanel.tsx` | 162 |
| `website/src/app/coding-problems/[problemSlug]/_components/CompilerToolbar.tsx` | 146 |
| `website/src/app/coding-problems/[problemSlug]/_components/IOPanel.tsx` | 46 |
| `website/src/app/coding-problems/[problemSlug]/_components/InputPanel.tsx` | 78 |
| `website/src/app/coding-problems/[problemSlug]/_components/OutputPanel.tsx` | 49 |
| `website/src/app/coding-problems/[problemSlug]/_components/ProblemPanel.tsx` | 262 |
| `website/src/app/coding-problems/[problemSlug]/_components/ProblemSolution.tsx` | 63 |
| `website/src/app/coding-problems/[problemSlug]/_components/ProblemTabs.tsx` | 121 |
| `website/src/app/coding-problems/[problemSlug]/_components/ResizeHandle.tsx` | 73 |
| `website/src/app/coding-problems/[problemSlug]/opengraph-image.tsx` | 19 |
| `website/src/app/coding-problems/[problemSlug]/page.tsx` | 102 |
| `website/src/app/community-guidelines/page.tsx` | 8 |
| `website/src/app/compiler/CodeEditor.tsx` | 186 |
| `website/src/app/compiler/CompilerFallback.tsx` | 24 |
| `website/src/app/compiler/CompilerShell.tsx` | 306 |
| `website/src/app/compiler/CompilerToolbar.tsx` | 263 |
| `website/src/app/compiler/CompilerWorkspace.tsx` | 446 |
| `website/src/app/compiler/ResizeHandle.tsx` | 67 |
| `website/src/app/compiler/RuntimeErrorCard.tsx` | 104 |
| `website/src/app/compiler/editor.css` | 114 |
| `website/src/app/compiler/page.tsx` | 55 |
| `website/src/app/contact/ContactForm.tsx` | 88 |
| `website/src/app/contact/page.tsx` | 43 |
| `website/src/app/cookie-policy/page.tsx` | 9 |
| `website/src/app/custom-projects/_builder/BottomBar.tsx` | 60 |
| `website/src/app/custom-projects/_builder/CollapsibleCategory.tsx` | 45 |
| `website/src/app/custom-projects/_builder/ConfigSummary.tsx` | 79 |
| `website/src/app/custom-projects/_builder/Dropzone.tsx` | 81 |
| `website/src/app/custom-projects/_builder/FeatureCard.tsx` | 95 |
| `website/src/app/custom-projects/_builder/SelectCard.tsx` | 57 |
| `website/src/app/custom-projects/_builder/StatusBadge.tsx` | 27 |
| `website/src/app/custom-projects/_builder/StepBar.tsx` | 70 |
| `website/src/app/custom-projects/_builder/TrackingStepper.tsx` | 52 |
| `website/src/app/custom-projects/_builder/useDraft.ts` | 92 |
| `website/src/app/custom-projects/checkout/CustomProjectCheckout.tsx` | 190 |
| `website/src/app/custom-projects/checkout/page.tsx` | 138 |
| `website/src/app/custom-projects/estimate/page.tsx` | 456 |
| `website/src/app/custom-projects/features/BuilderFeatures.tsx` | 556 |
| `website/src/app/custom-projects/features/page.tsx` | 38 |
| `website/src/app/custom-projects/my-projects/[id]/AddonsPanel.tsx` | 184 |
| `website/src/app/custom-projects/my-projects/[id]/EditRequestPanel.tsx` | 283 |
| `website/src/app/custom-projects/my-projects/[id]/MessageThread.tsx` | 97 |
| `website/src/app/custom-projects/my-projects/[id]/PayRemainingButton.tsx` | 98 |
| `website/src/app/custom-projects/my-projects/[id]/PriceBreakdown.tsx` | 65 |
| `website/src/app/custom-projects/my-projects/[id]/page.tsx` | 406 |
| `website/src/app/custom-projects/my-projects/page.tsx` | 104 |
| `website/src/app/custom-projects/page.tsx` | 190 |
| `website/src/app/custom-projects/start/BuilderStart.tsx` | 337 |
| `website/src/app/custom-projects/start/page.tsx` | 32 |
| `website/src/app/data-and-permissions/page.tsx` | 8 |
| `website/src/app/delete-account/page.tsx` | 32 |
| `website/src/app/disclaimer/page.tsx` | 8 |
| `website/src/app/email-verified/page.tsx` | 86 |
| `website/src/app/error.tsx` | 22 |
| `website/src/app/faq/page.tsx` | 63 |
| `website/src/app/forgot-password/ForgotPasswordView.tsx` | 112 |
| `website/src/app/forgot-password/page.tsx` | 10 |
| `website/src/app/globals.css` | 314 |
| `website/src/app/grievance/page.tsx` | 100 |
| `website/src/app/jobs/[id]/JobApplyPanel.tsx` | 299 |
| `website/src/app/jobs/[id]/page.tsx` | 303 |
| `website/src/app/jobs/companies/[id]/page.tsx` | 96 |
| `website/src/app/jobs/companies/page.tsx` | 72 |
| `website/src/app/jobs/error.tsx` | 5 |
| `website/src/app/jobs/page.tsx` | 267 |
| `website/src/app/layout.tsx` | 113 |
| `website/src/app/learning/[gridSlug]/[topicSlug]/LearningBookmarkButton.tsx` | 112 |
| `website/src/app/learning/[gridSlug]/[topicSlug]/PremiumTopicContent.tsx` | 134 |
| `website/src/app/learning/[gridSlug]/[topicSlug]/RecordLessonVisit.tsx` | 19 |
| `website/src/app/learning/[gridSlug]/[topicSlug]/_components/RelatedLessons.tsx` | 54 |
| `website/src/app/learning/[gridSlug]/[topicSlug]/_components/TopicDiscovery.tsx` | 192 |
| `website/src/app/learning/[gridSlug]/[topicSlug]/_components/TopicPractice.tsx` | 89 |
| `website/src/app/learning/[gridSlug]/[topicSlug]/opengraph-image.tsx` | 15 |
| `website/src/app/learning/[gridSlug]/[topicSlug]/page.tsx` | 329 |
| `website/src/app/learning/[gridSlug]/opengraph-image.tsx` | 14 |
| `website/src/app/learning/[gridSlug]/page.tsx` | 96 |
| `website/src/app/learning/_components/Celebration.tsx` | 87 |
| `website/src/app/learning/_components/ContinueLearningRow.tsx` | 65 |
| `website/src/app/learning/_components/CourseCta.tsx` | 142 |
| `website/src/app/learning/_components/CourseCurriculum.tsx` | 218 |
| `website/src/app/learning/_components/CourseHero.tsx` | 125 |
| `website/src/app/learning/_components/LessonComplete.tsx` | 177 |
| `website/src/app/learning/_components/LessonShell.tsx` | 63 |
| `website/src/app/learning/_components/LessonSidebar.tsx` | 123 |
| `website/src/app/learning/_components/PopularTopics.tsx` | 59 |
| `website/src/app/learning/_components/ProgressSummary.tsx` | 99 |
| `website/src/app/learning/_components/ReadingProgress.tsx` | 45 |
| `website/src/app/learning/page.tsx` | 257 |
| `website/src/app/legal/page.tsx` | 75 |
| `website/src/app/login/LoginView.tsx` | 205 |
| `website/src/app/login/page.tsx` | 10 |
| `website/src/app/login/resolvePostLoginDestination.ts` | 25 |
| `website/src/app/logout/LogoutView.tsx` | 28 |
| `website/src/app/logout/page.tsx` | 10 |
| `website/src/app/manifest.ts` | 22 |
| `website/src/app/mock-tests/[testId]/MockTestRunner.tsx` | 328 |
| `website/src/app/mock-tests/[testId]/page.tsx` | 97 |
| `website/src/app/mock-tests/[testId]/result/[attemptId]/page.tsx` | 179 |
| `website/src/app/not-found.tsx` | 24 |
| `website/src/app/onboarding/OnboardingForm.tsx` | 160 |
| `website/src/app/onboarding/page.tsx` | 60 |
| `website/src/app/page.tsx` | 264 |
| `website/src/app/placement/notes/[id]/page.tsx` | 15 |
| `website/src/app/placement/notes/page.tsx` | 15 |
| `website/src/app/placement/page.tsx` | 10 |
| `website/src/app/practice/interview-questions/[category]/[topic]/page.tsx` | 209 |
| `website/src/app/practice/interview-questions/[category]/page.tsx` | 105 |
| `website/src/app/practice/interview-questions/page.tsx` | 83 |
| `website/src/app/practice/page.tsx` | 121 |
| `website/src/app/practice/problems/PracticeFilters.tsx` | 110 |
| `website/src/app/practice/problems/PracticeProblemGrid.tsx` | 144 |
| `website/src/app/practice/problems/[slug]/PracticeProblemPremiumGate.tsx` | 169 |
| `website/src/app/practice/problems/[slug]/opengraph-image.tsx` | 19 |
| `website/src/app/practice/problems/[slug]/page.tsx` | 97 |
| `website/src/app/practice/problems/page.tsx` | 133 |
| `website/src/app/practice/submissions/page.tsx` | 161 |
| `website/src/app/premium/page.tsx` | 291 |
| `website/src/app/privacy-policy/page.tsx` | 8 |
| `website/src/app/project-license/page.tsx` | 8 |
| `website/src/app/projects/[id]/Gallery.tsx` | 59 |
| `website/src/app/projects/[id]/ProjectPurchasePanel.tsx` | 165 |
| `website/src/app/projects/[id]/page.tsx` | 205 |
| `website/src/app/projects/category/[category]/loading.tsx` | 13 |
| `website/src/app/projects/category/[category]/page.tsx` | 75 |
| `website/src/app/projects/error.tsx` | 5 |
| `website/src/app/projects/page.tsx` | 323 |
| `website/src/app/projects/trending/page.tsx` | 63 |
| `website/src/app/r/[token]/ReportShareButton.tsx` | 38 |
| `website/src/app/r/[token]/page.tsx` | 65 |
| `website/src/app/referral/page.tsx` | 82 |
| `website/src/app/refund-policy/page.tsx` | 8 |
| `website/src/app/register/RegisterView.tsx` | 249 |
| `website/src/app/register/page.tsx` | 10 |
| `website/src/app/reset-password/ResetPasswordView.tsx` | 208 |
| `website/src/app/reset-password/page.tsx` | 10 |
| `website/src/app/resume/page.tsx` | 183 |
| `website/src/app/resume/templates/TemplateGallery.tsx` | 120 |
| `website/src/app/resume/templates/page.tsx` | 55 |
| `website/src/app/robots.ts` | 34 |
| `website/src/app/search/error.tsx` | 5 |
| `website/src/app/search/page.tsx` | 144 |
| `website/src/app/sitemap.xml/route.ts` | 11 |
| `website/src/app/sitemaps/blog.xml/route.ts` | 8 |
| `website/src/app/sitemaps/interview-questions.xml/route.ts` | 8 |
| `website/src/app/sitemaps/jobs.xml/route.ts` | 8 |
| `website/src/app/sitemaps/learning.xml/route.ts` | 8 |
| `website/src/app/sitemaps/problems.xml/route.ts` | 8 |
| `website/src/app/sitemaps/projects.xml/route.ts` | 8 |
| `website/src/app/sitemaps/static.xml/route.ts` | 8 |
| `website/src/app/support/page.tsx` | 25 |
| `website/src/app/terms/page.tsx` | 8 |
| `website/src/components/CustomProjectBanner.tsx` | 38 |
| `website/src/components/Footer.tsx` | 245 |
| `website/src/components/JobCard.tsx` | 106 |
| `website/src/components/JsonLd.tsx` | 29 |
| `website/src/components/PremiumSubscribeButton.tsx` | 138 |
| `website/src/components/ProjectCard.tsx` | 109 |
| `website/src/components/SignInToRun.tsx` | 26 |
| `website/src/components/account/AccountLearningCard.tsx` | 95 |
| `website/src/components/account/AccountNav.tsx` | 61 |
| `website/src/components/account/AccountPageHeader.tsx` | 22 |
| `website/src/components/analytics/AnalyticsPageView.tsx` | 25 |
| `website/src/components/analytics/CookieConsent.tsx` | 104 |
| `website/src/components/analytics/GoogleAnalytics.tsx` | 74 |
| `website/src/components/auth/GoogleIcon.tsx` | 25 |
| `website/src/components/blog/ArticleToc.tsx` | 63 |
| `website/src/components/blog/BlogCard.tsx` | 122 |
| `website/src/components/blog/BlogImage.tsx` | 58 |
| `website/src/components/blog/ShareButtons.tsx` | 90 |
| `website/src/components/home/AnnouncementBar.tsx` | 81 |
| `website/src/components/home/CustomProjectPromo.tsx` | 93 |
| `website/src/components/home/HeroVisual.tsx` | 100 |
| `website/src/components/home/HomeHero.tsx` | 81 |
| `website/src/components/home/HomePersonal.tsx` | 246 |
| `website/src/components/home/ModuleGrid.tsx` | 77 |
| `website/src/components/home/PlacementPrep.tsx` | 103 |
| `website/src/components/home/PopularCourses.tsx` | 32 |
| `website/src/components/home/PremiumReferralCta.tsx` | 73 |
| `website/src/components/home/Testimonials.tsx` | 43 |
| `website/src/components/learning/Callout.tsx` | 79 |
| `website/src/components/learning/CodeBlock.tsx` | 103 |
| `website/src/components/learning/CourseCard.tsx` | 98 |
| `website/src/components/learning/CourseCardProgress.tsx` | 35 |
| `website/src/components/learning/CourseCover.tsx` | 123 |
| `website/src/components/learning/LessonBlock.tsx` | 50 |
| `website/src/components/learning/LessonSection.tsx` | 180 |
| `website/src/components/learning/Markdown.tsx` | 559 |
| `website/src/components/marketplace/JobFilters.tsx` | 81 |
| `website/src/components/marketplace/ProjectFilters.tsx` | 98 |
| `website/src/components/marketplace/ProjectGrid.tsx` | 29 |
| `website/src/components/nav/AuthMenu.tsx` | 161 |
| `website/src/components/nav/BottomNav.tsx` | 52 |
| `website/src/components/nav/BrandMark.tsx` | 46 |
| `website/src/components/nav/Header.tsx` | 50 |
| `website/src/components/nav/HeaderLinks.tsx` | 58 |
| `website/src/components/nav/MobileNav.tsx` | 140 |
| `website/src/components/nav/NotificationBell.tsx` | 28 |
| `website/src/components/nav/navConfig.ts` | 84 |
| `website/src/components/referral/ReferralHero.tsx` | 21 |
| `website/src/components/referral/ReferralHowItWorks.tsx` | 46 |
| `website/src/components/referral/ReferralReminderButton.tsx` | 27 |
| `website/src/components/referral/ShareReferralLink.tsx` | 76 |
| `website/src/components/resumeBuilder/DemoContentBanner.tsx` | 86 |
| `website/src/components/resumeBuilder/ImportFromCampusEduxPanel.tsx` | 233 |
| `website/src/components/resumeBuilder/ResumeAIAssistPanel.tsx` | 129 |
| `website/src/components/resumeBuilder/ResumeCardActions.tsx` | 72 |
| `website/src/components/resumeBuilder/ResumeDashboard.tsx` | 115 |
| `website/src/components/resumeBuilder/ResumeDocumentView.tsx` | 246 |
| `website/src/components/resumeBuilder/ResumeSheetScaler.tsx` | 67 |
| `website/src/components/resumeBuilder/ResumeThumbnail.tsx` | 53 |
| `website/src/components/resumeBuilder/ShareModal.tsx` | 139 |
| `website/src/components/resumeBuilder/TemplateGalleryCard.tsx` | 78 |
| `website/src/components/resumeBuilder/TemplatePreviewModal.tsx` | 133 |
| `website/src/components/resumeBuilder/TemplateShowcaseCard.tsx` | 32 |
| `website/src/components/search/GlobalSearch.tsx` | 436 |
| `website/src/components/search/groupMeta.tsx` | 16 |
| `website/src/components/support/WhatsAppSupport.tsx` | 138 |
| `website/src/components/ui/Avatar.tsx` | 50 |
| `website/src/components/ui/Badge.tsx` | 41 |
| `website/src/components/ui/Breadcrumb.tsx` | 41 |
| `website/src/components/ui/Button.tsx` | 94 |
| `website/src/components/ui/Card.tsx` | 41 |
| `website/src/components/ui/CategoryCard.tsx` | 47 |
| `website/src/components/ui/Chip.tsx` | 49 |
| `website/src/components/ui/CompanyCard.tsx` | 39 |
| `website/src/components/ui/Drawer.tsx` | 98 |
| `website/src/components/ui/EmptyState.tsx` | 41 |
| `website/src/components/ui/ErrorState.tsx` | 44 |
| `website/src/components/ui/Field.tsx` | 137 |
| `website/src/components/ui/FilterSheet.tsx` | 56 |
| `website/src/components/ui/Modal.tsx` | 71 |
| `website/src/components/ui/PageHeader.tsx` | 39 |
| `website/src/components/ui/Pagination.tsx` | 71 |
| `website/src/components/ui/PremiumCard.tsx` | 78 |
| `website/src/components/ui/PriceDisplay.tsx` | 38 |
| `website/src/components/ui/ProgressBar.tsx` | 60 |
| `website/src/components/ui/ProgressRing.tsx` | 72 |
| `website/src/components/ui/Rating.tsx` | 50 |
| `website/src/components/ui/ResourceCard.tsx` | 74 |
| `website/src/components/ui/Reveal.tsx` | 64 |
| `website/src/components/ui/ReviewCard.tsx` | 34 |
| `website/src/components/ui/SearchBar.tsx` | 50 |
| `website/src/components/ui/SectionHeader.tsx` | 57 |
| `website/src/components/ui/Skeleton.tsx` | 85 |
| `website/src/components/ui/Switch.tsx` | 48 |
| `website/src/components/ui/Tabs.tsx` | 116 |
| `website/src/components/ui/ThemeToggle.tsx` | 87 |
| `website/src/components/ui/Toast.tsx` | 81 |
| `website/src/components/ui/index.ts` | 44 |
| `website/src/legal/LegalDocView.tsx` | 69 |
| `website/src/legal/LegalPageShell.tsx` | 45 |
| `website/src/legal/LegalProse.tsx` | 68 |
| `website/src/legal/config.ts` | 49 |
| `website/src/legal/content/community-guidelines.json` | 79 |
| `website/src/legal/content/contact.json` | 47 |
| `website/src/legal/content/cookie-policy.json` | 81 |
| `website/src/legal/content/data-and-permissions.json` | 72 |
| `website/src/legal/content/delete-account.json` | 59 |
| `website/src/legal/content/disclaimer.json` | 51 |
| `website/src/legal/content/privacy-policy.json` | 220 |
| `website/src/legal/content/project-license.json` | 75 |
| `website/src/legal/content/refund-policy.json` | 82 |
| `website/src/legal/content/terms.json` | 166 |
| `website/src/legal/interpolate.ts` | 66 |
| `website/src/legal/legal.config.json` | 80 |
| `website/src/legal/registry.ts` | 121 |
| `website/src/legal/seo.ts` | 49 |
| `website/src/legal/types.ts` | 53 |
| `website/src/lib/academic.ts` | 15 |
| `website/src/lib/actions/contact.ts` | 59 |
| `website/src/lib/actions/customProjects.ts` | 191 |
| `website/src/lib/actions/jobs.ts` | 171 |
| `website/src/lib/actions/resumeBuilder.ts` | 806 |
| `website/src/lib/actions/wishlist.ts` | 21 |
| `website/src/lib/analytics.ts` | 20 |
| `website/src/lib/apiAuth.ts` | 53 |
| `website/src/lib/auth.ts` | 138 |
| `website/src/lib/blog.ts` | 318 |
| `website/src/lib/blog.types.ts` | 47 |
| `website/src/lib/blogLinks.ts` | 46 |
| `website/src/lib/blogText.ts` | 154 |
| `website/src/lib/brand.ts` | 14 |
| `website/src/lib/brandAssets.ts` | 8 |
| `website/src/lib/brandLogoData.ts` | 8 |
| `website/src/lib/cache.ts` | 379 |
| `website/src/lib/callouts.ts` | 93 |
| `website/src/lib/cn.ts` | 4 |
| `website/src/lib/codingProblems.ts` | 88 |
| `website/src/lib/compiler/codingLayout.ts` | 80 |
| `website/src/lib/compiler/handoff.ts` | 52 |
| `website/src/lib/compiler/languages.ts` | 229 |
| `website/src/lib/compiler/limits.ts` | 30 |
| `website/src/lib/compiler/normalize.ts` | 86 |
| `website/src/lib/compiler/providers/judge0.ts` | 123 |
| `website/src/lib/compiler/providers/paiza.ts` | 141 |
| `website/src/lib/compiler/providers/piston.ts` | 97 |
| `website/src/lib/compiler/providers/types.ts` | 44 |
| `website/src/lib/compiler/run.ts` | 81 |
| `website/src/lib/compiler/schema.ts` | 27 |
| `website/src/lib/compiler/standaloneLayout.ts` | 79 |
| `website/src/lib/compiler/useResizableSplit.ts` | 237 |
| `website/src/lib/contentQuality.ts` | 41 |
| `website/src/lib/contentRedirects.json` | 9 |
| `website/src/lib/contentRedirects.ts` | 30 |
| `website/src/lib/cookieConsent.ts` | 46 |
| `website/src/lib/courseCover.ts` | 79 |
| `website/src/lib/courseOutline.ts` | 47 |
| `website/src/lib/customProjects/aiUnderstand.ts` | 184 |
| `website/src/lib/customProjects.server.ts` | 84 |
| `website/src/lib/customProjects.ts` | 547 |
| `website/src/lib/format.ts` | 32 |
| `website/src/lib/home.ts` | 57 |
| `website/src/lib/image.ts` | 12 |
| `website/src/lib/interviewQuestions.ts` | 101 |
| `website/src/lib/interviewQuestions.types.ts` | 113 |
| `website/src/lib/jobsActive.ts` | 32 |
| `website/src/lib/learning.ts` | 429 |
| `website/src/lib/learning.types.ts` | 216 |
| `website/src/lib/learningDiscovery.ts` | 371 |
| `website/src/lib/learningProgress/index.ts` | 18 |
| `website/src/lib/learningProgress/model.ts` | 336 |
| `website/src/lib/learningProgress/store.ts` | 103 |
| `website/src/lib/learningProgress/useLearningProgress.ts` | 52 |
| `website/src/lib/learningTags.ts` | 71 |
| `website/src/lib/legalConsent.ts` | 47 |
| `website/src/lib/lessonFaq.ts` | 108 |
| `website/src/lib/lessonSections.ts` | 177 |
| `website/src/lib/lessonToc.ts` | 51 |
| `website/src/lib/marketplace.ts` | 63 |
| `website/src/lib/metaDescription.ts` | 431 |
| `website/src/lib/middlewarePaths.ts` | 24 |
| `website/src/lib/nav.ts` | 29 |
| `website/src/lib/ogImage.tsx` | 95 |
| `website/src/lib/passwordReset.ts` | 12 |
| `website/src/lib/payments.ts` | 32 |
| `website/src/lib/practice.ts` | 154 |
| `website/src/lib/practice.types.ts` | 136 |
| `website/src/lib/publicCache.ts` | 27 |
| `website/src/lib/qna.ts` | 69 |
| `website/src/lib/rateLimitDb.ts` | 137 |
| `website/src/lib/razorpay.ts` | 17 |
| `website/src/lib/referral.ts` | 40 |
| `website/src/lib/resume.ts` | 41 |
| `website/src/lib/resumeBuilder/aiAssist.ts` | 107 |
| `website/src/lib/resumeBuilder/atsCategories.ts` | 377 |
| `website/src/lib/resumeBuilder/content.ts` | 493 |
| `website/src/lib/resumeBuilder/demoResumes.ts` | 416 |
| `website/src/lib/resumeBuilder/design.ts` | 105 |
| `website/src/lib/resumeBuilder/docxBuilder.ts` | 103 |
| `website/src/lib/resumeBuilder/fileExtraction.ts` | 37 |
| `website/src/lib/resumeBuilder/formatting.ts` | 32 |
| `website/src/lib/resumeBuilder/loadForExport.ts` | 51 |
| `website/src/lib/resumeBuilder/parser.ts` | 177 |
| `website/src/lib/resumeBuilder/pdfDocument.tsx` | 105 |
| `website/src/lib/resumeBuilder/renderModel.ts` | 130 |
| `website/src/lib/resumeBuilder/sections.ts` | 68 |
| `website/src/lib/resumeBuilder/templateSpecs.ts` | 155 |
| `website/src/lib/resumeBuilder/types.ts` | 158 |
| `website/src/lib/runErrors.ts` | 48 |
| `website/src/lib/safeUrl.ts` | 22 |
| `website/src/lib/search.ts` | 307 |
| `website/src/lib/searchModel.ts` | 127 |
| `website/src/lib/seo.ts` | 176 |
| `website/src/lib/seoTitles.ts` | 302 |
| `website/src/lib/sessionSignal.ts` | 45 |
| `website/src/lib/sitemap/build.ts` | 372 |
| `website/src/lib/sitemap/data.ts` | 275 |
| `website/src/lib/sitemap/response.ts` | 15 |
| `website/src/lib/supabase/authed-server.ts` | 38 |
| `website/src/lib/supabase/browser.ts` | 23 |
| `website/src/lib/supabase/server.ts` | 23 |
| `website/src/lib/theme.ts` | 44 |
| `website/src/lib/topicLinks.ts` | 110 |
| `website/src/lib/uploads.ts` | 48 |
| `website/src/lib/useLearningBookmarks.ts` | 47 |
| `website/src/lib/useNearViewport.ts` | 62 |
| `website/src/lib/useRunAccess.ts` | 15 |
| `website/src/lib/useSessionProfile.ts` | 90 |
| `website/src/lib/wallet.ts` | 40 |
| `website/src/lib/whatsapp.ts` | 66 |
| `website/src/lib/wishlist.ts` | 49 |
| `website/supabase/.temp/linked-project.json` | 1 |
| `website/tailwind.config.ts` | 140 |
| `website/test-results/.last-run.json` | 4 |
| `website/tests/actions/contact.test.ts` | 63 |
| `website/tests/actions/customProjects.test.ts` | 63 |
| `website/tests/actions/jobs.test.ts` | 118 |
| `website/tests/actions/wishlist.test.ts` | 29 |
| `website/tests/app/auth-callback.test.ts` | 64 |
| `website/tests/app/coding-problem-breadcrumb.test.ts` | 174 |
| `website/tests/app/coding-problem-premium-gate.test.ts` | 380 |
| `website/tests/app/header-narrow-phones.test.ts` | 42 |
| `website/tests/app/login.test.ts` | 26 |
| `website/tests/app/mock-test-canonical.test.ts` | 22 |
| `website/tests/app/onboarding-form.test.ts` | 97 |
| `website/tests/app/onboarding.test.ts` | 112 |
| `website/tests/app/schema-structured-data.test.ts` | 302 |
| `website/tests/app/seo-indexing-audit.test.ts` | 117 |
| `website/tests/app/seo-metadata-fixes.test.ts` | 180 |
| `website/tests/app/seo-phase3-batch5-compiler-redirect.test.ts` | 141 |
| `website/tests/app/seo-phase3-batch6-shouldfix.test.ts` | 132 |
| `website/tests/app/seo-phase3-fixes.test.ts` | 293 |
| `website/tests/app/seo-phase4a-fixes.test.ts` | 156 |
| `website/tests/app/seo-phase4b-fixes.test.ts` | 64 |
| `website/tests/helpers/sitemapFakes.ts` | 129 |
| `website/tests/helpers/supabase.mock.ts` | 124 |
| `website/tests/legal/consistency.test.ts` | 149 |
| `website/tests/lib/academicIntegrity.test.ts` | 34 |
| `website/tests/lib/api-auth-routes.test.ts` | 126 |
| `website/tests/lib/auth.test.ts` | 142 |
| `website/tests/lib/blog.test.ts` | 152 |
| `website/tests/lib/callouts.test.ts` | 94 |
| `website/tests/lib/codeBlock.test.ts` | 74 |
| `website/tests/lib/coding-problems.test.ts` | 96 |
| `website/tests/lib/compiler-handoff.test.ts` | 40 |
| `website/tests/lib/compiler-languages.test.ts` | 72 |
| `website/tests/lib/compiler-normalize.test.ts` | 56 |
| `website/tests/lib/compiler-run.test.ts` | 215 |
| `website/tests/lib/compiler-schema.test.ts` | 44 |
| `website/tests/lib/contentRedirects.test.ts` | 84 |
| `website/tests/lib/courseCover.test.ts` | 45 |
| `website/tests/lib/customProjects.test.ts` | 399 |
| `website/tests/lib/format.test.ts` | 23 |
| `website/tests/lib/home.test.ts` | 21 |
| `website/tests/lib/jobsActive.test.ts` | 41 |
| `website/tests/lib/jsonld-xss.test.ts` | 23 |
| `website/tests/lib/learning-progress-route.test.ts` | 61 |
| `website/tests/lib/learning.test.ts` | 41 |
| `website/tests/lib/learningDiscovery.test.ts` | 76 |
| `website/tests/lib/learningProgress.test.ts` | 139 |
| `website/tests/lib/learningRelatedLinks.test.ts` | 158 |
| `website/tests/lib/lessonSections.test.ts` | 192 |
| `website/tests/lib/lessonToc.test.ts` | 32 |
| `website/tests/lib/listing-indexing.test.ts` | 111 |
| `website/tests/lib/markdown-topic-links.test.ts` | 104 |
| `website/tests/lib/marketplace.test.ts` | 44 |
| `website/tests/lib/metaDescription.test.ts` | 70 |
| `website/tests/lib/nav.test.ts` | 34 |
| `website/tests/lib/passwordReset.test.ts` | 21 |
| `website/tests/lib/payments.test.ts` | 42 |
| `website/tests/lib/perf-cache.test.ts` | 159 |
| `website/tests/lib/practice.test.ts` | 100 |
| `website/tests/lib/public-cache.test.ts` | 86 |
| `website/tests/lib/qna.test.ts` | 115 |
| `website/tests/lib/rateLimitDb.test.ts` | 67 |
| `website/tests/lib/resume.test.ts` | 50 |
| `website/tests/lib/resumeAiAssist.test.ts` | 108 |
| `website/tests/lib/resumeAtsCategories.test.ts` | 110 |
| `website/tests/lib/resumeBuilder.test.ts` | 473 |
| `website/tests/lib/resumeContent.test.ts` | 167 |
| `website/tests/lib/resumeDesign.test.ts` | 53 |
| `website/tests/lib/resumeExport.test.ts` | 119 |
| `website/tests/lib/resumeFileExtraction.test.ts` | 84 |
| `website/tests/lib/resumeFlowE2E.test.ts` | 220 |
| `website/tests/lib/resumeParser.test.ts` | 110 |
| `website/tests/lib/resumeRenderModel.test.ts` | 104 |
| `website/tests/lib/resumeSections.test.ts` | 58 |
| `website/tests/lib/run-errors.test.tsx` | 44 |
| `website/tests/lib/runGuard.test.ts` | 56 |
| `website/tests/lib/safeUrl.test.ts` | 29 |
| `website/tests/lib/search.test.ts` | 113 |
| `website/tests/lib/seo.test.ts` | 114 |
| `website/tests/lib/seoDescriptions.test.ts` | 352 |
| `website/tests/lib/seoTitles.test.ts` | 219 |
| `website/tests/lib/sitemap.test.ts` | 552 |
| `website/tests/lib/submissionRpc.test.ts` | 16 |
| `website/tests/lib/templateSpecs.test.ts` | 55 |
| `website/tests/lib/topicLinks.test.ts` | 60 |
| `website/tests/lib/uploadLimits.test.ts` | 53 |
| `website/tests/lib/uploads.test.ts` | 39 |
| `website/tests/lib/useNearViewport.test.ts` | 88 |
| `website/tests/lib/whatsapp.test.ts` | 67 |
| `website/tests/lib/wishlist.test.ts` | 17 |
| `website/tests/stubs/next-font-google.ts` | 18 |
| `website/tsconfig.json` | 21 |
| `website/vitest.config.ts` | 34 |


## 30 October 2026 continuation — verified pending QA repairs

The previous `/tmp/campusedux-playwright-qa/evidence.json` was absent. Latest inspected commits were `c262ac8`, `66186e3`, `ecf02f3` and `d1efb6b`; their cache/privacy/revalidation work was preserved. Existing menu naming, active-link dismissal, filter ID scoping and the text-only project-help banner were already implemented and were not re-created.

Changes in this continuation:

- `ProjectFilters.tsx`: explicit minimum/maximum price names, preserving GET names and values.
- `MobileNav.tsx`: menu trigger dialog/expanded semantics, named navigation and current-page state; defer compiler prefetching. `PlacementPrep.tsx`: also defer the homepage compiler link.
- `GlobalSearch.tsx`: keep listbox options outside the Tab order, retain combobox focus for pointer selection, clear popup references on blur, and preserve autofocus suggestions on initial mount while still closing on actual pathname changes.
- `useDialog.ts`: optional explicit return-focus reference, used by the mobile search trigger because autofocus occurs before the dialog effect captures focus. Other dialog callers retain their existing behavior.
- Browser fixtures now match the root layout's mobile content clearance. Harness selectors distinguish reading progress from closed drawers, resolve an existing Playwright installation, keep Chromium sandboxing enabled, and restrict browser requests to loopback GET/HEAD. Added regressions for menu focus/state, search pointer/Tab interaction and price/filter ID/value preservation.

Verification:

- Baseline focused Vitest: 60 passed. Full isolated website `npm test -- --maxWorkers=1 --minWorkers=1`: **1,638 passed, 12 opt-in database tests skipped**, 108 files passed / 1 skipped. The later search/dialog corrections additionally passed 33 focused tests (`global-search-failures`, `navigation-accessibility`, `shared-ui`) and final browser checks.
- `npm run typecheck` and `npm run lint`: passed. Final `npm run build`: passed, including lint/type validation, in a temporary source copy with environment files/local Supabase state excluded, inherited environment cleared, existing dependencies linked and one build worker (`experimental.cpus = 1`) for memory safety. The workspace's existing build was preserved. This verifies compilation, not populated staging behavior.
- Final shared browser command: `UI_AUDIT_SCOPE=shared UI_AUDIT_BROWSER=<existing chromium headless shell> node website/tests/ui-audit/check.cjs`: **19 passed, 0 failed**, including 320/360/390/430/1024/1440px light/dark layouts. Browser failures encountered earlier were reproduced and corrected; final evidence is `/tmp/campusedux-ui-audit/browser-results.json`.
- `python3 -m unittest discover -s website/tests/scripts -p 'test_*.py'`: **30 passed, 1 failed**. The failure is the pre-existing `test_twins_are_exact_and_reproducible` integration gate: the identical 0151/121 migration twins contain 148 packages, while the current authored inventory contains 317. No migration was regenerated to bypass this gate. These are offline/mocked checks, not live SQL/RLS verification.
- Production-build smoke (`node /tmp/campusedux-production-smoke.cjs`): **4 passed, 1 failed**. Actual Next production navigation showed **0 compiler route/route-chunk requests before use** from both the visible homepage card and open mobile drawer; compiler navigation worked. About/FAQ/Contact had distinct titles, expected canonicals and descriptions; robots/sitemap returned 200. Signed-out account smoke returned 500 because the deliberately unconfigured copy cannot construct a Supabase client; server logs confirm missing URL/key. This does not establish a staging authentication defect or a successful authentication journey. Evidence: `/tmp/campusedux-production-smoke.json`. The isolated server was stopped afterward.
- `node --check` on both browser harness scripts and scoped `git diff --check`: passed. Existing Vitest CJS deprecation and mocked-server-render warnings remain.

Outstanding gates:

- DBMS: 149 seeded drafts plus 20 additional coverage drafts remain outside the prepared migration snapshot; 180 older packages lack independent review. Exact target SQL-engine/provider cases, DBMS lesson/practice browser QA, staging publication and authorization evidence remain unverified. Empty groups have authored drafts; repository files do not prove they are loaded into the running database.
- Projects/LCP/database latency: the current banner has no image request; the historical 32.49s banner / 34.68s LCP samples cannot be reproduced from absent evidence. Do not infer an improvement from fixture timings. Server query/connection/load measurements require verified staging. No 45–50-user load test is authorized or executed.
- SEO: repository metadata/canonical/robots/sitemap/redirect/structured-data regressions passed in Vitest; deployed HTTPS/host normalization, actual database-backed canonical URLs, Search Console/Bing/Analytics and external originality/AdSense review remain separate gates.
- Website/Admin local URLs were supplied (`http://localhost:3100`, `http://localhost:3200`) with user-reported prior CLI PASS results. On continuation, both ports refused connections from the command runner outside the sandbox and the browser service. Effective runtime targets remain unverified; CLI evidence alone does not prove them. `AGENTS.md` prohibits reading environment files or starting scripts that read them. The isolated build has no database configuration; it is not evidence of the applications' staging targets.
- No database writes, migration execution, schema/auth/payment changes, installs, deployment, branch creation, staging, commit or push occurred. Existing user changes were preserved. Revert only the continuation's small component/hook/test edits to roll back these repairs; do not reset the worktree.


### Staging reachability follow-up — 30 October 2026

The user supplied Website `http://localhost:3100`, Admin `http://localhost:3200`, and prior CLI results identifying staging project `biktjhenbvnklmagmvav`. The latest continuation rechecked both servers with credential-free HEAD requests to `/_next/static/chunks/webpack.js`, without following redirects or reading response bodies. The command runner outside the sandbox returned `ConnectionRefusedError` (errno 111) for both ports; the separate Playwright browser service also returned connection refused. No application page or runtime target was reachable, so no live performance/authentication/database claim is established.

`node website/scripts/staging-browser-qa.cjs --self-test` passed its origin restrictions, URL redaction and header-allowlist assertions. Previous successful builds and test suites were not repeated. Environment files, credential stores and process environments were not read. The repository startup script reads `.env.staging`; it was not invoked because `AGENTS.md:97` prohibits indirect environment-file reads. No database writes, migrations, load tests or production contact occurred. Evidence: `/tmp/campusedux-staging-reachability.json`. Next action: keep both verified staging servers running in a network context reachable from this session, then resume the read-only runtime checks.


### Runtime target verification after server startup — 30 October 2026

The Website became reachable: a credential-free local GET to `http://localhost:3100/about` returned HTTP 200. Its server-rendered `<link rel="dns-prefetch">` advertises **`oqwjooaapsotnncmhvtk.supabase.co` (production)**, rather than expected staging host `biktjhenbvnklmagmvav.supabase.co`. The inspected root layout constructs this exact hint from `NEXT_PUBLIC_SUPABASE_URL` (`website/src/app/layout.tsx`); the Website public server and browser clients use that same configuration variable. This is independent served-application evidence that the staging gate fails, regardless of prior CLI PASS reports. A stale build may retain a previous target; neither startup nor CLI linking proves that the currently served app is staging.

Admin `http://localhost:3200` still refused connections from both the command runner outside the sandbox and the separate Playwright service; IPv4 and IPv6 probes also refused connections. Its runtime target remains unverified. **Both-app staging verification: FAILED.**

Live QA stopped immediately after the production-host observation. The probes made local HEAD requests and one local GET `/about`; no browser navigation/subresource fetch or direct Supabase request was made by the probes. Server-side upstream traffic was not instrumented and is not certified absent. No credentials, environment files or process environments were inspected or exposed. No configuration modification, auth submission, database write, migration or load test occurred. Evidence: `/tmp/campusedux-runtime-target-verification.json`.

Required next step: the user restarts the Website with verified staging configuration and fresh served output, and makes Admin reachable on port 3200. Independently reverify both targets before resuming live QA; do not treat the production hint as a successful staging result.

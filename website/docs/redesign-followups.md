# Redesign follow-ups: needs backend / infra later

The 2026 website redesign (Phases 1–6) was UI-only: no schema, API, auth or
infrastructure changes. These items were found along the way and deliberately
left out. Each one needs a backend, content or infra decision of its own.

## Backend / data

1. **Sync learning progress to Supabase.**
   Lesson completion, last visited, streak, daily goal and badges are stored
   only on the device, in `localStorage`. They are not shared across browsers
   or with the mobile app. All reads and writes go through one adapter,
   `src/lib/learningProgress/store.ts`, behind the `useLearningProgress` hook.
   To move to Supabase, add a table with own-rows RLS and replace that adapter.
   `model.ts` and the UI stay as they are.

2. **Level / language / category filters on `/learning`.**
   The course hub filters only by Free/Premium, plus search. Courses
   (`learning_grids`) have no level, language or category fields to filter on.
   Add the fields, make them editable in the admin, and then add the filter
   chips.

3. **Course metadata.**
   The course page shows only real stats: sections, lessons, premium lessons
   and practice tests. "What you'll learn" is built from the section titles.
   Level, estimated duration, prerequisites and learning outcomes need
   admin-editable fields before the page can show them. Until then nothing is
   invented.

4. **Cross-course bookmarks.**
   Lesson bookmarks already exist (the `learning_bookmarks` table, own rows),
   but they only appear as markers inside each course's curriculum. There is no
   "all saved lessons" view: `/account` has saved jobs and saved projects, but
   no saved lessons. That view needs a query or RPC that resolves bookmarked
   topic ids to their course and lesson slugs and titles.

## Content

5. **Premium content to test with.**
   The live database has 0 premium courses and 0 premium lessons. Because of
   that, the Free/Premium filter stays hidden, and the premium lock and unlock
   screens can't be checked against real data. That includes the lesson
   completion card inside `PremiumTopicContent`. Before relying on these
   screens, add some premium content (or a staging seed) and QA them.

## Infra

6. **CSP blocks a GA request.**
   On every page, GA's `https://www.googletagmanager.com/td?...` image request
   is blocked by the CSP (`img-src 'self' data: https://*.supabase.co` in
   `next.config.js`), which logs a console error. This predates the redesign.
   Fix: add `https://www.googletagmanager.com` to `img-src`. This is a
   security-header change, so it needs the owner's approval.

7. **GA performance cost.**
   GA adds ~250–450 ms of Total Blocking Time on mobile under Lighthouse's
   4× CPU throttle. Consider a lighter analytics tool or further deferral as a
   separate, deliberate decision, not as part of this redesign.
   Current state: `gtag.js` loads with `strategy="lazyOnload"` in
   `src/components/analytics/GoogleAnalytics.tsx`, which stops it from
   competing with the page's own resources.
   Lighthouse mobile medians: 85–91 with GA, 93–96 with GA blocked.
   Don't load GA only after the first scroll or tap: visitors who leave
   immediately would no longer be counted.

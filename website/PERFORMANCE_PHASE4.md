# CampusEduX Website — Performance Phase 4: Assets

**Date:** 2026-09-06 · **Branch:** `audit/full-project-review`
**Scope:** items 22–26. No UI/UX change. typecheck + lint + build green. Zero JS-bundle impact (assets/config only).

---

## Summary

| Item | Outcome |
|---|---|
| 22 — `<img>` → `next/image`, AVIF/WebP, priority, blur | **Config + code done.** Only 3 raw `<img>` remain (all justified); added AVIF, trimmed `deviceSizes`, `priority` on the home-hero LCP image, blur placeholders on the big images. |
| 23 — Storage transforms / never ship originals | **Already handled by `next/image`** — every catalog image is fetched from `/_next/image` (resized + AVIF), never the Storage original. Native Supabase transforms = optional (Pro-plan) loader, snippet below. |
| 24 — `next/font`, subsetting, `display:swap` | **N/A — no web font.** System font stack, zero font requests, zero render-blocking font CSS. `next/font` would *add* a download where there is none. |
| 25 — lazy below-fold, reserve space | **Verified.** `next/image` is lazy by default; every `fill` image sits in an `aspect-[…]` box, every fixed image has `width`/`height` — no image CLS. |
| 26 — defer 3rd-party scripts, preconnect Supabase | **Done.** Razorpay already loads on checkout-click only (better than `lazyOnload`); no analytics/chat to defer; **added `<link rel="preconnect">` + `dns-prefetch` for the Supabase origin** in `<head>`. |

---

## 22 — Images

**Raw `<img>` inventory — 3, all deliberate:**

| File | What | Why not `next/image` |
|---|---|---|
| `nav/AuthMenu.tsx` (36px), `nav/MobileNav.tsx` (56px) | user avatar | Avatar host is Google / GitHub / Supabase — intentionally **not** in `remotePatterns`. Tiny, in a fixed-size parent (no CLS), never the LCP. **Added `width`/`height` + `loading="lazy"` + `decoding="async"`.** |
| `components/learning/Markdown.tsx` | admin-authored images inside Learning article bodies | Dimensions unknown at render time (CMS content). Already `loading="lazy"` + `max-w-full`. Next's own guidance is to use `<img>` for unknown-dimension CMS content. |

Everything else already uses `next/image` (10 files: cards, galleries, hero, logos, notification/purchase thumbnails).

**`next.config.js` `images`:**
```js
formats: ["image/avif", "image/webp"],   // was: WebP only (Next default). AVIF ≈ 20–30% smaller.
minimumCacheTTL: 86400,                   // was: 60s — re-optimised catalog images hourly. Now daily.
deviceSizes: [640, 750, 828, 1080, 1200, 1920],  // dropped 2048/3840 — nothing on the site is that wide.
```

**`priority` — LCP image only:**
- `projects/[id]/Gallery.tsx` — already `priority` (the project shot is that page's LCP). ✓
- `page.tsx` home hero banner image — **added `priority`** (when an admin banner is set it's the home LCP; Phase 0 finding B10). The *default* home hero is a text `<h1>` + a server-rendered UI panel, no image — nothing to prioritise there.
- Company logos (48–56px) on `/jobs/*` — left un-prioritised; the `<h1>` is the LCP, not a 48px logo.

**Blur placeholders:** new `src/lib/image.ts` exports `IMAGE_BLUR_DATA_URL` — a solid 8×6 PNG tinted `#EEF0FF` (= `bg-primary-50`, the colour those image containers already use). Applied `placeholder="blur"` on `ProjectCard`, the `Gallery` primary image, and the home hero. It removes the white flash before paint. We have **no per-image blur hash** (Supabase Storage doesn't produce one at upload), so a real LQIP isn't available without a build step or an upload hook — a solid tint is the honest substitute and matches what the containers already show. Logos (≤56px) don't get one — pointless at that size.

## 23 — Storage transforms / not shipping originals

**Already satisfied by `next/image`.** Every catalog image (`ProjectCard`, `JobCard`, `CompanyCard`, `Gallery`, home hero, `NotificationRow`, `account/purchases`) is rendered through `next/image`, so the browser requests
`/_next/image?url=<storage-url>&w=<needed width>&q=75` and receives a **resized, AVIF/WebP** image from the Next optimizer — the full-size Storage original never reaches the client. Verified: `/_next/image` enforces `remotePatterns` (`400` for a disallowed host, `404` for allowed-but-missing).

The only bypass is the two raw `<img>` (tiny avatars) and Markdown article images — negligible / unavoidable.

**Optional (Supabase Pro plan):** move the resize work off the Next server onto Supabase's own image CDN with a custom loader —
```js
// next.config.js:  images: { loader: "custom", loaderFile: "./src/lib/supabaseImageLoader.ts" }
// src/lib/supabaseImageLoader.ts
export default function loader({ src, width, quality }) {
  const u = new URL(src);
  // /object/public/…  ->  /render/image/public/…?width=&quality=
  u.pathname = u.pathname.replace("/object/public/", "/render/image/public/");
  u.searchParams.set("width", String(width));
  u.searchParams.set("quality", String(quality ?? 75));
  return u.toString();
}
```
Not wired here — it needs the Pro plan and testing against the live project. `next/image`'s built-in optimizer already meets the "never ship originals" requirement.

## 24 — Fonts

**Nothing to do — there is no web font.** `layout.tsx` documents it: the site uses the platform system-font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, …` in `tailwind.config.ts` + `globals.css`) to match the mobile app. Confirmed: no `next/font`, no `@font-face`, no `fonts.googleapis.com` / `fonts.gstatic.com` link, no `@import url(...)`. **There is no render-blocking font CSS**, and `font-display` is moot with no custom face. Adding `next/font` would *introduce* a font-file download and a FOUT/FOIT window where currently there is neither — a regression, so it's deliberately not done.

## 25 — Lazy below-fold media + reserved space

- `next/image` lazy-loads everything without `priority` by default — nothing extra needed.
- **No image CLS:** every `fill` image is inside an `aspect-[16/9]` / `aspect-[16/10]` / `aspect-[4/3]` box (ProjectCard, JobCard, Gallery, home hero) or a fixed-px box (`NotificationRow` 56px, `account/purchases` 80×56); every non-`fill` image (logos) has explicit `width`/`height`. Space is reserved before the image loads.
- The Markdown article `<img>` has no reserved box (unknown dimensions) — a minor, below-the-fold reflow in Learning article bodies; left as-is.
- `AnnouncementBar` (renders `null` → a bar, client-fetched) still shifts content down when an announcement is active. That's a client-island issue (Phase 0 B6) — reserving a permanent empty 40px strip for the ~99% of loads with no announcement would be worse. It moves when B6 (server-render the bar) is done.

## 26 — Third-party scripts + resource hints

- **Razorpay `checkout.js`** — loaded by `lib/razorpay.ts` via an on-demand `document.createElement("script")`, only when the user actually clicks Buy / Top-up / Subscribe. That's *more* deferred than `next/script strategy="lazyOnload"` (which would load it on every page view). Left as-is; added a global `dns-prefetch` to `checkout.razorpay.com` so the eventual click resolves DNS instantly.
- **No analytics / chat / error-reporting scripts** in the client anywhere — nothing to defer.
- **Supabase preconnect (the real win):** the browser opens a connection to the Supabase project on essentially every page (the client session check in the nav islands, the announcements query, Storage image hosts). `layout.tsx` `<head>` now emits:
  ```html
  <link rel="preconnect" href="https://<project>.supabase.co" crossorigin="anonymous">
  <link rel="dns-prefetch" href="https://<project>.supabase.co">
  ```
  so DNS + TLS + TCP are warm before the first client Supabase call fires — shaves the handshake (~100–300 ms on a cold connection, mobile) off the first interaction on every route. Verified present on `/` and `/projects`.

## Files

```
 M next.config.js                    images: formats/minimumCacheTTL/deviceSizes
 M src/app/layout.tsx                <head> preconnect + dns-prefetch (Supabase, Razorpay)
 M src/app/page.tsx                  home hero <Image>: priority + blur
 M src/app/projects/[id]/Gallery.tsx primary image: blur
 M src/components/ProjectCard.tsx    thumbnail: blur
 M src/components/nav/AuthMenu.tsx   avatar <img>: width/height/lazy/async
 M src/components/nav/MobileNav.tsx  avatar <img>: width/height/lazy/async
?? src/lib/image.ts                  NEW — IMAGE_BLUR_DATA_URL
```

## Verified / not verified

- **Verified:** build/typecheck/lint green (build 60 s); `next.config` image settings baked into `.next/required-server-files.json`; `/_next/image` optimizer live and enforcing `remotePatterns`; `preconnect`/`dns-prefetch` links present in served HTML on multiple routes.
- **Not verifiable here:** the seed database has **zero images** (no project thumbnails, company logos, or banners), so end-to-end AVIF negotiation and the blur-placeholder render could not be exercised against real data. The code follows Next's documented `next/image` API exactly and the build validates `blurDataURL` format, so this is a data-availability gap, not a correctness risk. Re-check on a deployment with real catalog images.

## Still the biggest lever (unchanged)

The nav/session islands pull `@supabase/supabase-js` (~64 kB gz) into every route's first-load JS — the `SessionProfileProvider` + `next/dynamic` header refactor (Phase 0 B1/B2). Untouched by Phase 4.

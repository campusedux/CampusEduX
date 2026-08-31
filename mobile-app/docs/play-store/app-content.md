# Google Play — App content declarations (CampusEduX)

For **Play Console → App content**. Answers reflect the actual app as of
2026-08-31. Items marked ⚠️ need an owner decision or a live URL first.

## Privacy policy

* URL: `https://campusedux.app/privacy-policy` ⚠️ must be live before submission
  (generate + host `mobile-app/legal-site/` — see `legal-site/README.md`).
* Must be reachable without login, on mobile, and describe the same data as the
  Data Safety form (`docs/play-store/data-safety.md`).

## Ads

* **The app contains no ads.** No ad SDK, no ad mediation, no affiliate/ad
  network in `package.json` or source. Declare **"No, my app does not contain
  ads."**

## App access

* All functionality is behind a login. Provide Play review with **test
  credentials** (a real account: email + password, or mobile + password) and a
  short note: "Register is disabled behind email verification; use the provided
  account. Payments use Razorpay test mode — do not complete a real payment."
* If a demo account is not desired, record a screencast walkthrough instead.

## Content rating (questionnaire)

* Category: **Education / Reference**.
* No violence, no sexual content, no profanity, no controlled substances, no
  gambling (the wallet is stored value for in-app purchases, not gambling — the
  questionnaire's gambling questions should be answered **No**; add a clarifying
  note if prompted).
* User-generated content **is** present (reviews, custom-project chat) → answer
  "Yes" to UGC and point to the Community Guidelines + in-app reporting
  (`support@campusedux.app`) and moderation described there.
* Digital purchases: **Yes** (projects, Premium, wallet, custom-project token).
* Expected result: rated for **Everyone / 3+** or **PEGI 3 / IARC equivalent**,
  possibly **Teen** because of UGC + purchases. Accept whatever the questionnaire
  returns; do not hand-pick.

## Target audience and content

* **Target age groups: 13–15, 16–17, and 18+.** Do **not** include "Under 13".
* This matches the Privacy Policy and Terms (minimum age 13; 13–17 with
  parent/guardian involvement).
* "Do you want your app in the Designed for Families programme?" → **No**.
* Store listing / registration copy should not imply the app is for children.
* Because some users are under 18, avoid any future ad SDK without age-gating,
  and keep data collection to the documented minimum (already the case).

## Data safety

* See `docs/play-store/data-safety.md` for the full mapping.

## Government apps / Financial features / Health

* Not a government app. Not a financial-services app (the wallet is closed-loop
  in-app value; no lending, no investment, no money transmission outside the
  app). No health features.

## News apps

* Not a news app.

## COVID-19 / other special declarations

* None apply.

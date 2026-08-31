# Google Play — Data Safety declaration (CampusEduX)

Derived from the actual mobile-app source, Supabase migrations and Edge Functions
as of 2026-08-31. Transcribe this into **Play Console → App content → Data safety**.
Re-verify before every submission if new data collection is added.

## Summary answers

| Play question | Answer | Note |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | See table below. |
| Is all of the user data collected by your app encrypted in transit? | **Yes** | HTTPS/TLS to Supabase and Razorpay; no plaintext endpoints. |
| Do you provide a way for users to request that their data be deleted? | **Yes** | In-app: Profile → Settings → Legal & Privacy → Delete Account (also Privacy → Delete Account). Web/email: `privacy@campusedux.app`. URL: `https://campusedux.app/delete-account`. |
| Committed to follow the Play Families Policy? | **No / N/A** | Target audience 13+, not "designed for children". |
| Independent security review? | **No** | Do not claim one. |

**"Collected" vs "Shared":** CampusEduX *collects* data into its own Supabase
backend. It does **not** *share* (transfer to a third party for their own use)
any personal data. Service providers (Razorpay, Supabase, Google Sign‑In) process
data on CampusEduX's instructions only — per Play's definitions that is **not**
"sharing". Showing a review or a name to other app users is publication, not
sharing.

**Not collected (do NOT tick):** precise or approximate location, contacts,
calendar, SMS/call logs, health/fitness, web-browsing history, installed apps,
advertising ID, device identifiers. No analytics SDK, no ads SDK, no crash SDK.
No Expo push token is registered by the current build.

**IP address:** processed server-side by Supabase/Razorpay solely for security,
fraud prevention and legal compliance. Under Play's Data Safety exemptions this
does not need to be declared as collected data. Do not tick "Device or other IDs"
for this reason alone.

## Data types collected

| Data type (Play taxonomy) | Collected | Purpose(s) | Optional? | Where in the app |
|---|---|---|---|---|
| **Personal info → Name** | Yes | App functionality; Account management | Required | Registration `full_name` |
| **Personal info → Email address** | Yes | App functionality; Account management | Required | Registration; also from Google if "Continue with Google" |
| **Personal info → Phone number** | Yes | App functionality; Account management | Required | Registration `mobile_number` (also used for login) |
| **Personal info → User IDs** | Yes | App functionality; Account management | Required | Supabase auth user id / profile id |
| **Personal info → Other info** (date of birth, gender, city) | Yes | App functionality; Personalisation | **Optional** | Edit Profile — user may leave blank / clear |
| **Financial info → Purchase history** | Yes | App functionality; Account management; Fraud prevention | Optional (only if you buy) | `purchases`, `premium_subscriptions`, `wallet_topup_orders`, `custom_project_payments` — order id, payment id, amount, status, item |
| **Financial info → Payment info** | Yes (via bundled Razorpay SDK) | App functionality (process payments) | Optional (only if you pay) | `react-native-razorpay` collects card/UPI/net-banking in Razorpay's own UI. **CampusEduX servers never receive or store these credentials.** Processed by Razorpay under its policy. |
| **Financial info → Other financial info** | Yes | App functionality (wallet, payouts) | Optional | `wallet_transactions` ledger; UPI ID entered for a withdrawal request |
| **Messages → Other in-app messages** | Yes | App functionality | Optional | Custom Project chat (`custom_project_messages`) between the user and staff |
| **Photos and videos → Photos** | Yes | App functionality | Optional | Profile photo, resume photo, custom-project reference images → Supabase Storage |
| **Files and docs** | Yes | App functionality | Optional | Uploaded resume files; custom-project reference documents |
| **App activity → App interactions** | Yes | App functionality; Personalisation | Optional | Wishlist, downloads, job applications & status, practice-test attempts, DSA progress, referrals |
| **App activity → Other user-generated content** | Yes | App functionality | Optional | Reviews & ratings; Resume Builder content; Custom Project Builder text |
| **App info and performance → Diagnostics** | **No** | — | — | No crash/analytics SDK in this build |

For every row above, the answers to the two per-type questions are:

* *Is this data shared with third parties?* → **No** (see "Collected vs Shared").
* *Is this data collected, or only ephemerally processed?* → **Collected**.
* *Is this data required or can users choose whether it's collected?* → as per the "Optional?" column.
* *Purposes* → only the purposes listed above. **Do not** tick "Advertising or
  marketing", "Analytics", "Developer communications" (beyond service messages),
  "Personalisation" is only for the profile/academic fields and app-activity rows.

## Data deletion detail (for the deletion section)

Deletion removes the profile and all personal records (purchases visible to the
user, applications, resumes and files, wallet ledger, referrals, reviews,
notifications, preferences, custom-project requests and their files) and the
login. **Retained after deletion:** transaction/tax records that Indian law
requires be kept, records needed for an open dispute or fraud investigation, and
short-lived encrypted backups that cycle out. State this in the Data Safety
deletion notes and it is already covered in the Privacy Policy and the Delete
Account page.

# Legal Data Map (for future Play Store Data Safety form)

Based only on tables actually present in the audited repository.

| Data collected | Source table | Purpose | Third-party processor | Retention / deletion |
|---|---|---|---|---|
| Name, email, avatar | `profiles` | Account identity | Supabase Auth | Deleted by `delete-account` function |
| Academic details (course/branch/year, free text) | `profiles` | Academic targeting of content | — | Deleted with profile |
| Purchases, downloads, wishlists, reviews | `purchases`, `downloads`, `wishlists`, `reviews` | Marketplace functionality | — | Deleted by `delete-account` |
| Uploaded resumes (PDF) | `resumes` + Storage bucket `resumes` | Job applications | Supabase Storage | Deleted by `delete-account` |
| Resume builder content | `resumes_builder`, `resume_downloads` | Resume creation feature | — | Deleted by `delete-account` |
| Job applications, saved jobs, alerts | `applications`, `saved_jobs`, `job_alerts` | Jobs feature | — | Deleted by `delete-account` |
| Wallet ledger, top-up orders | `wallet_transactions`, `wallet_topup_orders` | Wallet feature | Razorpay (payment processing) | Deleted by `delete-account` — **confirm with owner whether Razorpay/tax law requires separate retention outside the app DB** |
| Referral relationships & earnings | `referrals`, `referral_codes`, `referral_earnings` | Referral program | — | Deleted by `delete-account` |
| Premium subscription record | `premium_subscriptions` | Premium feature | Razorpay | Deleted by `delete-account` |
| Test attempts, DSA progress, saved questions | `test_attempts`, `user_dsa_progress`, `user_favorite_questions` | Placement prep tracking | — | Deleted by `delete-account` |
| Notifications, preferences | `notifications`, `notification_preferences`, `user_preferences` | App functionality | — | Deleted by `delete-account` |

**Payment processing:** Razorpay handles all card/UPI details directly; CampusEduX
tables only store order status, order IDs and payment IDs, verified server-side via
HMAC signature check in each Edge Function (`verify-razorpay-payment`,
`verify-premium-payment`, `verify-wallet-topup-payment`, `verify-custom-project-payment`).

**Open item (owner decision required):** whether any records must be retained past
account deletion for accounting/tax/fraud purposes, and for how long. Do not state a
retention period publicly until this is confirmed.

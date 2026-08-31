# Website Feature Matrix

| Feature | Mobile Screen(s) | Backend Table/Service | Admin Panel | Website Route | Public/Auth | Status |
|---|---|---|---|---|---|---|
| Categories | Home | `categories` | Projects admin | `/`, `/projects/category/[id]` | Public | Done |
| Project marketplace | Project Marketplace | `projects`, `reviews` | Projects admin | `/projects`, `/projects/[id]`, `/projects/trending`, `/premium`, `/best-sellers`, `/new` | Public | Done |
| Purchasing / downloads / source code | My Projects | `purchases`, `downloads`, `project_deliverables` | Orders admin | `/account/purchases` (view only) | Auth-only | Read done in Phase 2; source-code/download delivery still app-only |
| Jobs board | Jobs | `jobs`, `companies`, `recruiters` | Jobs admin | `/jobs`, `/jobs/[id]`, `/jobs/companies`, `/jobs/companies/[id]` | Public | Done |
| Job applications, saved jobs, alerts | Jobs | `applications`, `saved_jobs`, `job_alerts`, `resumes` (+ Storage) | Jobs admin | `/account/applications`, `/account/saved-jobs`, `/jobs/[id]` apply panel | Auth-only | **Done** — apply from `/jobs/[id]` (pick/upload resume → `resumes` + `applications`), Save/Unsave toggle. Job alerts still app-only |
| Placement prep (aptitude/DSA/HR) | Placement Prep | `aptitude`, `dsa`, `hr_questions`, `practice_tests`, `test_attempts` | Placement admin | `/placement` (overview only) | Mixed | Overview public; practice/tests/progress are account-tied, not built |
| Resume builder | Resume Builder | `resumes_builder`, `resume_templates`, `resume_downloads` | Resume admin | `/resume`, `/resume/templates`, `/account/resume` | Mixed | Overview/templates/account view done; section-by-section editing stays in-app |
| Custom project builder | Custom Projects | `custom_project_*` (drafts, requests + snapshot children, payments, history, deliveries, messages) | Custom Projects admin | `/custom-projects` + `/custom-projects/{start,features,estimate,checkout,my-projects,my-projects/[id]}` | Mixed | **Done** — draft-backed wizard, server-side estimate, `create/verify-custom-project-payment` Edge Functions (unchanged), request tracking + timeline + delivery + messaging |
| Premium | Premium | `premium_plans`, `premium_features`, `premium_subscriptions` | Settings admin | `/premium` | Mixed | Plans public; **real Razorpay subscribe flow done** (`create-premium-order` → Checkout.js → `verify-premium-payment`) |
| Referral | Referral | `referral_codes`, `referrals`, `referral_earnings`, `reward_settings` | Referrals admin | `/referral`, `/account/referral` | Mixed | Program rules public; personal history + shareable link done in Phase 2 |
| Wallet | Profile/Referral (Wallet) | `wallet_transactions`, `wallet_topup_orders` | — | `/account/wallet` | Auth-only | Done — real ledger + **real top-up** (`create-wallet-topup-order` → Checkout.js → `verify-wallet-topup-payment`) |
| FAQ | Settings/Support | `faqs` | CMS admin | `/faq` | Public | Done, live from CMS |
| Contact form | — (website only) | `contact_submissions` + `submit_contact_message()` RPC | CMS admin → `/cms/contact` | `/contact` | Public | **Done** — validated + rate-limited via SECURITY DEFINER RPC; needs `website/supabase/migrations/0001` applied |
| Testimonials | Home | `testimonials` | CMS admin | `/` (home strip) | Public | Done, live from CMS |
| Banners / announcements | Home | `banners`, `announcements` | CMS admin | — | Public | Not yet surfaced on website (data exists, no UI slot built this phase) |
| Terms / Privacy / Refund Policy | Settings (legal) | `cms_pages` | CMS admin | `/terms`, `/privacy-policy`, `/refund-policy` | Public | Live from CMS; **empty until owner writes real content** |
| Project License | — | *(no table — not modelled anywhere in repo)* | — | `/project-license` | Public | Static placeholder, flagged for owner decision |
| Community Guidelines | — | `review_reports` (moderation only) | Reviews admin | `/community-guidelines` | Public | Static draft, enforcement details flagged for owner confirmation |
| Disclaimer | — | — | — | `/disclaimer` | Public | Static, done |
| Delete Account | Settings | Edge Function `delete-account` (real, audited) | — | `/delete-account` | Public explainer | Done — description matches the actual function's table list |
| Auth (login/signup) | Auth | `auth.users`, `profiles`, `handle_new_user()` trigger | — | `/login`, `/register`, `/logout` | Public | Done — reuses the existing trigger + `email_for_mobile` RPC |
| Account dashboard | Profile | many | — | `/account/*` | Auth-only | Done (overview, profile, purchases, applications, saved jobs, resume, wallet, referral, notifications) |
| SEO structured data | — | — | — | Product/JobPosting/FAQPage/Organization JSON-LD | Public | Done, only rendered when the underlying real data exists |
| Security headers | — | — | — | `next.config.js` | n/a | Done — CSP scoped to Supabase + Razorpay + Google Fonts only |
| Admin panel | — | all | itself | *(separate app, already exists)* | Admin-only | Out of scope — already exists, not touched |

# Website Route Map

| Route | Purpose | Data source | Auth | SEO |
|---|---|---|---|---|
| `/` | Homepage | categories, projects, jobs, testimonials, faqs | Public | Indexed |
| `/projects` | Catalog + search | `projects` | Public | Indexed |
| `/projects/[id]` | Project detail + reviews | `projects`, `reviews`, `profiles` | Public | Indexed, dynamic metadata |
| `/projects/category/[category]` | Category listing | `categories`, `projects` | Public | Indexed |
| `/projects/trending` `/projects/premium` `/projects/best-sellers` `/projects/new` | Filtered listings | `projects` | Public | Indexed |
| `/jobs` | Job catalog + search | `jobs` | Public | Indexed |
| `/jobs/[id]` | Job detail | `jobs`, `companies` | Public | Indexed, dynamic metadata |
| `/jobs/companies` `/jobs/companies/[id]` | Company directory + detail | `companies`, `jobs` | Public | Indexed |
| `/placement` | Prep track overview | `companies` | Public | Indexed |
| `/resume` `/resume/templates` | Resume builder overview + templates | `resume_templates` | Public | Indexed |
| `/custom-projects` | Builder explainer + live pricing | `custom_project_pricing`, `custom_project_platform_pricing`, `custom_project_features` | Public | Indexed |
| `/custom-projects/start` `/features` `/estimate` `/checkout` | Request wizard (draft-backed; server-computed estimate) | `custom_project_drafts`, catalog tables, `create/verify-custom-project-payment` Edge Functions | Auth-only | `noindex` |
| `/custom-projects/my-projects` `/my-projects/[id]` | Paid requests: status, timeline, files, delivery, messages | `custom_project_requests` + `_request_features` / `_request_files` / `_request_history` / `_deliveries` / `_delivery_assets` / `_messages` | Auth-only | `noindex` |
| `/premium` | Plans + features | `premium_plans`, `premium_features` | Public | Indexed |
| `/referral` | Program explainer + live reward rule | `reward_settings` | Public | Indexed |
| `/faq` | Full FAQ, grouped | `faqs` | Public | Indexed |
| `/about` `/support` | Company/info pages | static + env config | Public | Indexed |
| `/contact` | Contact form (`submit_contact_message()` RPC → `contact_submissions`) | env config + `contact_submissions` | Public | Indexed |
| `/jobs/[id]` apply panel | Apply (resume pick/upload) + save toggle | `resumes`, `applications`, `saved_jobs`, `resumes` Storage bucket | Auth-only island | n/a |
| `/privacy-policy` `/terms` `/refund-policy` | Legal (Play Store required) | `cms_pages` | Public | Indexed |
| `/project-license` `/community-guidelines` `/disclaimer` `/delete-account` | Legal/policy (static) | static | Public | Indexed |
| `/sitemap.xml` | Generated sitemap | projects, jobs, categories, companies | Public | n/a |
| `/robots.txt` | Crawl rules | static | Public | n/a; blocks `/account`, `/auth`, `/api`, `/admin`, `/custom-projects/{start,features,estimate,checkout,my-projects}` |
| `/login` `/register` `/logout` | Auth | `auth.users`, `profiles` | Public | Indexed |
| `/account` | Dashboard overview | `wallet_transactions`, `purchases`, `applications`, `referral_codes` | Auth-only | `noindex` |
| `/account/profile` | View/edit profile | `profiles` | Auth-only | `noindex` |
| `/account/purchases` | Purchase history | `purchases`, `projects` | Auth-only | `noindex` |
| `/account/applications` | Application status | `applications`, `jobs` | Auth-only | `noindex` |
| `/account/saved-jobs` | Saved jobs | `saved_jobs`, `jobs` | Auth-only | `noindex` |
| `/account/resume` | Resume overview | `resumes_builder`, `resume_downloads` | Auth-only | `noindex` |
| `/account/wallet` | Ledger + top-up | `wallet_transactions` + `create/verify-wallet-topup-*` Edge Functions | Auth-only | `noindex` |
| `/account/referral` | Referral history + link | `referral_codes`, `referrals` | Auth-only | `noindex` |
| `/account/notifications` | Notifications | `notifications` | Auth-only | `noindex` |

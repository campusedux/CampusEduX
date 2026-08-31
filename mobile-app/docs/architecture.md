# Architecture

Expo / React Native app (`campusedux`, display name **CampusEduX**). Expo SDK
55, React 19, TypeScript strict, NativeWind (Tailwind) styling, React Navigation
v7, `@tanstack/react-query` for server state, Zustand for local state, Supabase
for auth + data + Edge Functions.

## Entry

```
index.js → App.tsx → src/app/App.tsx
                       └─ RootProvider  (GestureHandlerRootView, SafeAreaProvider,
                       │                 QueryClientProvider)
                       └─ Navigation    (hydrates settings from Supabase once,
                                         then renders RootNavigator)
```

## `src/` layout

| Folder | What's in it |
|--------|--------------|
| `app/` | `App`, `RootProvider` (providers), `Navigation` (thin wrapper). |
| `navigation/` | 16 navigators — `RootNavigator` → `AuthNavigator` \| `DrawerNavigator` → `BottomTabNavigator` + module stacks. See [navigation.md](./navigation.md). |
| `auth/` `home/` `project/` `jobs/` `placement/` `resume/` `myProjects/` `profile/` `referral/` `premium/` `settings/` | The 11 feature modules — 130+ screen components (`*Screen.tsx`). Screens are presentational + a hook call; no direct Supabase access. |
| `components/ui/` | Shared primitives: `Screen`, `Button`, `Input`, `Chip`, `RatingStars`/`RatingBar`, `CircularProgress`, `SectionHeader`, `SelectableCard`, `AuthHeader`, `OnboardingSlide`, `StateViews` (`LoadingState` / `ErrorState` / `EmptyState`). |
| `components/cards/` | `ProjectCard`, `JobCard`, `CategoryCard`, `ProjectListTemplate`. |
| `components/placement/` | `AptitudeTopicListTemplate`. |
| `hooks/` | One hook module per feature (`useHomeData`, `useProjects`, `useJobs`, `usePlacement`, `useResume`, `useMyProjects`, `useProfile`, `useReferral`, `usePremium`, `useWallet`, `useSettings`, `usePayment`, `useAuth`). Wrap services in `useQuery` / `useMutation`, own the query keys and cache invalidation. |
| `services/` | One `*.service.ts` per feature. The **only** layer that talks to `supabase` (`@/lib/supabase`) or `supabase.functions.invoke`. Each read tries Supabase and falls back to `src/data/sample*.ts` on error/empty. Row → app-type mapping (`mapProjectRow`, `mapJobRow`, …) lives here. |
| `lib/` | `supabase.ts` (client; refuses to boot with a service-role key), `storage.ts` (`secureStorage` = SecureStore on native / AsyncStorage on web; `supabaseAuthStorage`), `notify.ts` (`notify` / `notifyThen` / `confirmAction`, cross-platform Alert). |
| `store/` | Zustand: `authStore` (session + `UserProfile` + onboarding/profile-setup flags), `settingsStore` (persisted preferences + notification prefs), `jobFilterStore` / `projectFilterStore` (filter-sheet ↔ list screen). |
| `constants/` | `theme` (colors/spacing), `routes` (route-name maps), `options` (`COURSES`, `BRANCHES`, `YEARS`). |
| `data/` | `sample*.ts` — the offline fallback content, one file per module. `supabase/seed.sql` is the SQL translation of these. |
| `types/` | `*.types.ts` per domain, re-exported from `types/index.ts`. `razorpay.d.ts` for `react-native-razorpay`. |

## Data flow

```
Screen  ──uses──▶  hooks/useX  ──react-query──▶  services/x.service
                                                     │
                          ┌──────────────────────────┼───────────────────────────┐
                          ▼                          ▼                           ▼
                 supabase.from(<table>)   supabase.functions.invoke(<fn>)   src/data/sample*.ts
                 (PostgREST + RLS)         (Edge Function, Razorpay)         (fallback on error/empty)
```

- **Server state** — React Query (`staleTime` default, `retry: 1`,
  `refetchOnWindowFocus: false`). Query keys are defined next to each hook.
- **Auth** — `supabase.auth` session persisted via AsyncStorage; `authStore`
  mirrors the `UserProfile`. `authService` also resolves mobile→email through
  the `email_for_mobile` RPC before sign-in.
- **Payments** — `usePayment` / `useWallet` / `usePremium` open
  `react-native-razorpay`, then call the verify Edge Function; the client never
  sees the Razorpay secret and never self-reports success.
- **Local/UI state** — Zustand stores; settings are also synced to
  `user_preferences` / `notification_preferences` so they follow the user across
  devices.

## Backend

`supabase/migrations/*.sql` (schema + RLS + triggers — see
[database.md](./database.md)), `supabase/functions/*` (Edge Functions — see
[api.md](./api.md)), `supabase/seed.sql` (demo data).

A sibling `admin-panel/` (Next.js) manages catalog and operational data on the
**same Supabase project**, and uses **no service-role key**. Every read and
write runs as the signed-in admin's own session (`@supabase/ssr`), authorised
by the `is_admin(auth.uid())` RLS policies added in
`admin-panel/supabase/migrations/002_admin_rls_policies.sql` (alongside, never
replacing, the student `auth.uid() = user_id` policies). The few money-moving
operations — wallet adjustments, refund and withdrawal approvals — go through
`SECURITY DEFINER` functions (`admin_adjust_wallet`, `admin_process_refund`,
`admin_process_withdrawal`) that re-check `is_admin()` themselves. This matches
the note in `admin-panel/.env.example`.

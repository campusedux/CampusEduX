# Deployment

Two independent pieces: the **Supabase backend** (schema, Edge Functions, demo
data, Storage) and the **mobile app** (EAS builds for the stores + Expo web).

---

## 1. Supabase backend

### One-time

```bash
npm i -g supabase
supabase login
supabase link --project-ref <project-ref>        # the ref from EXPO_PUBLIC_SUPABASE_URL
```

### Schema + demo data

```bash
supabase db push                 # apply supabase/migrations/* to the linked project
# local dev only — wipes + re-seeds:
supabase db reset                # re-runs every migration, then supabase/seed.sql
```

No CLI? Paste each `supabase/migrations/000N_*.sql` into **Dashboard → SQL
Editor → Run**, in order. `seed.sql` is optional and creates the demo login
`demo@campusedux.app` / `CampusEduXDemo!23` (mobile `9999999999`).

### Storage buckets (Dashboard → Storage → New bucket, **Public**)

`avatars`, `resumes`, `project-files` — not created by migrations.

### Edge Functions

```bash
supabase functions deploy create-razorpay-order verify-razorpay-payment \
  create-premium-order verify-premium-payment \
  create-wallet-topup-order verify-wallet-topup-payment delete-account

# Razorpay keys (server-only). SUPABASE_* are injected automatically.
cp supabase/functions/.env.example supabase/functions/.env   # fill in
supabase secrets set --env-file supabase/functions/.env
```

Local run: `supabase functions serve --env-file supabase/functions/.env`.

---

## 2. Mobile app (EAS)

### Prerequisites

- `npm i -g eas-cli && eas login`
- Apple Developer account (iOS) / Google Play Console + service-account JSON (Android)
- `mobile-app/.env` with `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable key only — `src/lib/supabase.ts`
  refuses to start with a `sb_secret_*` / `service_role` key). `EXPO_PUBLIC_*`
  vars are inlined at build time, so re-build after changing them.
- App identifiers are already set in `app.json`: iOS/Android
  `com.campusedux.app`, scheme `campusedux`. App icons/splash resolve from
  `assets/` (see `expo.icon` / `expo.splash` / `android.adaptiveIcon` /
  `web.favicon` in `app.json`).

### Profiles — `eas.json`

| Profile | Use | Notes |
|---------|-----|-------|
| `development` | local dev client (`expo-dev-client`) | `distribution: internal` |
| `preview` | internal QA / TestFlight-style share | `distribution: internal` |
| `production` | store submission | `autoIncrement: true` (build number) |

### Build

```bash
cd mobile-app
npm run check                                   # tsc --noEmit && eslint
npm test                                        # jest

eas build --profile development --platform all   # dev client
eas build --profile preview     --platform all   # QA
eas build --profile production   --platform all   # store binaries (.aab / .ipa)
```

Set EAS secrets so cloud builds get the env:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL      --value https://<ref>.supabase.co
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value sb_publishable_xxx
```

### Submit

```bash
eas submit --profile production --platform ios       # needs Apple credentials
eas submit --profile production --platform android   # needs Play service-account JSON
```

`eas.json → submit.production` is a placeholder — add
`android.serviceAccountKeyPath` / `ios.appleId`, `ascAppId` there or pass them
interactively.

### OTA updates (optional)

`npx expo install expo-updates`, add an `updates` / `runtimeVersion` block to
`app.json`, then `eas update --branch production` to ship JS-only changes
without a store review.

### Web (Expo Web)

```bash
npx expo export --platform web        # static build in dist/
```

Host `dist/` on any static host. The Supabase client already enables
`detectSessionInUrl` on web for OAuth / password-recovery redirects.

---

## Release checklist

1. `npm run check && npm test` green.
2. `supabase db push` — migrations applied.
3. Edge Functions deployed; `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` set
   (functions return `503` until then).
4. `avatars` / `resumes` / `project-files` buckets exist and are public.
5. Bump `expo.version` in `app.json` (+ `ios.buildNumber` / `android.versionCode`
   or rely on `autoIncrement`).
6. `eas build --profile production --platform all` → `eas submit`.

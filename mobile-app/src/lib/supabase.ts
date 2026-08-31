import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { supabaseAuthStorage } from "./storage";

/**
 * Supabase client for Expo (native) and Expo Web.
 *
 * Env vars must be inlined by Metro at build time, so they are read as full
 * `process.env.EXPO_PUBLIC_*` member expressions — Metro only substitutes the
 * literal form, never `process.env[name]`.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

// EXPO_PUBLIC_SUPABASE_ANON_KEY is canonical; PUBLISHABLE_KEY is accepted as an
// alias so either naming in .env works.
const supabaseClientKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseClientKey) {
  throw new Error(
    "Supabase env vars are missing. Set EXPO_PUBLIC_SUPABASE_URL and " +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile-app/.env, then restart Metro " +
      "with `npx expo start --clear` (env changes are not hot-reloaded)."
  );
}

// A client bundle must never contain a Supabase secret / service-role key.
// Both are readable by anyone who opens the app or the web bundle.
if (
  supabaseClientKey.startsWith("sb_secret_") ||
  supabaseClientKey.includes("service_role")
) {
  throw new Error(
    "Refusing to start: a Supabase secret/service-role key was found in a " +
      "client env var. Use the publishable key (sb_publishable_…) for " +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY and rotate the leaked secret key."
  );
}

const isWeb = Platform.OS === "web";

export const supabase = createClient(supabaseUrl, supabaseClientKey, {
  auth: {
    storage: supabaseAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Only the browser can carry OAuth / password-recovery tokens back in the
    // URL fragment. Enabling it on native would parse a URL that never exists.
    detectSessionInUrl: isWeb,
    flowType: "pkce",
    // No `lock` option on purpose: supabase-js >= 2.10x coordinates session
    // refreshes without one and warns that "lock" is deprecated if passed.
  },
});

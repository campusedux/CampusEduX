import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import type { LoginPayload, RegisterPayload, UserProfile } from "@/types";

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

/**
 * PostgREST answers 404 / PGRST205 when a table is absent from the schema
 * cache. That surfaced to users as a bare "Unable to load profile", which hid
 * the actual cause. Translate it into something actionable.
 */
function describeQueryError(error: { code?: string; message: string }, table: string) {
  if (error.code === "PGRST205" || /schema cache/i.test(error.message)) {
    return (
      `The "${table}" table does not exist in this Supabase project. ` +
      `Apply mobile-app/supabase/migrations/0001_profiles.sql ` +
      `(supabase db push, or paste it into the Dashboard SQL editor).`
    );
  }
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return `Not allowed to read "${table}". Check its row level security policies.`;
  }
  return error.message;
}

function mapProfileRow(row: any, email: string): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    email: row.email ?? email,
    mobileNumber: row.mobile_number ?? "",
    avatarUrl: row.avatar_url ?? null,
    course: row.course ?? null,
    branch: row.branch ?? null,
    year: row.year ?? null,
    dateOfBirth: row.date_of_birth ?? null,
    gender: row.gender ?? null,
    location: row.location ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    githubUrl: row.github_url ?? null,
    portfolioUrl: row.portfolio_url ?? null,
    isPremium: row.is_premium ?? false,
    createdAt: row.created_at,
  };
}

export const authService = {
  async login({ identifier, password }: LoginPayload) {
    let email = identifier.trim();

    if (!isEmail(email)) {
      // This lookup runs before a session exists, so auth.uid() is null and a
      // direct select on `profiles` is (correctly) blocked by RLS — it used to
      // return no rows and report "No account found" even for valid accounts.
      // email_for_mobile() is a SECURITY DEFINER function that exposes only
      // this one mapping. See supabase/migrations/0001_profiles.sql.
      const { data: resolvedEmail, error: lookupError } = await supabase.rpc(
        "email_for_mobile",
        { p_mobile: email }
      );

      if (lookupError) {
        throw new Error(describeQueryError(lookupError, "profiles"));
      }
      if (!resolvedEmail) {
        throw new Error("No account found with this mobile number.");
      }
      email = resolvedEmail as string;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);

    const profile = await authService.getProfile(
      data.user.id,
      data.user.email ?? email,
      data.user.user_metadata
    );
    return { session: data.session, profile };
  },

  /**
   * Google OAuth via Supabase.
   *
   *  - Web: supabase-js performs a full-page redirect to Google and back; the
   *    client picks up the session from the URL (detectSessionInUrl is on for
   *    web in lib/supabase.ts). Nothing else to do here.
   *  - Native: open the consent page in the system browser and exchange the
   *    `?code=` on the campusedux:// redirect for a session (PKCE flow).
   *
   * On success a SIGNED_IN event fires and useAuthBootstrap loads the profile.
   */
  async signInWithGoogle() {
    // Loaded lazily so unit tests (and any non-auth code path) don't pull in
    // these native modules at import time.
    const Linking = await import("expo-linking");
    const WebBrowser = await import("expo-web-browser");
    WebBrowser.maybeCompleteAuthSession();

    // Web returns to the app origin (detectSessionInUrl finishes the flow);
    // native returns to the campusedux:// deep link that WebBrowser watches.
    const redirectTo =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.origin
        : Linking.createURL("auth/callback");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== "web",
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw new Error(error.message);

    if (Platform.OS === "web") return; // page is already navigating to Google

    if (!data?.url) throw new Error("Could not start Google sign-in.");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) return; // user cancelled

    const returned = new URL(result.url);
    const code = returned.searchParams.get("code");
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw new Error(exchangeError.message);
      return;
    }

    const fragment = result.url.includes("#") ? result.url.split("#")[1] : "";
    const hashParams = new URLSearchParams(fragment);
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      const { error: setError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (setError) throw new Error(setError.message);
      return;
    }

    throw new Error("Google sign-in did not return a session.");
  },

  async register(payload: RegisterPayload) {
    if (payload.password !== payload.confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
          mobile_number: payload.mobileNumber,
          referral_code: payload.referralCode?.trim().toUpperCase() || null,
        },
      },
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async sendOTP(identifier: string) {
    const { error } = isEmail(identifier)
      ? await supabase.auth.signInWithOtp({ email: identifier })
      : await supabase.auth.signInWithOtp({ phone: identifier });

    if (error) throw new Error(error.message);
  },

  async verifyOTP(identifier: string, token: string) {
    const { data, error } = isEmail(identifier)
      ? await supabase.auth.verifyOtp({ email: identifier, token, type: "email" })
      : await supabase.auth.verifyOtp({ phone: identifier, token, type: "sms" });

    if (error) throw new Error(error.message);
    return data;
  },

  async requestPasswordReset(identifier: string) {
    await authService.sendOTP(identifier);
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  async getProfile(
    userId: string,
    fallbackEmail: string,
    metadata?: Record<string, unknown>
  ): Promise<UserProfile> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to load profile. ${describeQueryError(error, "profiles")}`
      );
    }

    if (data) {
      return mapProfileRow(data, fallbackEmail);
    }

    // A valid Auth user can exist before its profile row is created.
    // Create the missing row from Auth metadata instead of blocking login.
    const fullName =
      typeof metadata?.full_name === "string" ? metadata.full_name : "";
    const mobileNumber =
      typeof metadata?.mobile_number === "string"
        ? metadata.mobile_number
        : "";

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: fallbackEmail,
        full_name: fullName,
        mobile_number: mobileNumber,
        is_premium: false,
      })
      .select("*")
      .single();

    if (created) {
      return mapProfileRow(created, fallbackEmail);
    }

    // 23505 = unique_violation: another concurrent caller (e.g. the auth-state
    // listener racing an explicit login) inserted the row first. Re-read it
    // instead of surfacing a spurious error.
    if (createError?.code === "23505") {
      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (existing) return mapProfileRow(existing, fallbackEmail);
    }

    throw new Error(
      `Unable to load profile. ${
        createError
          ? describeQueryError(createError, "profiles")
          : "The profile row was not created."
      }`
    );
  },

  async updateAcademicDetails(
    userId: string,
    fields: { course?: string; branch?: string | null; year?: string | null }
  ) {
    // A key that is present (even when null) is written; `null` clears the
    // column — used to reset an invalid branch after a course change (§37).
    // An absent key is left untouched.
    const patch: Record<string, string | null> = {};
    if (fields.course !== undefined) patch.course = fields.course;
    if (fields.branch !== undefined) patch.branch = fields.branch;
    if (fields.year !== undefined) patch.year = fields.year;
    if (Object.keys(patch).length === 0) return;

    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) throw new Error(error.message);
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session;
  },
};

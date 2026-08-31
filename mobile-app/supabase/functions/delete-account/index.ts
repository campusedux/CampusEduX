// POST delete-account
//
// Called by src/services/settings.service.ts -> deleteAccount()
//
// Request  body : {}   (the caller is identified by their JWT)
// Response body : { ok: true }
//
// The client can never be trusted to delete its own auth user, so this runs
// with the service-role key. It deletes / anonymises every row that belongs to
// the caller, clears their Storage folders (including one level of nesting),
// then removes the auth user itself.
//
// Every user table references auth.users / profiles with ON DELETE CASCADE, so
// deleting the auth user at the end already removes the rows; the explicit
// deletes below are belt-and-braces and keep the function correct even if an FK
// is ever relaxed. Storage objects have NO FK to the user, so the bucket sweep
// below is the ONLY thing that removes uploaded files.
//
// Idempotency: after a successful run the caller's JWT no longer resolves to a
// user, so a repeat request is rejected with 401 before doing anything.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";

// [table, column] pairs owned by a single user. Kept in sync with the
// migrations — anything with a `user_id` (or equivalent) that is the caller's.
const OWNED_TABLES: [string, string][] = [
  ["legal_consents", "user_id"],
  // edge_rate_limits is intentionally NOT here — it cascades from auth.users,
  // and leaving this request's own rate-limit row in place keeps the limiter
  // meaningful for the lifetime of the call.
  ["wallet_transactions", "user_id"],
  ["wallet_topup_orders", "user_id"],
  ["referral_earnings", "user_id"],
  ["premium_subscriptions", "user_id"],
  ["notifications", "user_id"],
  ["notification_preferences", "user_id"],
  ["user_preferences", "user_id"],
  ["user_favorite_questions", "user_id"],
  ["user_dsa_progress", "user_id"],
  ["test_attempts", "user_id"], // test_attempt_answers cascade from here
  ["resume_downloads", "user_id"],
  ["resumes_builder", "user_id"],
  ["resumes", "user_id"],
  ["applications", "user_id"], // application_stages cascade from here
  ["job_alerts", "user_id"],
  ["saved_jobs", "user_id"],
  ["downloads", "user_id"],
  ["reviews", "user_id"],
  ["wishlists", "user_id"],
  ["prep_note_bookmarks", "user_id"],
  ["custom_project_drafts", "user_id"],
  ["custom_project_payments", "user_id"],
  // custom_project_request_{features,files,history,messages} + deliveries all
  // cascade from custom_project_requests.
  ["custom_project_requests", "user_id"],
  ["purchases", "user_id"],
];

// Buckets that store files under a "<uid>/..." prefix (possibly one level deep).
const STORAGE_BUCKETS = [
  "avatars",
  "resumes",
  "custom-project-uploads",
  "custom-project-deliveries",
];

interface StorageEntry {
  name: string;
  id: string | null;
}

/**
 * Removes every object under `<uid>/` in `bucket`, descending one level into
 * sub-folders (Supabase `list()` is not recursive). Returns whether anything
 * failed so the caller can flag an orphan sweep.
 */
async function removeUserFolder(
  // deno-lint-ignore no-explicit-any
  db: any,
  bucket: string,
  uid: string,
): Promise<{ removed: number; failed: boolean }> {
  let removed = 0;
  let failed = false;
  try {
    const { data: top, error } = await db.storage
      .from(bucket)
      .list(uid, { limit: 1000 });
    if (error) return { removed, failed: true };

    const entries: StorageEntry[] = top ?? [];
    const paths: string[] = entries
      .filter((e) => e.id) // real files have a non-null id
      .map((e) => `${uid}/${e.name}`);

    const subfolders = entries.filter((e) => !e.id).map((e) => e.name);
    for (const sub of subfolders) {
      const { data: subEntries, error: subError } = await db.storage
        .from(bucket)
        .list(`${uid}/${sub}`, { limit: 1000 });
      if (subError) {
        failed = true;
        continue;
      }
      for (const f of (subEntries ?? []) as StorageEntry[]) {
        if (f.id) paths.push(`${uid}/${sub}/${f.name}`);
      }
    }

    if (paths.length > 0) {
      const { error: removeError } = await db.storage.from(bucket).remove(paths);
      if (removeError) failed = true;
      else removed = paths.length;
    }
  } catch {
    failed = true;
  }
  return { removed, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);

    const db = adminClient();
    const uid = user.id;

    // Spam guard: a handful of attempts per 5 min is plenty for a real user.
    try {
      await enforceRateLimit(db, uid, "delete-account", { limit: 3, windowSeconds: 300 });
    } catch (e) {
      if (e instanceof RateLimitError) {
        return json({ error: e.message, retryAfterSeconds: e.retryAfterSeconds }, 429);
      }
      throw e;
    }

    let rowIssues = 0;
    let storageIssues = 0;

    // 1. per-user rows (best effort; the auth-user delete below cascades anyway)
    for (const [table, column] of OWNED_TABLES) {
      const { error } = await db.from(table).delete().eq(column, uid);
      if (error) {
        rowIssues++;
        console.error(`delete-account: ${table} ->`, error.message);
      }
    }

    // 2. referrals: remove the ones this user made; anonymise the ones that
    //    brought this user in so the referrer keeps their (now unlinked) count.
    await db.from("referrals").delete().eq("referrer_id", uid);
    await db.from("referrals").update({ referred_user_id: null }).eq("referred_user_id", uid);

    // 3. blocked_users on both sides
    await db.from("blocked_users").delete().eq("user_id", uid);
    await db.from("blocked_users").delete().eq("blocked_user_id", uid);

    // 4. referral code + profile
    await db.from("referral_codes").delete().eq("user_id", uid);
    const { error: profileError } = await db.from("profiles").delete().eq("id", uid);
    if (profileError) {
      rowIssues++;
      console.error("delete-account: profiles ->", profileError.message);
    }

    // 5. Storage folders (the only path that removes uploaded files)
    for (const bucket of STORAGE_BUCKETS) {
      const { failed } = await removeUserFolder(db, bucket, uid);
      if (failed) {
        storageIssues++;
        console.error(`delete-account: storage sweep incomplete for bucket "${bucket}"`);
      }
    }

    // 6. the auth user itself — the authoritative, irreversible step. Its
    //    cascade also mops up any row the best-effort loop above could not.
    const { error: authError } = await db.auth.admin.deleteUser(uid);
    if (authError) {
      console.error("delete-account: auth.admin.deleteUser ->", authError.message);
      return json(
        { error: "We couldn't fully delete your account. Please try again or contact support." },
        500,
      );
    }

    if (rowIssues > 0 || storageIssues > 0) {
      // The account is gone, but leftovers may exist — surface for an ops sweep.
      console.error(
        `delete-account: ORPHAN SWEEP NEEDED for former user ${uid} ` +
          `(rowIssues=${rowIssues}, storageIssues=${storageIssues})`,
      );
    }

    return json({ ok: true });
  } catch (err) {
    console.error("delete-account:", err);
    return json(
      { error: "We couldn't complete your account deletion. Please try again or contact support." },
      500,
    );
  }
});

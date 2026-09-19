import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Auth ADMIN API helper (DB-04): bans / unbans a user so their
 * existing sessions stop refreshing. Uses `SUPABASE_SERVICE_ROLE_KEY`.
 *
 * !! SERVER-ONLY !!  The key bypasses RLS. It must NEVER be prefixed with
 * NEXT_PUBLIC_ and this module must never be imported from a client component
 * It is only imported by 'use server' action files.
 *
 * The key is OPTIONAL: when unset, `banAuthUser` reports `skipped` and callers
 * keep relying on the DB-level block (profiles.status = 'blocked').
 */
export const BAN_DURATION = '87600h'; // ~10 years

export type AuthBanResult =
  | { status: 'applied' }
  | { status: 'skipped'; warning: string }
  | { status: 'failed'; error: string };

export const SKIP_WARNING = 'SUPABASE_SERVICE_ROLE_KEY is not set: Auth-level ban skipped (DB-level block still enforced).';

type AdminClientFactory = (url: string, key: string) => Pick<SupabaseClient, 'auth'>;

const defaultFactory: AdminClientFactory = (url, key) =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

export async function setAuthBan(
  userId: string,
  banned: boolean,
  factory: AdminClientFactory = defaultFactory,
): Promise<AuthBanResult> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !key.trim() || !url) return { status: 'skipped', warning: SKIP_WARNING };
  try {
    const admin = factory(url, key);
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: banned ? BAN_DURATION : 'none' });
    if (error) return { status: 'failed', error: error.message };
    return { status: 'applied' };
  } catch (e) {
    return { status: 'failed', error: e instanceof Error ? e.message : 'Auth admin call failed.' };
  }
}

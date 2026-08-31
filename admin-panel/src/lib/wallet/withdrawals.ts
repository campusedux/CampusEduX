import { createClient } from '@/lib/supabase/server';

export const WITHDRAWAL_PAGE_SIZE = 20;

export async function listWithdrawalRequests(opts: { page: number; status?: string }) {
  const supabase = createClient();
  const start = (opts.page - 1) * WITHDRAWAL_PAGE_SIZE;
  let query = supabase
    .from('withdrawal_requests')
    .select('id, amount, method, account_details, status, decision_note, decided_at, created_at, user:profiles(full_name, email)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(start, start + WITHDRAWAL_PAGE_SIZE - 1);
  if (opts.status) query = query.eq('status', opts.status);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

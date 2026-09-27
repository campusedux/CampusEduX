import { createClient } from '@/lib/supabase/server';

export const WITHDRAWAL_PAGE_SIZE = 20;

const BASE_COLUMNS = 'id, amount, method, account_details, status, decision_note, decided_at, created_at, user:profiles(full_name, email)';
// paid_at / payout_reference arrive with migration 0144/115; fall back to the base columns until it is applied.
const PAYOUT_COLUMNS = `${BASE_COLUMNS}, paid_at, payout_reference`;

export async function listWithdrawalRequests(opts: { page: number; status?: string }) {
  const supabase = createClient();
  const start = (opts.page - 1) * WITHDRAWAL_PAGE_SIZE;
  const run = (columns: string) => {
    let query = supabase
      .from('withdrawal_requests')
      .select(columns, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, start + WITHDRAWAL_PAGE_SIZE - 1);
    if (opts.status) query = query.eq('status', opts.status);
    return query;
  };
  let { data, count, error } = await run(PAYOUT_COLUMNS);
  if (error) ({ data, count, error } = await run(BASE_COLUMNS));
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

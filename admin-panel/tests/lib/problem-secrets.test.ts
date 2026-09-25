import { describe, it, expect, vi, beforeEach } from 'vitest';

// DB-05: dsa_problems.test_cases / solution_code are column-revoked for clients;
// the admin panel must read them through admin_dsa_problem_secrets and never
// ask the table for those columns.
const selectSpy = vi.fn();
const rpc = vi.fn();
const builder: Record<string, unknown> = {};
for (const m of ['eq', 'is', 'in', 'order', 'range', 'ilike', 'not']) builder[m] = () => builder;
builder.maybeSingle = () => Promise.resolve({ data: { id: 'p1', title: 'Two Sum', topic_id: 't1' }, error: null });
const client = {
  from: () => ({ select: (cols: string) => { selectSpy(cols); return builder; } }),
  rpc,
};
vi.mock('@/lib/supabase/server', () => ({ createClient: () => client }));

import { getPracticeProblem } from '@/lib/learning/queries';

beforeEach(() => { selectSpy.mockClear(); rpc.mockReset(); });

describe('getPracticeProblem secrets merge', () => {
  it('never selects the revoked columns and merges the RPC result', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'p1', solution_code: { java: 'x' }, test_cases: [{ input: '1', expected: '2' }] }], error: null });
    const row = await getPracticeProblem('p1');
    expect(selectSpy.mock.calls[0][0]).not.toMatch(/test_cases|solution_code/);
    expect(rpc).toHaveBeenCalledWith('admin_dsa_problem_secrets', { p_ids: ['p1'] });
    expect(row?.test_cases).toEqual([{ input: '1', expected: '2' }]);
    expect(row?.solution_code).toEqual({ java: 'x' });
  });
  it('falls back to empty secrets when the RPC returns nothing', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const row = await getPracticeProblem('p1');
    expect(row?.test_cases).toEqual([]);
    expect(row?.solution_code).toEqual({});
  });
});

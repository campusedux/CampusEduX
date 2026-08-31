import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidatePath, requirePermission, logActivity } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requirePermission: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/auth', () => ({ requirePermission }));
vi.mock('@/lib/audit', () => ({ logActivity }));
// createAdminUser pulls in @supabase/supabase-js at module load — stub it.
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { signUp: vi.fn() } }) }));

import { supabase, resetSupabaseMock, setRpcResult, setTableResult, callsFor, rpcCall } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import { saveCourse, deleteCourse, saveBranch } from '@/app/(panel)/settings/actions';

beforeEach(() => {
  resetSupabaseMock();
  requirePermission.mockReset().mockResolvedValue({ id: 'a-1' });
  logActivity.mockReset().mockResolvedValue(undefined);
  revalidatePath.mockClear();
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe('saveCourse', () => {
  it('creates a course and writes an audit log', async () => {
    setTableResult('courses', { data: [], error: null }); // no duplicates + insert ok

    const res = await saveCourse(null, { ok: false }, form({ name: 'M.Tech', code: 'MTECH', sort_order: '2' }));

    expect(res).toEqual({ ok: true });
    expect(requirePermission).toHaveBeenCalledWith('settings', 'add');
    expect(callsFor('courses').some((c) => c.verb === 'insert')).toBe(true);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'academic.course.create', module: 'settings', resourceType: 'courses' }),
    );
  });

  it('rejects a case-insensitive duplicate name before inserting', async () => {
    setTableResult('courses', { data: [{ id: 'btech', name: 'B.Tech' }], error: null });

    const res = await saveCourse(null, { ok: false }, form({ name: '  b.tech ', code: 'X' }));

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/already exists/i);
    expect(callsFor('courses').some((c) => c.verb === 'insert')).toBe(false);
    expect(logActivity).not.toHaveBeenCalled();
  });
});

describe('saveBranch', () => {
  it('stores the course_id and is unique per course', async () => {
    // an identically named branch, but under a different course — allowed
    setTableResult('branches', { data: [{ id: 'mba-fin', name: 'Finance', course_id: 'mba' }], error: null });

    const res = await saveBranch(null, { ok: false }, form({ name: 'Finance', code: 'FIN', course_id: 'bba' }));

    expect(res).toEqual({ ok: true });
    const insert = callsFor('branches').find((c) => c.verb === 'insert');
    expect(insert?.args[0]).toMatchObject({ course_id: 'bba', name: 'Finance' });
  });
});

describe('deleteCourse', () => {
  it('blocks the delete when academic_usage reports references', async () => {
    setRpcResult('academic_usage', {
      data: [{ branches: 3, students: 12, projects: 0, jobs: 0, prep_notes: 0 }],
      error: null,
    });

    const res = await deleteCourse('btech');

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/3 branches, 12 students/);
    expect(rpcCall('academic_usage')?.args[0]).toEqual({ p_kind: 'course', p_id: 'btech' });
    expect(callsFor('courses').some((c) => c.verb === 'delete')).toBe(false);
    expect(logActivity).not.toHaveBeenCalled();
  });

  it('deletes and audits when nothing references it', async () => {
    setRpcResult('academic_usage', {
      data: [{ branches: 0, students: 0, projects: 0, jobs: 0, prep_notes: 0 }],
      error: null,
    });
    setTableResult('courses', { data: null, error: null });

    const res = await deleteCourse('mtech');

    expect(res).toEqual({ ok: true });
    expect(callsFor('courses').some((c) => c.verb === 'delete')).toBe(true);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'academic.course.delete', resourceType: 'courses', resourceId: 'mtech' }),
    );
  });
});

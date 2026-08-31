import { describe, it, expect, beforeEach, vi } from 'vitest';

import { supabase, resetSupabaseMock, setTableResult } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import { resolveTargetingFromForm } from '@/lib/academic-targeting';

beforeEach(() => resetSupabaseMock());

function form(fields: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) v.forEach((x) => fd.append(k, x));
    else fd.set(k, v);
  }
  return fd;
}

describe('resolveTargetingFromForm', () => {
  it('returns {} when the form carries no targeting fields', async () => {
    expect(await resolveTargetingFromForm(form({ title: 'x' }))).toEqual({});
  });

  it('global — clears course/branch, keeps an optional year', async () => {
    setTableResult('academic_years', { data: { label: 'Final Year' } });
    const out = await resolveTargetingFromForm(form({ target_type: 'global', target_year_id: 'final' }));
    expect(out).toMatchObject({
      target_type: 'global',
      target_course_id: null,
      target_course_name: null,
      target_branch_ids: [],
      target_branch_names: [],
      target_branch_id: null,
      target_year_id: 'final',
      target_year_label: 'Final Year',
    });
  });

  it('course — resolves the course name, no branches', async () => {
    setTableResult('courses', { data: { name: 'B.Tech' } });
    const out = await resolveTargetingFromForm(form({ target_type: 'course', target_course_id: 'btech' }));
    expect(out).toMatchObject({
      target_type: 'course',
      target_course_id: 'btech',
      target_course_name: 'B.Tech',
      target_branch_ids: [],
      target_branch_id: null,
    });
  });

  it('branch — resolves names, derives the course, keeps [0] for back-compat', async () => {
    setTableResult('branches', {
      data: [
        { id: 'btech-cse', name: 'Computer Science Engineering', course_id: 'btech' },
        { id: 'btech-it', name: 'Information Technology', course_id: 'btech' },
      ],
    });
    setTableResult('courses', { data: { name: 'B.Tech' } });

    const out = await resolveTargetingFromForm(
      form({ target_type: 'branch', target_branch_ids: ['btech-cse', 'btech-it'] }),
    );

    expect(out).toMatchObject({
      target_type: 'branch',
      target_course_id: 'btech',
      target_course_name: 'B.Tech',
      target_branch_ids: ['btech-cse', 'btech-it'],
      target_branch_names: ['Computer Science Engineering', 'Information Technology'],
      target_branch_id: 'btech-cse',
      target_branch_name: 'Computer Science Engineering',
    });
  });

  it('branch with nothing selected falls back to global', async () => {
    const out = await resolveTargetingFromForm(form({ target_type: 'branch', target_course_id: 'btech' }));
    expect(out).toMatchObject({ target_type: 'global', target_branch_ids: [], target_course_id: null });
  });

  it('branch — drops a branch that does not belong to the chosen course (spec §28)', async () => {
    setTableResult('branches', {
      data: [
        { id: 'btech-cse', name: 'Computer Science Engineering', course_id: 'btech' },
        { id: 'mba-fin', name: 'Finance', course_id: 'mba' },
      ],
    });
    setTableResult('courses', { data: { name: 'B.Tech' } });

    const out = await resolveTargetingFromForm(
      form({ target_type: 'branch', target_course_id: 'btech', target_branch_ids: ['btech-cse', 'mba-fin'] }),
    );

    expect(out).toMatchObject({
      target_type: 'branch',
      target_course_id: 'btech',
      target_branch_ids: ['btech-cse'],
      target_branch_names: ['Computer Science Engineering'],
      target_branch_id: 'btech-cse',
    });
  });

  it('branch — every selected branch is cross-course → falls back to global', async () => {
    setTableResult('branches', {
      data: [{ id: 'btech-cse', name: 'Computer Science Engineering', course_id: 'btech' }],
    });

    const out = await resolveTargetingFromForm(
      form({ target_type: 'branch', target_course_id: 'mba', target_branch_ids: ['btech-cse'] }),
    );

    expect(out).toMatchObject({ target_type: 'global', target_branch_ids: [], target_course_id: null });
  });
});

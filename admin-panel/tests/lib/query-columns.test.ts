import { describe, it, expect, vi, beforeEach } from 'vitest';

import { supabase, resetSupabaseMock, setTableResult, callsFor } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import { getProject, getProjectFiles } from '@/lib/projects/queries';
import { getJob } from '@/lib/jobs/queries';

beforeEach(() => resetSupabaseMock());

const selectedCols = (table: string) => {
  const call = callsFor(table).find((c) => c.verb === 'select');
  return String(call?.args[0] ?? '')
    .split(',')
    .map((c) => c.trim());
};

describe('detail getters select explicit columns (no select *)', () => {
  it('getProject includes the targeting fields the edit form reads outside ProjectDetail', async () => {
    await getProject('p-1');
    const cols = selectedCols('projects');
    expect(cols).not.toContain('*');
    for (const c of ['id', 'title', 'video_url', 'target_type', 'target_course_id', 'target_branch_ids', 'target_year_id']) {
      expect(cols).toContain(c);
    }
  });

  it('getJob includes every field the edit page spreads into JobForm', async () => {
    await getJob('j-1');
    const cols = selectedCols('jobs');
    expect(cols).not.toContain('*');
    for (const c of [
      'apply_url', 'application_deadline', 'requisition_id', 'category', 'qualification', 'work_mode',
      'experience_level', 'shift', 'benefits', 'summary', 'responsibilities', 'candidate_note',
      'target_type', 'target_course_id', 'target_branch_ids', 'target_year_id',
    ]) {
      expect(cols).toContain(c);
    }
  });
});

describe('getProjectFiles', () => {
  const rows = [
    { id: 'f1', label: 'Main', file_name: 'a.zip', size_mb: 1, storage_path: 'p/a.zip', sort_order: 0 },
    { id: 'f2', label: 'Docs', file_name: 'b.pdf', size_mb: 2, storage_path: 'p/b.pdf', sort_order: 1 },
  ];

  function mockSigning(result: { data: unknown; error: unknown }) {
    const createSignedUrls = vi.fn(() => Promise.resolve(result));
    const createSignedUrl = vi.fn();
    supabase.storage.from.mockImplementation(() => ({ createSignedUrls, createSignedUrl }) as never);
    return { createSignedUrls, createSignedUrl };
  }

  it('signs every file in ONE batched call and maps urls back by path', async () => {
    setTableResult('project_files', { data: rows });
    const { createSignedUrls, createSignedUrl } = mockSigning({
      data: [
        { path: 'p/b.pdf', signedUrl: 'https://s/b', error: null },
        { path: 'p/a.zip', signedUrl: 'https://s/a', error: null },
      ],
      error: null,
    });

    const out = await getProjectFiles('p-1', 'main');

    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls).toHaveBeenCalledWith(['p/a.zip', 'p/b.pdf'], 600);
    expect(createSignedUrl).not.toHaveBeenCalled();
    expect(out.map((r) => r.url)).toEqual(['https://s/a', 'https://s/b']);
  });

  it('leaves url null for a path that failed to sign, and for a failed batch', async () => {
    setTableResult('project_files', { data: rows });
    mockSigning({
      data: [
        { path: 'p/a.zip', signedUrl: 'https://s/a', error: null },
        { path: 'p/b.pdf', signedUrl: '', error: 'Object not found' },
      ],
      error: null,
    });
    expect((await getProjectFiles('p-1', 'main')).map((r) => r.url)).toEqual(['https://s/a', null]);

    mockSigning({ data: null, error: { message: 'storage down' } });
    expect((await getProjectFiles('p-1', 'main')).map((r) => r.url)).toEqual([null, null]);
  });

  it('skips the storage call entirely when there are no files', async () => {
    setTableResult('project_files', { data: [] });
    const { createSignedUrls } = mockSigning({ data: [], error: null });
    expect(await getProjectFiles('p-1', 'main')).toEqual([]);
    expect(createSignedUrls).not.toHaveBeenCalled();
  });
});

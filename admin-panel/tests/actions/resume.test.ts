import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redirect, revalidatePath, requirePermission, logActivity } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw { digest: 'NEXT_REDIRECT', url };
  }),
  revalidatePath: vi.fn(),
  requirePermission: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/auth', () => ({ requirePermission }));
vi.mock('@/lib/audit', () => ({ logActivity }));

import { supabase, resetSupabaseMock, setTableResult, callsFor } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import {
  setTemplatePreview,
  createTemplateCategory,
  updateTemplateCategory,
  deleteTemplateCategory,
  createAtsRule,
  updateAtsRule,
  toggleAtsRule,
  deleteAtsRule,
} from '@/app/(panel)/resume/actions';

beforeEach(() => {
  resetSupabaseMock();
  requirePermission.mockReset().mockResolvedValue({ id: 'a-1' });
  logActivity.mockReset().mockResolvedValue(undefined);
  redirect.mockClear();
  revalidatePath.mockClear();
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe('setTemplatePreview', () => {
  it('logs the preview update', async () => {
    setTableResult('resume_templates', { error: null });
    const res = await setTemplatePreview('modern', [{ url: 'https://x/y.png' } as never]);
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'resume.template.preview_updated', module: 'resume', resourceType: 'resume_templates', resourceId: 'modern' }),
    );
  });

  it('does not log when the update fails', async () => {
    setTableResult('resume_templates', { error: { message: 'boom' } });
    const res = await setTemplatePreview('modern', [{ url: 'https://x/y.png' } as never]);
    expect(res).toEqual({ ok: false, error: 'boom' });
    expect(logActivity).not.toHaveBeenCalled();
  });
});

describe('template categories', () => {
  it('createTemplateCategory logs with the slugified id', async () => {
    setTableResult('resume_template_categories', { error: null });
    const res = await createTemplateCategory({ ok: false }, form({ name: 'Fresher Picks' }));
    expect(res).toEqual({ ok: true });
    const insert = callsFor('resume_template_categories').find((c) => c.verb === 'insert');
    const insertedId = (insert?.args[0] as Record<string, unknown>).id;
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'resume.template_category.create', resourceType: 'resume_template_categories', resourceId: insertedId }),
    );
  });

  it('updateTemplateCategory logs the change', async () => {
    setTableResult('resume_template_categories', { error: null });
    const res = await updateTemplateCategory('fresher', { ok: false }, form({ name: 'Fresher' }));
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'resume.template_category.update', resourceId: 'fresher' }),
    );
  });

  it('deleteTemplateCategory logs the removal', async () => {
    setTableResult('resume_template_categories', { error: null });
    const res = await deleteTemplateCategory('fresher');
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'resume.template_category.delete', resourceId: 'fresher' }),
    );
  });
});

describe('ats rules', () => {
  it('createAtsRule logs with the generated id', async () => {
    setTableResult('ats_rules', { error: null });
    const res = await createAtsRule({ ok: false }, form({ rule: 'Use metrics', section: 'work_experience' }));
    expect(res).toEqual({ ok: true });
    const insert = callsFor('ats_rules').find((c) => c.verb === 'insert');
    const insertedId = (insert?.args[0] as Record<string, unknown>).id;
    expect(insertedId).toMatch(/^ats-/);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'resume.ats_rule.create', resourceType: 'ats_rules', resourceId: insertedId }),
    );
  });

  it('rejects a blank rule without logging', async () => {
    const res = await createAtsRule({ ok: false }, form({ rule: '  ' }));
    expect(res).toEqual({ ok: false, error: 'Rule text is required.' });
    expect(logActivity).not.toHaveBeenCalled();
  });

  it('updateAtsRule logs the change', async () => {
    setTableResult('ats_rules', { error: null });
    const res = await updateAtsRule('we-2', { ok: false }, form({ rule: 'Quantify impact', section: 'work_experience' }));
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'resume.ats_rule.update', resourceId: 'we-2' }));
  });

  it('toggleAtsRule logs the next state', async () => {
    setTableResult('ats_rules', { error: null });
    const res = await toggleAtsRule('we-2', false);
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'resume.ats_rule.toggle', resourceId: 'we-2', details: { next: false } }),
    );
  });

  it('deleteAtsRule logs the removal', async () => {
    setTableResult('ats_rules', { error: null });
    const res = await deleteAtsRule('we-2');
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ action: 'resume.ats_rule.delete', resourceId: 'we-2' }));
  });
});

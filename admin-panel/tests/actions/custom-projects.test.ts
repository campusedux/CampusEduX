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

import { supabase, resetSupabaseMock, setRpcResult, setTableResult, callsFor, rpcCall } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import {
  setRequestStatus,
  setFinalPrice,
  saveDelivery,
  saveAndDeliver,
  addDeliveryAssets,
  saveRequestAdminNotes,
  createFeature,
  updateFeature,
  duplicateFeature,
  bulkUpdateFeatures,
  createFeatureCategory,
  deleteFeatureCategory,
  updatePricingRow,
} from '@/app/(panel)/custom-projects/actions';

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

describe('setFinalPrice', () => {
  it('routes the change through admin_set_custom_project_final_price and logs it', async () => {
    setRpcResult('admin_set_custom_project_final_price', { data: { changed: true, final_price: 9000 }, error: null });

    const res = await setFinalPrice('req-1', { ok: false }, form({ final_price: '9000', note: 'agreed after review' }));

    expect(requirePermission).toHaveBeenCalledWith('custom_projects', 'edit');
    expect(rpcCall('admin_set_custom_project_final_price')?.args[0]).toEqual({
      p_request_id: 'req-1',
      p_final_price: 9000,
      p_note: 'agreed after review',
    });
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'custom_project.final_price.set', module: 'custom_projects' }),
    );
  });

  it('rejects a blank or non-numeric amount without calling the RPC', async () => {
    const blank = await setFinalPrice('req-1', { ok: false }, form({ final_price: '' }));
    const bogus = await setFinalPrice('req-1', { ok: false }, form({ final_price: 'abc' }));

    expect(blank).toEqual({ ok: false, error: 'Enter a valid amount.' });
    expect(bogus).toEqual({ ok: false, error: 'Enter a valid amount.' });
    expect(rpcCall('admin_set_custom_project_final_price')).toBeUndefined();
  });

  it('surfaces the RPC error (e.g. below the amount already paid, or locked)', async () => {
    setRpcResult('admin_set_custom_project_final_price', {
      data: null,
      error: { message: 'Final price cannot be below the amount already paid (3000).' },
    });

    const res = await setFinalPrice('req-1', { ok: false }, form({ final_price: '2000' }));

    expect(res).toEqual({ ok: false, error: 'Final price cannot be below the amount already paid (3000).' });
    expect(logActivity).not.toHaveBeenCalled();
  });

  it('is blocked when the caller lacks custom_projects:edit', async () => {
    requirePermission.mockRejectedValueOnce(new Error("You don't have permission to edit in custom_projects."));
    await expect(setFinalPrice('req-1', { ok: false }, form({ final_price: '9000' }))).rejects.toThrow(
      "You don't have permission to edit in custom_projects.",
    );
    expect(rpcCall('admin_set_custom_project_final_price')).toBeUndefined();
  });
});

describe('saveAndDeliver', () => {
  it('saves the delivery details and calls custom_project_set_status(\'delivered\') in one go', async () => {
    setTableResult('custom_project_deliveries', { data: null, error: null });
    setRpcResult('custom_project_set_status', { data: null, error: null });

    const res = await saveAndDeliver('req-1', { ok: false }, form({ demo_url: 'https://example.com/demo', notes: 'all done' }));

    expect(requirePermission).toHaveBeenCalledWith('custom_projects', 'edit');
    expect(callsFor('custom_project_deliveries').some((c) => c.verb === 'upsert')).toBe(true);
    expect(rpcCall('custom_project_set_status')?.args[0]).toEqual({
      p_request_id: 'req-1',
      p_new_status: 'delivered',
      p_note: null,
    });
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'custom_project.delivery.save_and_deliver', module: 'custom_projects' }),
    );
  });

  it('rejects an unsafe demo_url before ever calling the RPC (same guard as saveDelivery)', async () => {
    const res = await saveAndDeliver('req-1', { ok: false }, form({ demo_url: 'javascript:alert(1)' }));
    expect(res.ok).toBe(false);
    expect(rpcCall('custom_project_set_status')).toBeUndefined();
  });

  it("surfaces the RPC's 'no deliverable' rejection (the real enforcement point, migration 0125/097)", async () => {
    setTableResult('custom_project_deliveries', { data: null, error: null });
    setRpcResult('custom_project_set_status', {
      data: null,
      error: { message: 'Add a demo URL or at least one file before marking this request Delivered.' },
    });

    const res = await saveAndDeliver('req-1', { ok: false }, form({}));

    expect(res).toEqual({ ok: false, error: 'Add a demo URL or at least one file before marking this request Delivered.' });
    expect(logActivity).not.toHaveBeenCalled();
  });

  it('is blocked when the caller lacks custom_projects:edit', async () => {
    requirePermission.mockRejectedValueOnce(new Error("You don't have permission to edit in custom_projects."));
    await expect(saveAndDeliver('req-1', { ok: false }, form({ demo_url: '' }))).rejects.toThrow(
      "You don't have permission to edit in custom_projects.",
    );
    expect(rpcCall('custom_project_set_status')).toBeUndefined();
  });
});

describe('addDeliveryAssets (Bug 4 — ZIP/PDF/PPT slot validation)', () => {
  const zipFile = { path: 'u1/req-1/1-abc-source.zip', url: 'https://x/1', name: 'source.zip', size: 10 * 1024 * 1024 };

  it('accepts a correctly-sized, correctly-named file for its slot', async () => {
    setTableResult('custom_project_deliveries', { data: { id: 'd-1' }, error: null });
    setTableResult('custom_project_delivery_assets', { data: [], error: null });

    const res = await addDeliveryAssets('req-1', 'source_code', 'Source', [zipFile]);

    expect(res).toEqual({ ok: true });
    expect(callsFor('custom_project_delivery_assets').some((c) => c.verb === 'insert')).toBe(true);
  });

  it('rejects the wrong extension for a dedicated slot and removes the already-uploaded file', async () => {
    const wrongExt = { ...zipFile, name: 'source.rar' };

    const res = await addDeliveryAssets('req-1', 'source_code', 'Source', [wrongExt]);

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not a valid Source code \(ZIP\) upload/);
    expect(supabase.storage.from).toHaveBeenCalledWith('custom-project-deliveries');
    // no DB row written for the rejected file
    expect(callsFor('custom_project_delivery_assets').some((c) => c.verb === 'insert')).toBe(false);
  });

  it('rejects an oversized file for a dedicated slot (server-side, independent of the client pre-check)', async () => {
    const tooBig = { ...zipFile, name: 'source.zip', size: 200 * 1024 * 1024 };

    const res = await addDeliveryAssets('req-1', 'source_code', 'Source', [tooBig]);

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/up to 100 MB/);
  });

  it('rejects an oversized PDF against its own tighter 25MB limit', async () => {
    const bigPdf = { path: 'u1/req-1/1-abc-doc.pdf', url: 'https://x/1', name: 'doc.pdf', size: 30 * 1024 * 1024 };

    const res = await addDeliveryAssets('req-1', 'pdf', 'PDF', [bigPdf]);

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/up to 25 MB/);
  });

  it('kinds without a dedicated slot (screenshot/apk/other/…) are not subject to slot validation', async () => {
    setTableResult('custom_project_deliveries', { data: { id: 'd-1' }, error: null });
    setTableResult('custom_project_delivery_assets', { data: [], error: null });
    const anyFile = { path: 'u1/req-1/1-abc-home.png', url: 'https://x/1', name: 'home.png', size: 500 * 1024 * 1024 };

    const res = await addDeliveryAssets('req-1', 'screenshot', 'Home', [anyFile]);

    expect(res).toEqual({ ok: true });
  });
});

describe('setRequestStatus', () => {
  it('routes the change through custom_project_set_status and logs it', async () => {
    setRpcResult('custom_project_set_status', { error: null });

    const res = await setRequestStatus('req-1', 'in_development', 'kickoff');

    expect(requirePermission).toHaveBeenCalledWith('custom_projects', 'edit');
    expect(rpcCall('custom_project_set_status')?.args[0]).toEqual({
      p_request_id: 'req-1',
      p_new_status: 'in_development',
      p_note: 'kickoff',
    });
    expect(res).toEqual({ ok: true });
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'custom_project.status.in_development', module: 'custom_projects' }),
    );
  });

  it('passes a null note when none is given and surfaces an RPC error', async () => {
    setRpcResult('custom_project_set_status', { error: { message: 'caller is not an active admin' } });

    const res = await setRequestStatus('req-1', 'delivered', '');

    expect(rpcCall('custom_project_set_status')?.args[0]).toMatchObject({ p_note: null });
    expect(res).toEqual({ ok: false, error: 'caller is not an active admin' });
    expect(logActivity).not.toHaveBeenCalled();
  });

  it('is blocked when the caller lacks custom_projects:edit', async () => {
    requirePermission.mockRejectedValueOnce(new Error("You don't have permission to edit in custom_projects."));
    await expect(setRequestStatus('req-1', 'testing', '')).rejects.toThrow(/permission to edit in custom_projects/);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe('saveRequestAdminNotes', () => {
  it('writes null when the note is cleared', async () => {
    setTableResult('custom_project_requests', { error: null });

    const res = await saveRequestAdminNotes('req-1', { ok: false }, form({ admin_notes: '' }));

    const update = callsFor('custom_project_requests').find((c) => c.verb === 'update');
    expect((update?.args[0] as Record<string, unknown>).admin_notes).toBeNull();
    expect(res).toEqual({ ok: true });
  });
});

describe('createFeature', () => {
  it('rejects a blank name before writing', async () => {
    const res = await createFeature({ ok: false }, form({ name: '   ' }));
    expect(res).toEqual({ ok: false, error: 'Name is required.' });
    expect(callsFor('custom_project_features')).toHaveLength(0);
  });

  it('inserts with only the valid type/level values then redirects', async () => {
    setTableResult('custom_project_features', { error: null });
    const fd = form({ name: 'AI chatbot', category: 'AI', price: '4000', sort_order: '10' });
    fd.append('project_types', 'personal');
    fd.append('project_types', 'business');
    fd.append('project_types', 'bogus'); // dropped
    fd.append('project_levels', 'advanced');

    await expect(createFeature({ ok: false }, fd)).rejects.toMatchObject({ url: '/custom-projects/features?saved=1' });

    const insert = callsFor('custom_project_features').find((c) => c.verb === 'insert');
    const row = insert?.args[0] as Record<string, unknown>;
    expect(row.project_types).toEqual(['personal', 'business']);
    expect(row.project_levels).toEqual(['advanced']);
    expect(row.price).toBe(4000);
    expect(requirePermission).toHaveBeenCalledWith('custom_projects', 'add');
  });
});

describe('createFeature — advanced validation (spec §5)', () => {
  it('rejects a missing category', async () => {
    const res = await createFeature({ ok: false }, form({ name: 'Thing' }));
    expect(res).toEqual({ ok: false, error: 'Category is required.' });
    expect(callsFor('custom_project_features')).toHaveLength(0);
  });

  it('rejects when no project type is selected', async () => {
    const res = await createFeature({ ok: false }, form({ name: 'Thing', category: 'AI' }));
    expect(res).toEqual({ ok: false, error: 'Pick at least one project type.' });
  });

  it('rejects a negative price', async () => {
    const fd = form({ name: 'Thing', category: 'AI', price: '-10' });
    fd.append('project_types', 'business');
    const res = await createFeature({ ok: false }, fd);
    expect(res).toEqual({ ok: false, error: 'Price cannot be negative.' });
  });

  it('slugifies a typed feature key and blocks a duplicate key', async () => {
    setTableResult('custom_project_features', { data: { id: 'ai chatbot' }, error: null });
    const fd = form({ name: 'AI chatbot', key: 'AI Chatbot', category: 'AI', price: '4000' });
    fd.append('project_types', 'business');
    fd.append('project_levels', 'advanced');
    const res = await createFeature({ ok: false }, fd);
    expect(res).toEqual({ ok: false, error: 'Feature key "ai-chatbot" is already taken — choose another.' });
    expect(callsFor('custom_project_features').some((c) => c.verb === 'insert')).toBe(false);
  });

  it('carries icon / dependencies / level through on insert', async () => {
    setTableResult('custom_project_features', { data: null, error: null });
    const fd = form({ name: 'Advanced Analytics', category: 'Analytics', price: '2500', level: 'advanced', icon: 'bar-chart' });
    fd.append('project_types', 'personal');
    fd.append('project_types', 'business');
    fd.append('dependencies', 'analytics-dashboard');
    fd.append('dependencies', 'analytics-dashboard'); // de-duped
    await expect(createFeature({ ok: false }, fd)).rejects.toMatchObject({ url: '/custom-projects/features?saved=1' });
    const row = callsFor('custom_project_features').find((c) => c.verb === 'insert')?.args[0] as Record<string, unknown>;
    expect(row.level).toBe('advanced');
    expect(row.icon).toBe('bar-chart');
    expect(row.dependencies).toEqual(['analytics-dashboard']);
    expect(row.project_types).toEqual(['personal', 'business']);
  });
});

describe('createFeature — included_in_levels', () => {
  const base = () => {
    const fd = form({ name: 'Login', category: 'Authentication', price: '800' });
    fd.append('project_types', 'academic');
    fd.append('project_levels', 'standard');
    fd.append('project_levels', 'advanced');
    return fd;
  };

  it('stores only valid, offered included keys', async () => {
    setTableResult('custom_project_features', { data: null, error: null });
    const fd = base();
    fd.append('included_in_levels', 'academic:standard');
    fd.append('included_in_levels', 'academic:advanced');
    fd.append('included_in_levels', 'bogus:tier'); // dropped
    await expect(createFeature({ ok: false }, fd)).rejects.toMatchObject({ url: '/custom-projects/features?saved=1' });
    const row = callsFor('custom_project_features').find((c) => c.verb === 'insert')?.args[0] as Record<string, unknown>;
    expect(row.included_in_levels).toEqual(['academic:standard', 'academic:advanced']);
  });

  it('rejects Advanced including less than Standard', async () => {
    const fd = base();
    fd.append('included_in_levels', 'academic:standard');
    const res = await createFeature({ ok: false }, fd);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Standard must also be included in academic Advanced/);
    expect(callsFor('custom_project_features').some((c) => c.verb === 'insert')).toBe(false);
  });

  it('rejects an included key for a type the feature is not offered to', async () => {
    const fd = base();
    fd.append('included_in_levels', 'business:advanced');
    const res = await createFeature({ ok: false }, fd);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not offered/);
  });
});

describe('updateFeature', () => {
  it('never rewrites the key and redirects on success', async () => {
    setTableResult('custom_project_features', { data: null, error: null });
    const fd = form({ name: 'Renamed', category: 'AI', price: '100', level: 'standard' });
    fd.append('project_types', 'academic');
    await expect(updateFeature('ai-chatbot-1', { ok: false }, fd)).rejects.toMatchObject({
      url: '/custom-projects/features?saved=1',
    });
    const update = callsFor('custom_project_features').find((c) => c.verb === 'update');
    expect(update?.args[0]).not.toHaveProperty('id');
    const eq = callsFor('custom_project_features').find((c) => c.verb === 'eq');
    expect(eq?.args).toEqual(['id', 'ai-chatbot-1']);
  });
});

describe('duplicateFeature (spec §8)', () => {
  it('clones the source as an inactive "(copy)"', async () => {
    setTableResult('custom_project_features', {
      data: { id: 'src', name: 'Payments', description: 'x', category: 'Payments', project_types: ['business'], project_levels: ['advanced'], level: 'premium', price: 3000, sort_order: 7, dependencies: ['pay-history'] },
      error: null,
    });
    const res = await duplicateFeature('src');
    expect(res).toEqual({ ok: true });
    expect(requirePermission).toHaveBeenCalledWith('custom_projects', 'add');
    const row = callsFor('custom_project_features').find((c) => c.verb === 'insert')?.args[0] as Record<string, unknown>;
    expect(row.name).toBe('Payments (copy)');
    expect(row.is_active).toBe(false);
    expect(row.level).toBe('premium');
    expect(row.dependencies).toEqual(['pay-history']);
    expect(String(row.id).startsWith('payments-copy-')).toBe(true);
  });
});

describe('bulkUpdateFeatures (spec §9)', () => {
  it('rejects an empty selection', async () => {
    const res = await bulkUpdateFeatures({ action: 'activate', ids: [] });
    expect(res).toEqual({ ok: false, error: 'No features selected.' });
  });

  it('activate patches is_active on every id with an edit permission', async () => {
    setTableResult('custom_project_features', { data: null, error: null });
    const res = await bulkUpdateFeatures({ action: 'activate', ids: ['a', 'b'] });
    expect(res).toEqual({ ok: true });
    expect(requirePermission).toHaveBeenCalledWith('custom_projects', 'edit');
    const update = callsFor('custom_project_features').find((c) => c.verb === 'update');
    expect(update?.args[0]).toEqual({ is_active: true });
    const inCall = callsFor('custom_project_features').find((c) => c.verb === 'in');
    expect(inCall?.args).toEqual(['id', ['a', 'b']]);
  });

  it('set_category needs a category', async () => {
    const res = await bulkUpdateFeatures({ action: 'set_category', ids: ['a'] });
    expect(res).toEqual({ ok: false, error: 'Pick a category first.' });
  });

  it('delete requires the delete permission and prunes dangling deps', async () => {
    setTableResult('custom_project_features', { data: [], error: null });
    const res = await bulkUpdateFeatures({ action: 'delete', ids: ['a', 'b'] });
    expect(res).toEqual({ ok: true });
    expect(requirePermission).toHaveBeenCalledWith('custom_projects', 'delete');
    expect(callsFor('custom_project_features').some((c) => c.verb === 'delete')).toBe(true);
    expect(callsFor('custom_project_features').some((c) => c.verb === 'overlaps')).toBe(true);
  });
});

describe('feature categories (spec §15)', () => {
  it('rejects a blank category name', async () => {
    const res = await createFeatureCategory({ ok: false }, form({ name: '  ' }));
    expect(res).toEqual({ ok: false, error: 'Name is required.' });
  });

  it('slugifies the id on create', async () => {
    setTableResult('custom_project_feature_categories', { error: null });
    const res = await createFeatureCategory({ ok: false }, form({ name: 'Booking Engine', sort_order: '5' }));
    expect(res).toEqual({ ok: true });
    const row = callsFor('custom_project_feature_categories').find((c) => c.verb === 'insert')?.args[0] as Record<string, unknown>;
    expect(row.id).toBe('booking-engine');
    expect(row.name).toBe('Booking Engine');
    expect(row.is_active).toBe(true);
  });

  it('blocks deleting a category still in use', async () => {
    setTableResult('custom_project_feature_categories', { data: { name: 'AI' }, error: null });
    setTableResult('custom_project_features', { count: 4, error: null });
    const res = await deleteFeatureCategory('ai');
    expect(res).toEqual({ ok: false, error: '4 feature(s) still use this category.' });
    expect(callsFor('custom_project_feature_categories').some((c) => c.verb === 'delete')).toBe(false);
  });
});

describe('updatePricingRow', () => {
  it('updates the matching (type, level) row', async () => {
    setTableResult('custom_project_pricing', { error: null });

    const res = await updatePricingRow(
      'personal',
      'advanced',
      { ok: false },
      form({ base_price: '21999', token_amount: '3000', pricing_version: '2' }),
    );

    const eqCalls = callsFor('custom_project_pricing').filter((c) => c.verb === 'eq');
    expect(eqCalls.map((c) => c.args)).toEqual(
      expect.arrayContaining([
        ['project_type', 'personal'],
        ['project_level', 'advanced'],
      ]),
    );
    const update = callsFor('custom_project_pricing').find((c) => c.verb === 'update');
    expect((update?.args[0] as Record<string, unknown>).base_price).toBe(21999);
    expect(res).toEqual({ ok: true });
  });
});

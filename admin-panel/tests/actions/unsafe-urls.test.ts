import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidatePath, requirePermission, logActivity, redirect } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requirePermission: vi.fn(),
  logActivity: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/auth', () => ({ requirePermission }));
vi.mock('@/lib/audit', () => ({ logActivity }));
vi.mock('@/lib/academic-targeting', () => ({ resolveTargetingFromForm: async () => ({}) }));

import { supabase, resetSupabaseMock, setUser, callsFor } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import { createBanner, updateBanner } from '@/app/(panel)/cms/actions';
import { createJob, createCompany } from '@/app/(panel)/jobs/actions';
import { setProjectVideoUrl, createProject } from '@/app/(panel)/projects/actions';
import { saveDelivery } from '@/app/(panel)/custom-projects/actions';
import { createContent } from '@/app/(panel)/learning/actions';
import { createPost } from '@/app/(panel)/blog/actions';
import { saveGeneralSettings } from '@/app/(panel)/settings/actions';

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  return fd;
};
const BAD = 'javascript:alert(1)';

beforeEach(() => {
  resetSupabaseMock();
  requirePermission.mockReset().mockResolvedValue({ id: 'a' });
  logActivity.mockReset();
  redirect.mockReset();
  setUser({ id: 'a' });
});

describe('ADM-03 server-side URL validation', () => {
  it('banners reject an unsafe target_url / image_url and write nothing', async () => {
    const r1 = await createBanner('home', { ok: false }, form({ title: 'T', target_url: BAD }));
    expect(r1.ok).toBe(false);
    expect(r1.error).toMatch(/Target URL/);
    const r2 = await updateBanner('1', 'home', { ok: false }, form({ title: 'T', image_url: 'data:image/svg+xml,<svg/>' }));
    expect(r2.error).toMatch(/Banner image URL/);
    expect(supabase.calls.filter((c) => c.table === 'banners')).toHaveLength(0);
  });

  it('banners still accept safe absolute and internal URLs', async () => {
    const r = await createBanner('home', { ok: false }, form({ title: 'T', target_url: '/projects', image_url: 'https://x.supabase.co/a.png' }));
    expect(r.ok).toBe(true);
    expect(callsFor('banners').find((c) => c.verb === 'insert')?.args[0]).toMatchObject({ target_url: '/projects' });
  });

  it('jobs apply_url and company website', async () => {
    const j = await createJob({ ok: false }, form({ title: 'J', apply_url: BAD, work_mode: 'Remote', experience_level: 'Fresher' }));
    expect(j.error).toMatch(/Apply URL/);
    const c = await createCompany({ ok: false }, form({ name: 'Acme', website: '//evil.com' }));
    expect(c.error).toMatch(/Company website/);
    expect(supabase.calls.filter((x) => x.table === 'jobs' || x.table === 'companies')).toHaveLength(0);
  });

  it('projects video/demo/github urls', async () => {
    expect((await setProjectVideoUrl('p1', { ok: false }, form({ video_url: 'vbscript:x' }))).error).toMatch(/Video URL/);
    expect((await createProject({ ok: false }, form({ title: 'P', live_demo_url: BAD }))).error).toMatch(/Live demo URL/);
    expect((await createProject({ ok: false }, form({ title: 'P', github_url: 'ftp://x' }))).error).toMatch(/GitHub URL/);
    expect(callsFor('projects')).toHaveLength(0);
  });

  it('custom-project delivery demo_url', async () => {
    const r = await saveDelivery('r1', { ok: false }, form({ demo_url: BAD }));
    expect(r.error).toMatch(/Demo URL/);
    expect(callsFor('custom_project_deliveries')).toHaveLength(0);
  });

  it('learning content file/video/external urls', async () => {
    const r = await createContent('t1', '/learning', { ok: false }, form({ title: 'x', video_url: BAD }));
    expect(r.error).toMatch(/Video URL/);
    expect(callsFor('learning_contents')).toHaveLength(0);
  });

  it('blog featured image + canonical url', async () => {
    const r = await createPost({ ok: false }, form({ title: 'T', featured_image: BAD }));
    expect(r.error).toMatch(/Featured image URL/);
    expect((await createPost({ ok: false }, form({ title: 'T', canonical_url: 'data:x' }))).error).toMatch(/Canonical URL/);
    expect(callsFor('blog_posts')).toHaveLength(0);
  });

  it('site settings social links', async () => {
    const r = await saveGeneralSettings({ ok: false }, form({ social_twitter: BAD }));
    expect(r.error).toMatch(/Twitter link/);
    expect(callsFor('site_settings')).toHaveLength(0);
  });
});

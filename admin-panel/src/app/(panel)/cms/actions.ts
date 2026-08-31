'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import type { UploadedFile } from '@/components/ui/UploadDropzone';

type Result = { ok: boolean; error?: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => Number(s(fd, k) || 0);
const arr = (fd: FormData, k: string) => fd.getAll(k).map(String).filter(Boolean);

// --- banners ------------------------------------------------------
export async function createBanner(placement: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('cms', 'add');
  const supabase = createClient();
  const title = s(fd, 'title');
  if (!title) return { ok: false, error: 'Title is required.' };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('banners').insert({
    placement,
    title,
    subtitle: s(fd, 'subtitle'),
    image_url: s(fd, 'image_url') || null,
    target_url: s(fd, 'target_url') || null,
    target_audience: s(fd, 'target_audience') || 'all',
    display_on: placement === 'popup' ? arr(fd, 'display_on') : [],
    status: s(fd, 'status') || 'active',
    priority: n(fd, 'priority'),
    starts_at: s(fd, 'starts_at') || null,
    ends_at: s(fd, 'ends_at') || null,
    created_by: user?.id ?? null,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'banner.create', module: 'cms', resourceType: 'banners', resourceId: placement });
  revalidatePath(`/cms/banners/${placement}`);
  return { ok: true };
}

export async function updateBanner(id: string, placement: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('cms', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('banners')
    .update({
      title: s(fd, 'title'),
      subtitle: s(fd, 'subtitle'),
      image_url: s(fd, 'image_url') || null,
      target_url: s(fd, 'target_url') || null,
      target_audience: s(fd, 'target_audience') || 'all',
      display_on: placement === 'popup' ? arr(fd, 'display_on') : [],
      status: s(fd, 'status') || 'active',
      priority: n(fd, 'priority'),
      starts_at: s(fd, 'starts_at') || null,
      ends_at: s(fd, 'ends_at') || null,
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'banner.update', module: 'cms', resourceType: 'banners', resourceId: id });
  revalidatePath(`/cms/banners/${placement}`);
  return { ok: true };
}

export async function deleteBanner(id: string, placement: string): Promise<Result> {
  await requirePermission('cms', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'banner.delete', module: 'cms', resourceType: 'banners', resourceId: id });
  revalidatePath(`/cms/banners/${placement}`);
  return { ok: true };
}

export async function setBannerImage(id: string, placement: string, files: UploadedFile[]): Promise<Result> {
  await requirePermission('cms', 'edit');
  if (!files.length) return { ok: false, error: 'No file uploaded.' };
  const supabase = createClient();
  const { error } = await supabase.from('banners').update({ image_url: files[0].url }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/cms/banners/${placement}`);
  return { ok: true };
}

// --- announcements ---------------------------------------------
export async function createAnnouncement(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('cms', 'add');
  const supabase = createClient();
  const title = s(fd, 'title');
  if (!title) return { ok: false, error: 'Title is required.' };
  const { error } = await supabase.from('announcements').insert({
    title,
    body: s(fd, 'body'),
    target_audience: s(fd, 'target_audience') || 'all',
    status: s(fd, 'status') || 'active',
    starts_at: s(fd, 'starts_at') || null,
    ends_at: s(fd, 'ends_at') || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/cms/announcements');
  return { ok: true };
}
export async function updateAnnouncement(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('cms', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('announcements')
    .update({
      title: s(fd, 'title'),
      body: s(fd, 'body'),
      target_audience: s(fd, 'target_audience') || 'all',
      status: s(fd, 'status') || 'active',
      starts_at: s(fd, 'starts_at') || null,
      ends_at: s(fd, 'ends_at') || null,
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/cms/announcements');
  return { ok: true };
}
export async function deleteAnnouncement(id: string): Promise<Result> {
  await requirePermission('cms', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/cms/announcements');
  return { ok: true };
}

// --- faqs ----------------------------------------------------
export async function createFaq(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('cms', 'add');
  const supabase = createClient();
  const question = s(fd, 'question');
  if (!question) return { ok: false, error: 'Question is required.' };
  const { error } = await supabase.from('faqs').insert({
    question,
    answer: s(fd, 'answer'),
    category: s(fd, 'category') || 'General',
    sort_order: n(fd, 'sort_order'),
    status: s(fd, 'status') || 'active',
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/cms/faqs');
  return { ok: true };
}
export async function updateFaq(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('cms', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('faqs')
    .update({
      question: s(fd, 'question'),
      answer: s(fd, 'answer'),
      category: s(fd, 'category') || 'General',
      sort_order: n(fd, 'sort_order'),
      status: s(fd, 'status') || 'active',
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/cms/faqs');
  return { ok: true };
}
export async function deleteFaq(id: string): Promise<Result> {
  await requirePermission('cms', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/cms/faqs');
  return { ok: true };
}

// --- cms pages ---------------------------------------------
export async function saveCmsPage(key: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('cms', 'edit');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('cms_pages')
    .upsert({ key, title: s(fd, 'title'), content: s(fd, 'content'), updated_by: user?.id ?? null });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'cms_page.save', module: 'cms', resourceType: 'cms_pages', resourceId: key });
  revalidatePath('/cms/pages');
  return { ok: true };
}

// --- contact submissions (website /contact form) ----------------
export async function setContactStatus(id: string, status: 'new' | 'read' | 'archived'): Promise<Result> {
  await requirePermission('cms', 'edit');
  if (!['new', 'read', 'archived'].includes(status)) return { ok: false, error: 'Invalid status.' };
  const supabase = createClient();
  const { error } = await supabase.from('contact_submissions').update({ status }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'contact.status', module: 'cms', resourceType: 'contact_submissions', resourceId: id, details: { status } });
  revalidatePath('/cms/contact');
  return { ok: true };
}

// --- push notifications ----------------------------------
export async function sendPushNotification(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('cms', 'add');
  const supabase = createClient();
  const title = s(fd, 'title');
  const body = s(fd, 'body');
  const category = s(fd, 'category') || 'updates';
  const audience = s(fd, 'target_audience') || 'all';
  const imageUrl = s(fd, 'image_url') || null;
  if (!title) return { ok: false, error: 'Title is required.' };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from('admin_users').select('email').eq('id', user?.id ?? '').maybeSingle();

  // Only pass p_image_url when there is one, so the call still resolves on
  // installs that haven't applied migration 012 yet (text-only path unchanged).
  const rpcArgs = imageUrl
    ? { p_title: title, p_body: body, p_category: category, p_audience: audience, p_image_url: imageUrl }
    : { p_title: title, p_body: body, p_category: category, p_audience: audience };
  const { data: count, error } = await supabase.rpc('send_bulk_notification', rpcArgs);

  const historyBase = {
    title,
    body,
    category,
    target_audience: audience,
    image_url: imageUrl,
    sent_by: user?.id ?? null,
    sent_by_email: me?.email ?? '',
  };

  if (error) {
    // Record the failed attempt so it's visible in the sent history.
    await supabase
      .from('push_notifications')
      .insert({ ...historyBase, recipient_count: 0, status: 'failed', error_message: error.message });
    await logActivity({ action: 'push.send.failed', module: 'cms', resourceType: 'push_notifications', details: { audience, error: error.message } });
    revalidatePath('/cms/notifications');
    return { ok: false, error: error.message };
  }

  await supabase
    .from('push_notifications')
    .insert({ ...historyBase, recipient_count: Number(count) || 0, status: 'sent' });
  await logActivity({
    action: 'push.send',
    module: 'cms',
    resourceType: 'push_notifications',
    details: { audience, count, withImage: Boolean(imageUrl) },
  });
  revalidatePath('/cms/notifications');
  return { ok: true };
}

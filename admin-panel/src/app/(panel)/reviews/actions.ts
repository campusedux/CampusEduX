'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

type Result = { ok: boolean; error?: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => Number(s(fd, k) || 0);
const arr = (fd: FormData, k: string) => fd.getAll(k).map(String).filter(Boolean);

// --- review moderation --------------------------------------------
export async function setReviewStatus(id: string, status: 'published' | 'pending' | 'reported' | 'removed'): Promise<Result> {
  await requirePermission('reviews', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: `review.${status}`, module: 'reviews', resourceType: 'reviews', resourceId: id });
  revalidatePath('/reviews');
  revalidatePath('/reviews/approve');
  return { ok: true };
}

export async function deleteReviewWithReason(id: string, reason: string): Promise<Result> {
  await requirePermission('reviews', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'review.delete', module: 'reviews', resourceType: 'reviews', resourceId: id, details: { reason } });
  revalidatePath('/reviews');
  revalidatePath('/reviews/delete');
  revalidatePath('/reviews/reported');
  return { ok: true };
}

export async function resolveReport(
  reportId: string,
  decision: 'reviewed' | 'resolved',
  resolution: string,
  reviewAction?: 'keep' | 'remove',
  reviewId?: string,
): Promise<Result> {
  await requirePermission('reviews', 'edit');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('review_reports')
    .update({
      status: decision,
      resolution: resolution || '',
      resolved_by: user?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId);
  if (error) return { ok: false, error: error.message };

  if (reviewId && reviewAction) {
    await supabase
      .from('reviews')
      .update({ status: reviewAction === 'remove' ? 'removed' : 'published' })
      .eq('id', reviewId);
  }
  await logActivity({ action: `review_report.${decision}`, module: 'reviews', resourceType: 'review_reports', resourceId: reportId });
  revalidatePath('/reviews/reported');
  revalidatePath('/reviews');
  return { ok: true };
}

// --- testimonials -----------------------------------------------
export async function createTestimonial(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('reviews', 'add');
  const supabase = createClient();
  const author = s(fd, 'author_name');
  const quote = s(fd, 'quote');
  if (!author || !quote) return { ok: false, error: 'Author and quote are required.' };
  const { error } = await supabase.from('testimonials').insert({
    author_name: author,
    author_role: s(fd, 'author_role'),
    avatar_url: s(fd, 'avatar_url') || null,
    rating: Math.min(5, Math.max(1, n(fd, 'rating') || 5)),
    quote,
    display_on: arr(fd, 'display_on'),
    status: s(fd, 'status') || 'active',
    sort_order: n(fd, 'sort_order'),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/reviews/testimonials');
  return { ok: true };
}

export async function updateTestimonial(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('reviews', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('testimonials')
    .update({
      author_name: s(fd, 'author_name'),
      author_role: s(fd, 'author_role'),
      avatar_url: s(fd, 'avatar_url') || null,
      rating: Math.min(5, Math.max(1, n(fd, 'rating') || 5)),
      quote: s(fd, 'quote'),
      display_on: arr(fd, 'display_on'),
      status: s(fd, 'status') || 'active',
      sort_order: n(fd, 'sort_order'),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/reviews/testimonials');
  return { ok: true };
}

export async function deleteTestimonial(id: string): Promise<Result> {
  await requirePermission('reviews', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/reviews/testimonials');
  return { ok: true };
}

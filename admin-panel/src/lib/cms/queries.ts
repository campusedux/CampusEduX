import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';

export async function getBanners(placement: string) {
  const supabase = createClient();
  return safe(
    supabase
      .from('banners')
      .select('id, placement, title, subtitle, image_url, target_url, target_audience, display_on, status, priority, starts_at, ends_at')
      .eq('placement', placement)
      .order('priority'),
    [] as any[],
  );
}

export async function getAnnouncements() {
  const supabase = createClient();
  return safe(
    supabase.from('announcements').select('id, title, body, target_audience, status, starts_at, ends_at, updated_at').order('created_at', { ascending: false }),
    [] as any[],
  );
}

export async function getFaqs() {
  const supabase = createClient();
  return safe(
    supabase.from('faqs').select('id, question, answer, category, sort_order, status').order('category').order('sort_order'),
    [] as any[],
  );
}

export async function getCmsPage(key: string) {
  const supabase = createClient();
  const { data } = await supabase.from('cms_pages').select('key, title, content, updated_at').eq('key', key).maybeSingle();
  return data as { key: string; title: string; content: string; updated_at: string } | null;
}

export async function getCmsPages() {
  const supabase = createClient();
  return safe(
    supabase.from('cms_pages').select('key, title, content, updated_at').order('key'),
    [] as { key: string; title: string; content: string; updated_at: string }[],
  );
}

export async function getContactSubmissions() {
  const supabase = createClient();
  // contact_submissions is created by the website's migration
  // (website/supabase/migrations/0001_contact_submissions.sql); safe() falls
  // back to an empty list until that has been applied.
  return safe(
    supabase
      .from('contact_submissions')
      .select('id, name, email, message, status, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    [] as {
      id: string;
      name: string;
      email: string;
      message: string;
      status: string;
      user_id: string | null;
      created_at: string;
    }[],
  );
}

export async function getPushHistory() {
  const supabase = createClient();
  return safe(
    supabase
      .from('push_notifications')
      .select('id, title, body, category, target_audience, image_url, recipient_count, status, error_message, sent_by_email, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    [] as any[],
  );
}

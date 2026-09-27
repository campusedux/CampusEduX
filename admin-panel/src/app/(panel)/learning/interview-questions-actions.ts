'use server';

import { revalidatePath } from 'next/cache';
import type { SiteSync } from '@/lib/learning/siteRevalidate';
import { syncInterview } from '@/lib/learning/siteSync';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';

/** Reorder helpers for Practice ▸ Interview Questions — same adjacent-swap
 *  technique as `reorderTopicCodingProblem` in `practice-actions.ts`. */
const MODULE = 'learning' as const;
const LIST_PATH = '/learning/interview-questions';

type Result = { ok: boolean; error?: string } & SiteSync;

export async function reorderInterviewTopic(id: string, categoryId: string, dir: 'up' | 'down'): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { data: rows } = await supabase
    .from('interview_topics')
    .select('id,sort_order')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  const list = (rows ?? []) as { id: string; sort_order: number }[];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return { ok: false, error: 'Topic not found.' };
  const swap = dir === 'up' ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return { ok: true };
  const a = list[idx];
  const b = list[swap];
  const { error: e1 } = await supabase.from('interview_topics').update({ sort_order: b.sort_order }).eq('id', a.id);
  const { error: e2 } = await supabase.from('interview_topics').update({ sort_order: a.sort_order }).eq('id', b.id);
  if (e1 || e2) return { ok: false, error: (e1 ?? e2)!.message };
  revalidatePath(LIST_PATH);
  return { ok: true, ...(await syncInterview()) };
}

export async function reorderInterviewQuestion(id: string, topicId: string, dir: 'up' | 'down'): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { data: rows } = await supabase
    .from('interview_questions')
    .select('id,sort_order')
    .eq('topic_id', topicId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  const list = (rows ?? []) as { id: string; sort_order: number }[];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return { ok: false, error: 'Question not found.' };
  const swap = dir === 'up' ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return { ok: true };
  const a = list[idx];
  const b = list[swap];
  const { error: e1 } = await supabase.from('interview_questions').update({ sort_order: b.sort_order }).eq('id', a.id);
  const { error: e2 } = await supabase.from('interview_questions').update({ sort_order: a.sort_order }).eq('id', b.id);
  if (e1 || e2) return { ok: false, error: (e1 ?? e2)!.message };
  revalidatePath(LIST_PATH);
  return { ok: true, ...(await syncInterview()) };
}

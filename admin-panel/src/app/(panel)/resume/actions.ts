'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import type { UploadedFile } from '@/components/ui/UploadDropzone';

type Result = { ok: boolean; error?: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => Number(s(fd, k) || 0);
const lines = (fd: FormData, k: string) =>
  s(fd, k)
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);

// --- templates -------------------------------------------------------
export async function createTemplate(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('resume', 'add');
  const supabase = createClient();
  const name = s(fd, 'name');
  if (!name) return { ok: false, error: 'Title is required.' };
  const id = s(fd, 'id') || `${slug(name)}-${Math.random().toString(36).slice(2, 5)}`;
  const { error } = await supabase.from('resume_templates').insert({
    id,
    name,
    category: s(fd, 'category') || 'General',
    description: s(fd, 'description'),
    accent_color: s(fd, 'accent_color') || '#4F39F6',
    preview_image_url: s(fd, 'preview_image_url') || null,
    features: lines(fd, 'features'),
    is_premium: fd.get('is_premium') === 'on',
    status: s(fd, 'status') || 'active',
    sort_order: n(fd, 'sort_order'),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.template.create', module: 'resume', resourceType: 'resume_templates', resourceId: id });
  revalidatePath('/resume/templates');
  redirect('/resume/templates?created=1');
}

export async function updateTemplate(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('resume', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('resume_templates')
    .update({
      name: s(fd, 'name'),
      category: s(fd, 'category') || 'General',
      description: s(fd, 'description'),
      accent_color: s(fd, 'accent_color') || '#4F39F6',
      preview_image_url: s(fd, 'preview_image_url') || null,
      features: lines(fd, 'features'),
      is_premium: fd.get('is_premium') === 'on',
      status: s(fd, 'status') || 'active',
      sort_order: n(fd, 'sort_order'),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.template.update', module: 'resume', resourceType: 'resume_templates', resourceId: id });
  revalidatePath('/resume/templates');
  redirect('/resume/templates?saved=1');
}

export async function deleteTemplate(id: string): Promise<Result> {
  await requirePermission('resume', 'delete');
  const supabase = createClient();
  const { count } = await supabase.from('resumes_builder').select('id', { count: 'exact', head: true }).eq('template', id);
  if ((count ?? 0) > 0) return { ok: false, error: `${count} resume(s) use this template.` };
  const { error } = await supabase.from('resume_templates').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.template.delete', module: 'resume', resourceType: 'resume_templates', resourceId: id });
  revalidatePath('/resume/templates');
  return { ok: true };
}

export async function setTemplatePreview(id: string, files: UploadedFile[]): Promise<Result> {
  await requirePermission('resume', 'edit');
  if (!files.length) return { ok: false, error: 'No file uploaded.' };
  const supabase = createClient();
  const { error } = await supabase.from('resume_templates').update({ preview_image_url: files[0].url }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.template.preview_updated', module: 'resume', resourceType: 'resume_templates', resourceId: id });
  revalidatePath(`/resume/templates/${id}/edit`);
  revalidatePath('/resume/templates');
  return { ok: true };
}

// --- template categories -------------------------------------------
export async function createTemplateCategory(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('resume', 'add');
  const supabase = createClient();
  const name = s(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };
  const sl = s(fd, 'slug') || slug(name);
  const { error } = await supabase.from('resume_template_categories').insert({
    id: sl,
    name,
    slug: sl,
    status: s(fd, 'status') || 'active',
    sort_order: n(fd, 'sort_order'),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.template_category.create', module: 'resume', resourceType: 'resume_template_categories', resourceId: sl });
  revalidatePath('/resume/templates/categories');
  return { ok: true };
}
export async function updateTemplateCategory(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('resume', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('resume_template_categories')
    .update({ name: s(fd, 'name'), status: s(fd, 'status') || 'active', sort_order: n(fd, 'sort_order') })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.template_category.update', module: 'resume', resourceType: 'resume_template_categories', resourceId: id });
  revalidatePath('/resume/templates/categories');
  return { ok: true };
}
export async function deleteTemplateCategory(id: string): Promise<Result> {
  await requirePermission('resume', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('resume_template_categories').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.template_category.delete', module: 'resume', resourceType: 'resume_template_categories', resourceId: id });
  revalidatePath('/resume/templates/categories');
  return { ok: true };
}

// --- ATS rules ---------------------------------------------------
export async function createAtsRule(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('resume', 'add');
  const supabase = createClient();
  const rule = s(fd, 'rule');
  if (!rule) return { ok: false, error: 'Rule text is required.' };
  const id = `ats-${Math.random().toString(36).slice(2, 9)}`;
  const { error } = await supabase.from('ats_rules').insert({
    id,
    section: s(fd, 'section') || 'general',
    rule,
    guideline: s(fd, 'guideline'),
    importance: s(fd, 'importance') || 'medium',
    is_active: fd.get('is_active') !== 'off',
    sort_order: n(fd, 'sort_order'),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.ats_rule.create', module: 'resume', resourceType: 'ats_rules', resourceId: id });
  revalidatePath('/resume/ats-rules');
  return { ok: true };
}
export async function updateAtsRule(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('resume', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('ats_rules')
    .update({
      section: s(fd, 'section') || 'general',
      rule: s(fd, 'rule'),
      guideline: s(fd, 'guideline'),
      importance: s(fd, 'importance') || 'medium',
      sort_order: n(fd, 'sort_order'),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.ats_rule.update', module: 'resume', resourceType: 'ats_rules', resourceId: id });
  revalidatePath('/resume/ats-rules');
  return { ok: true };
}
export async function toggleAtsRule(id: string, next: boolean): Promise<Result> {
  await requirePermission('resume', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('ats_rules').update({ is_active: next }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.ats_rule.toggle', module: 'resume', resourceType: 'ats_rules', resourceId: id, details: { next } });
  revalidatePath('/resume/ats-rules');
  return { ok: true };
}
export async function deleteAtsRule(id: string): Promise<Result> {
  await requirePermission('resume', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('ats_rules').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.ats_rule.delete', module: 'resume', resourceType: 'ats_rules', resourceId: id });
  revalidatePath('/resume/ats-rules');
  return { ok: true };
}

// --- AI writing-assist prompts (Phase 8) ---------------------------
// Fixed 4-row config (one per resume_ai_prompts.section) — no create/delete,
// only editing the system prompt/token cap/active flag of the seeded rows.
export async function updateAiPrompt(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('resume', 'edit');
  const supabase = createClient();
  const systemPrompt = s(fd, 'system_prompt');
  if (!systemPrompt) return { ok: false, error: 'System prompt is required.' };
  const { error } = await supabase
    .from('resume_ai_prompts')
    .update({ system_prompt: systemPrompt, max_tokens: n(fd, 'max_tokens') || 400 })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.ai_prompt.update', module: 'resume', resourceType: 'resume_ai_prompts', resourceId: id });
  revalidatePath('/resume/ai-config');
  return { ok: true };
}

export async function toggleAiPrompt(id: string, next: boolean): Promise<Result> {
  await requirePermission('resume', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('resume_ai_prompts').update({ is_active: next }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.ai_prompt.toggle', module: 'resume', resourceType: 'resume_ai_prompts', resourceId: id, details: { next } });
  revalidatePath('/resume/ai-config');
  return { ok: true };
}

// --- share-link moderation (Phase 9) --------------------------------
export async function revokeResumeShare(shareId: string): Promise<Result> {
  await requirePermission('resume', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('resume_shares').update({ is_active: false }).eq('id', shareId);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.share.revoke', module: 'resume', resourceType: 'resume_shares', resourceId: shareId });
  revalidatePath('/resume/shares');
  return { ok: true };
}

export async function setShareReportStatus(reportId: string, status: 'resolved' | 'dismissed'): Promise<Result> {
  await requirePermission('resume', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('resume_share_reports')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', reportId);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'resume.share_report.status', module: 'resume', resourceType: 'resume_share_reports', resourceId: reportId, details: { status } });
  revalidatePath('/resume/shares');
  return { ok: true };
}

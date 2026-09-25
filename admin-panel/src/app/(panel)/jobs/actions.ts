'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { urlFieldError } from '@/lib/safeUrl';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { resolveTargetingFromForm } from '@/lib/academic-targeting';
import { WORK_MODES, EXPERIENCE_LEVELS, JOB_CATEGORIES } from '@/lib/jobs/constants';
import type { UploadedFile } from '@/components/ui/UploadDropzone';

type Result = { ok: boolean; error?: string };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v === '' ? null : Number(v);
};
const list = (fd: FormData, k: string) =>
  str(fd, k)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
// Deadline is a calendar date; the job closes at the end of that day in IST.
const deadlineOrNull = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59+05:30` : null;
};
const oneOf = <T extends string>(fd: FormData, k: string, allowed: readonly T[]): T | null => {
  const v = str(fd, k);
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
};
const extraFields = (fd: FormData) => ({
  work_mode: oneOf(fd, 'work_mode', WORK_MODES),
  experience_level: oneOf(fd, 'experience_level', EXPERIENCE_LEVELS),
  apply_url: str(fd, 'apply_url') || null,
  application_deadline: deadlineOrNull(fd, 'application_deadline'),
  requisition_id: str(fd, 'requisition_id') || null,
  // blank → NULL → the DB trigger derives it from title/skills
  category: oneOf(fd, 'category', JOB_CATEGORIES),
  qualification: str(fd, 'qualification') || null,
  shift: str(fd, 'shift') || null,
  benefits: str(fd, 'benefits').split(',').map((s) => s.trim()).filter(Boolean),
  summary: str(fd, 'summary') || null,
  responsibilities: list(fd, 'responsibilities'),
  candidate_note: str(fd, 'candidate_note') || null,
});
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);

async function companyName(supabase: ReturnType<typeof createClient>, companyId: string | null) {
  if (!companyId) return '';
  const { data } = await supabase.from('companies').select('name, logo_url').eq('id', companyId).maybeSingle();
  return data ?? { name: '', logo_url: null };
}

// --- jobs -------------------------------------------------------------
export async function createJob(_prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('jobs', 'add');
  const urlErr = urlFieldError(fd, { apply_url: 'Apply URL', company_logo_url: 'Company logo URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const title = str(fd, 'title');
  if (!title) return { ok: false, error: 'Title is required.' };
  if (!oneOf(fd, 'work_mode', WORK_MODES)) return { ok: false, error: 'Work mode is required.' };
  if (!oneOf(fd, 'experience_level', EXPERIENCE_LEVELS)) return { ok: false, error: 'Experience level is required.' };

  const companyId = str(fd, 'company_id') || null;
  const c = (await companyName(supabase, companyId)) as { name: string; logo_url: string | null };
  const id = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;

  const { error } = await supabase.from('jobs').insert({
    id,
    title,
    company_id: companyId,
    company_name: companyId ? c.name : str(fd, 'company_name'),
    company_logo_url: companyId ? c.logo_url : str(fd, 'company_logo_url') || null,
    location: str(fd, 'location'),
    salary_range: str(fd, 'salary_range'),
    salary_min_lpa: num(fd, 'salary_min_lpa'),
    salary_max_lpa: num(fd, 'salary_max_lpa'),
    job_type: str(fd, 'job_type') || 'Full Time',
    description: str(fd, 'description'),
    requirements: list(fd, 'requirements'),
    skills: str(fd, 'skills').split(',').map((s) => s.trim()).filter(Boolean),
    experience: str(fd, 'experience'),
    status: str(fd, 'status') || 'open',
    ...extraFields(fd),
    ...(await resolveTargetingFromForm(fd)),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'job.create', module: 'jobs', resourceType: 'jobs', resourceId: id });
  revalidatePath('/jobs');
  redirect(`/jobs/${id}?created=1`);
}

export async function updateJob(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('jobs', 'edit');
  const urlErr = urlFieldError(fd, { apply_url: 'Apply URL', company_logo_url: 'Company logo URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const companyId = str(fd, 'company_id') || null;
  const c = (await companyName(supabase, companyId)) as { name: string; logo_url: string | null };

  const { error } = await supabase
    .from('jobs')
    .update({
      title: str(fd, 'title'),
      company_id: companyId,
      company_name: companyId ? c.name : str(fd, 'company_name'),
      company_logo_url: companyId ? c.logo_url : str(fd, 'company_logo_url') || null,
      location: str(fd, 'location'),
      salary_range: str(fd, 'salary_range'),
      salary_min_lpa: num(fd, 'salary_min_lpa'),
      salary_max_lpa: num(fd, 'salary_max_lpa'),
      job_type: str(fd, 'job_type') || 'Full Time',
      description: str(fd, 'description'),
      requirements: list(fd, 'requirements'),
      skills: str(fd, 'skills').split(',').map((s) => s.trim()).filter(Boolean),
      experience: str(fd, 'experience'),
      status: str(fd, 'status') || 'open',
      ...extraFields(fd),
      ...(await resolveTargetingFromForm(fd)),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'job.update', module: 'jobs', resourceType: 'jobs', resourceId: id });
  revalidatePath(`/jobs/${id}`);
  redirect(`/jobs/${id}?saved=1`);
}

export async function deleteJob(id: string): Promise<Result> {
  await requirePermission('jobs', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'job.delete', module: 'jobs', resourceType: 'jobs', resourceId: id });
  revalidatePath('/jobs');
  return { ok: true };
}

export async function toggleJobFeatured(id: string, next: boolean): Promise<Result> {
  await requirePermission('jobs', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('jobs').update({ is_featured: next }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/jobs/featured');
  return { ok: true };
}

export async function setJobPriority(id: string, value: number): Promise<Result> {
  await requirePermission('jobs', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('jobs').update({ featured_priority: value }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/jobs/featured');
  return { ok: true };
}

// --- companies ------------------------------------------------------
export async function createCompany(_prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('jobs', 'add');
  const urlErr = urlFieldError(fd, { logo_url: 'Logo URL', website: 'Company website' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const name = str(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };
  const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from('companies').insert({
    id,
    name,
    logo_url: str(fd, 'logo_url') || null,
    website: str(fd, 'website') || null,
    employee_count: str(fd, 'employee_count'),
    about: str(fd, 'about'),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'company.create', module: 'jobs', resourceType: 'companies', resourceId: id });
  revalidatePath('/jobs/companies');
  redirect(`/jobs/companies/${id}?created=1`);
}

export async function updateCompany(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('jobs', 'edit');
  const urlErr = urlFieldError(fd, { logo_url: 'Logo URL', website: 'Company website' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const logoUrl = str(fd, 'logo_url') || null;
  const { error } = await supabase
    .from('companies')
    .update({
      name: str(fd, 'name'),
      logo_url: logoUrl,
      website: str(fd, 'website') || null,
      employee_count: str(fd, 'employee_count'),
      about: str(fd, 'about'),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  // Jobs keep a denormalised copy of the company logo — keep them in sync.
  await supabase.from('jobs').update({ company_logo_url: logoUrl }).eq('company_id', id);
  await logActivity({ action: 'company.update', module: 'jobs', resourceType: 'companies', resourceId: id });
  revalidatePath(`/jobs/companies/${id}`);
  redirect(`/jobs/companies/${id}?saved=1`);
}

export async function setCompanyLogo(companyId: string, files: UploadedFile[]): Promise<Result> {
  await requirePermission('jobs', 'edit');
  if (!files.length) return { ok: false, error: 'No file uploaded.' };
  const supabase = createClient();
  const url = files[0].url;
  const { error } = await supabase.from('companies').update({ logo_url: url }).eq('id', companyId);
  if (error) return { ok: false, error: error.message };
  // Jobs store a denormalised copy of the logo — keep them in sync.
  await supabase.from('jobs').update({ company_logo_url: url }).eq('company_id', companyId);
  await logActivity({ action: 'company.logo.set', module: 'jobs', resourceType: 'companies', resourceId: companyId });
  revalidatePath(`/jobs/companies/${companyId}`);
  revalidatePath(`/jobs/companies/${companyId}/edit`);
  return { ok: true };
}

export async function removeCompanyLogo(companyId: string): Promise<Result> {
  await requirePermission('jobs', 'edit');
  const supabase = createClient();
  const { data: current } = await supabase.from('companies').select('logo_url').eq('id', companyId).maybeSingle();
  const { error } = await supabase.from('companies').update({ logo_url: null }).eq('id', companyId);
  if (error) return { ok: false, error: error.message };
  await supabase.from('jobs').update({ company_logo_url: null }).eq('company_id', companyId);

  const url = current?.logo_url ?? '';
  const marker = '/project-media/';
  const idx = url.indexOf(marker);
  if (idx >= 0) await supabase.storage.from('project-media').remove([url.slice(idx + marker.length)]);

  await logActivity({ action: 'company.logo.remove', module: 'jobs', resourceType: 'companies', resourceId: companyId });
  revalidatePath(`/jobs/companies/${companyId}`);
  revalidatePath(`/jobs/companies/${companyId}/edit`);
  return { ok: true };
}

export async function deleteCompany(id: string): Promise<Result> {
  await requirePermission('jobs', 'delete');
  const supabase = createClient();
  const { count } = await supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('company_id', id);
  if ((count ?? 0) > 0) return { ok: false, error: `${count} job(s) still belong to this company.` };
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'company.delete', module: 'jobs', resourceType: 'companies', resourceId: id });
  revalidatePath('/jobs/companies');
  return { ok: true };
}

export async function createRecruiter(companyId: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('jobs', 'edit');
  const supabase = createClient();
  const name = str(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };
  const id = `${companyId}-${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`;
  const { error } = await supabase.from('recruiters').insert({
    id,
    company_id: companyId,
    name,
    title: str(fd, 'title'),
    email: str(fd, 'email'),
    phone: str(fd, 'phone'),
    location: str(fd, 'location'),
    about: str(fd, 'about'),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/jobs/companies/${companyId}`);
  return { ok: true };
}

export async function deleteRecruiter(companyId: string, recruiterId: string): Promise<Result> {
  await requirePermission('jobs', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('recruiters').delete().eq('id', recruiterId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/jobs/companies/${companyId}`);
  return { ok: true };
}

// --- applications -------------------------------------------------
export async function setApplicationStatus(
  id: string,
  status: 'in_review' | 'shortlisted' | 'rejected' | 'hired',
  reason?: string,
): Promise<Result> {
  await requirePermission('jobs', 'edit');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const patch: Record<string, unknown> = {
    status,
    decided_by: user?.id ?? null,
    decided_at: new Date().toISOString(),
  };
  if (status === 'rejected') patch.rejection_reason = reason ?? null;
  if (status === 'in_review') {
    patch.rejection_reason = null;
    patch.decided_at = null;
    patch.decided_by = null;
  }

  const { data: app, error } = await supabase
    .from('applications')
    .update(patch)
    .eq('id', id)
    .select('job_id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };

  // Record a stage so the applicant's timeline reflects it.
  const label =
    status === 'shortlisted' ? 'Shortlisted' : status === 'rejected' ? 'Application rejected' : status === 'hired' ? 'Hired' : 'Under review';
  const { data: last } = await supabase
    .from('application_stages')
    .select('sort_order')
    .eq('application_id', id)
    .order('sort_order', { ascending: false })
    .limit(1);
  await supabase.from('application_stages').insert({
    application_id: id,
    label,
    status: 'completed',
    occurred_at: new Date().toISOString(),
    sort_order: (last?.[0]?.sort_order ?? 0) + 1,
  });

  await logActivity({ action: `application.${status}`, module: 'jobs', resourceType: 'applications', resourceId: id });
  revalidatePath(`/jobs/applications/${id}`);
  revalidatePath('/jobs/applications');
  revalidatePath('/jobs/shortlisted');
  revalidatePath('/jobs/rejected');
  return { ok: true };
}

export async function setApplicationStatusForm(id: string, _prev: Result, fd: FormData): Promise<Result> {
  const status = str(fd, 'status') as 'in_review' | 'shortlisted' | 'rejected' | 'hired';
  return setApplicationStatus(id, status, str(fd, 'reason'));
}

import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';
import {
  JOB_PAGE_SIZE,
  COMPANY_PAGE_SIZE,
  APPLICATION_PAGE_SIZE,
} from '@/lib/jobs/constants';

// Re-export so server pages can keep importing everything from one place.
export {
  JOB_PAGE_SIZE,
  COMPANY_PAGE_SIZE,
  APPLICATION_PAGE_SIZE,
  JOB_TYPES,
  APP_STATUS_LABEL,
} from '@/lib/jobs/constants';

export interface JobRow {
  id: string;
  title: string;
  company_id: string | null;
  company_name: string | null;
  location: string;
  salary_range: string;
  job_type: string;
  status: string | null;
  is_featured: boolean;
  posted_at: string;
  created_at: string;
}

export async function listJobs(opts: {
  page: number;
  q?: string;
  company?: string;
  type?: string;
  status?: string;
  targeting?: string; // 'global' | 'course' | 'branch'
}) {
  const supabase = createClient();
  const from = (opts.page - 1) * JOB_PAGE_SIZE;
  let query = supabase
    .from('jobs')
    .select(
      'id, title, company_id, company_name, location, salary_range, job_type, status, is_featured, posted_at, created_at',
      { count: 'estimated' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + JOB_PAGE_SIZE - 1);

  if (opts.q) query = query.or(`title.ilike.%${opts.q}%,company_name.ilike.%${opts.q}%,location.ilike.%${opts.q}%`);
  if (opts.company) query = query.eq('company_id', opts.company);
  if (opts.type) query = query.eq('job_type', opts.type);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.targeting) query = query.eq('target_type', opts.targeting);

  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

// Every column the detail page + JobForm read (the edit page spreads the row
// into the form's `initial`, so the 0113/0114 fields must be listed here too).
const JOB_DETAIL_COLS =
  'id, title, company_id, company_name, location, salary_range, job_type, status, is_featured, posted_at, created_at, ' +
  'recruiter_id, salary_min_lpa, salary_max_lpa, description, requirements, skills, experience, company_logo_url, ' +
  'featured_priority, updated_at, apply_url, application_deadline, requisition_id, category, qualification, work_mode, ' +
  'experience_level, shift, benefits, summary, responsibilities, candidate_note, ' +
  'target_type, target_course_id, target_branch_ids, target_year_id';

export async function getJob(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('jobs').select(JOB_DETAIL_COLS).eq('id', id).maybeSingle();
  return data as unknown as
    | (JobRow & {
        recruiter_id: string | null;
        salary_min_lpa: number | null;
        salary_max_lpa: number | null;
        description: string;
        requirements: string[];
        skills: string[];
        experience: string;
        company_logo_url: string | null;
        featured_priority: number;
        updated_at: string;
      })
    | null;
}

export async function getJobStats() {
  const supabase = createClient();
  const [total, open, featured, apps, hires] = await Promise.all([
    safeCount(supabase.from('jobs').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open')),
    safeCount(supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_featured', true)),
    safeCount(supabase.from('applications').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'hired')),
  ]);
  return { total, open, featured, apps, hires };
}

export async function getCompanyOptions() {
  const supabase = createClient();
  return safe(
    supabase.from('companies').select('id, name').order('name'),
    [] as { id: string; name: string }[],
  );
}

export async function listCompanies(opts: { page: number; q?: string }) {
  const supabase = createClient();
  const from = (opts.page - 1) * COMPANY_PAGE_SIZE;
  let query = supabase
    .from('companies')
    .select('id, name, logo_url, website, rating, review_count, employee_count, open_jobs_count, created_at', {
      count: 'estimated',
    })
    .order('open_jobs_count', { ascending: false })
    .range(from, from + COMPANY_PAGE_SIZE - 1);
  if (opts.q) query = query.ilike('name', `%${opts.q}%`);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getCompany(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('companies')
    .select('id, name, logo_url, website, rating, review_count, employee_count, about, open_jobs_count, created_at, updated_at')
    .eq('id', id).maybeSingle();
  return data as
    | {
        id: string;
        name: string;
        logo_url: string | null;
        website: string | null;
        rating: number;
        review_count: number;
        employee_count: string;
        about: string;
        open_jobs_count: number;
        created_at: string;
        updated_at: string;
      }
    | null;
}

export async function getCompanyRecruiters(companyId: string) {
  const supabase = createClient();
  return safe(
    supabase
      .from('recruiters')
      .select('id, name, title, email, phone, location, about')
      .eq('company_id', companyId)
      .order('name'),
    [] as { id: string; name: string; title: string; email: string; phone: string; location: string; about: string }[],
  );
}

export async function listApplications(opts: { page: number; q?: string; status?: string; job?: string }) {
  const supabase = createClient();
  const from = (opts.page - 1) * APPLICATION_PAGE_SIZE;

  // Applicant search resolves to user ids first (can't filter rows by an
  // embedded resource's columns in one round trip).
  let userIds: string[] | null = null;
  if (opts.q) {
    const { data: matched } = await supabase
      .from('profiles')
      .select('id')
      .or(`full_name.ilike.%${opts.q}%,email.ilike.%${opts.q}%,mobile_number.ilike.%${opts.q}%`)
      .limit(300);
    userIds = (matched ?? []).map((u) => u.id);
    if (userIds.length === 0) return { rows: [], total: 0, missing: false };
  }

  let query = supabase
    .from('applications')
    .select(
      'id, status, created_at, rejection_reason, job:jobs(title, company_name), applicant:profiles(full_name, email), resume:resumes(file_name)',
      { count: 'estimated' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + APPLICATION_PAGE_SIZE - 1);

  if (opts.status) query = query.eq('status', opts.status);
  if (opts.job) query = query.eq('job_id', opts.job);
  if (userIds) query = query.in('user_id', userIds);

  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getApplication(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('applications')
    .select(
      'id, status, created_at, updated_at, rejection_reason, admin_notes, decided_at, job:jobs(id, title, company_name, location), applicant:profiles(id, full_name, email, mobile_number, course, branch), resume:resumes(id, file_name, file_url, uploaded_at)',
    )
    .eq('id', id)
    .maybeSingle();
  return data as any;
}

export async function getApplicationStages(applicationId: string) {
  const supabase = createClient();
  return safe(
    supabase
      .from('application_stages')
      .select('id, label, status, occurred_at, sort_order')
      .eq('application_id', applicationId)
      .order('sort_order'),
    [] as { id: string; label: string; status: string; occurred_at: string | null; sort_order: number }[],
  );
}

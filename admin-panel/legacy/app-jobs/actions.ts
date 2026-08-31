'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export interface JobFormValues {
  title: string;
  companyId: string | null;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  jobType: 'full_time' | 'internship' | 'contract';
  experienceMinYears: number;
  experienceMaxYears: number | null;
  salaryMinLpa: number | null;
  salaryMaxLpa: number | null;
  skills: string[];
  description: string | null;
  applyUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
}

function assertCanManage(roleId: string) {
  if (roleId !== 'admin' && roleId !== 'super_admin' && roleId !== 'manager') {
    throw new Error('You do not have permission to manage jobs.');
  }
}

export async function createJob(values: JobFormValues) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      title: values.title,
      company_id: values.companyId,
      company_name: values.companyName,
      company_logo_url: values.companyLogoUrl,
      location: values.location,
      job_type: values.jobType,
      experience_min_years: values.experienceMinYears,
      experience_max_years: values.experienceMaxYears,
      salary_min_lpa: values.salaryMinLpa,
      salary_max_lpa: values.salaryMaxLpa,
      skills: values.skills,
      description: values.description,
      apply_url: values.applyUrl,
      is_featured: values.isFeatured,
      is_active: values.isActive,
      created_by: staff.id,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'job.create', resourceType: 'jobs', resourceId: job.id, newValue: values });

  revalidatePath('/jobs');
  redirect('/jobs');
}

export async function toggleJobActive(jobId: string, isActive: boolean) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('jobs').update({ is_active: isActive }).eq('id', jobId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'job.activate' : 'job.deactivate',
    resourceType: 'jobs',
    resourceId: jobId,
  });

  revalidatePath('/jobs');
}

export async function toggleJobFeatured(jobId: string, isFeatured: boolean) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('jobs').update({ is_featured: isFeatured }).eq('id', jobId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isFeatured ? 'job.feature' : 'job.unfeature',
    resourceType: 'jobs',
    resourceId: jobId,
  });

  revalidatePath('/jobs');
}

export async function updateJobCompany(jobId: string, companyId: string | null) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('jobs').update({ company_id: companyId }).eq('id', jobId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'job.link_company',
    resourceType: 'jobs',
    resourceId: jobId,
    newValue: { companyId },
  });

  revalidatePath('/jobs');
}

export async function deleteJob(jobId: string) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('jobs').delete().eq('id', jobId);
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'job.delete', resourceType: 'jobs', resourceId: jobId });

  revalidatePath('/jobs');
}

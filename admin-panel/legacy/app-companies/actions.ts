'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

function assertCanManage(roleId: string) {
  if (roleId !== 'admin' && roleId !== 'super_admin' && roleId !== 'manager') {
    throw new Error('You do not have permission to manage companies.');
  }
}

export interface CompanyFormValues {
  name: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  hqLocation: string | null;
  companySize: string | null;
  foundedYear: number | null;
}

export async function createCompany(values: CompanyFormValues) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      name: values.name,
      logo_url: values.logoUrl,
      description: values.description,
      website: values.website,
      industry: values.industry,
      hq_location: values.hqLocation,
      company_size: values.companySize,
      founded_year: values.foundedYear,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'company.create', resourceType: 'companies', resourceId: company.id, newValue: values });
  revalidatePath('/companies');
  redirect('/companies');
}

export async function deleteCompany(companyId: string) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('companies').delete().eq('id', companyId);
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'company.delete', resourceType: 'companies', resourceId: companyId });
  revalidatePath('/companies');
}

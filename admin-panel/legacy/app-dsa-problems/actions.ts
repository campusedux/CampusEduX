'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

function assertCanManage(roleId: string) {
  if (roleId !== 'admin' && roleId !== 'super_admin' && roleId !== 'manager') {
    throw new Error('You do not have permission to manage DSA problems.');
  }
}

export interface DsaProblemFormValues {
  topicId: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string | null;
  hints: string[];
  tags: string[];
  solutionExplanation: string | null;
  solutionCode: string | null;
  solutionLanguage: string;
}

export async function createDsaProblem(values: DsaProblemFormValues) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { data: problem, error } = await supabase
    .from('dsa_problems')
    .insert({
      topic_id: values.topicId,
      title: values.title,
      slug: values.slug,
      difficulty: values.difficulty,
      description: values.description,
      examples: values.examples.filter((e) => e.input.trim() || e.output.trim()),
      constraints: values.constraints,
      hints: values.hints.filter(Boolean),
      tags: values.tags.filter(Boolean),
      solution_explanation: values.solutionExplanation,
      solution_code: values.solutionCode,
      solution_language: values.solutionLanguage,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'dsa_problem.create', resourceType: 'dsa_problems', resourceId: problem.id, newValue: values });
  revalidatePath('/dsa-problems');
  redirect('/dsa-problems');
}

export async function toggleDsaProblemActive(id: string, isActive: boolean) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('dsa_problems').update({ is_active: isActive }).eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'dsa_problem.activate' : 'dsa_problem.deactivate',
    resourceType: 'dsa_problems',
    resourceId: id,
  });
  revalidatePath('/dsa-problems');
}

export async function deleteDsaProblem(id: string) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('dsa_problems').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'dsa_problem.delete', resourceType: 'dsa_problems', resourceId: id });
  revalidatePath('/dsa-problems');
}

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

function assertCanManage(roleId: string) {
  if (roleId !== 'admin' && roleId !== 'super_admin' && roleId !== 'manager') {
    throw new Error('You do not have permission to manage placement content.');
  }
}

export interface CategoryFormValues {
  key: string;
  routeKey: string;
  label: string;
  sublabel: string;
  countLabel: string;
  sortOrder: number;
  isActive: boolean;
}

export async function createCategory(values: CategoryFormValues) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('placement_categories').insert({
    key: values.key,
    route_key: values.routeKey,
    label: values.label,
    sublabel: values.sublabel,
    count_label: values.countLabel,
    sort_order: values.sortOrder,
    is_active: values.isActive,
  });
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'placement_category.create', resourceType: 'placement_categories', resourceId: values.key, newValue: values });
  revalidatePath('/placement');
}

export async function toggleCategoryActive(key: string, isActive: boolean) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('placement_categories').update({ is_active: isActive }).eq('key', key);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'placement_category.activate' : 'placement_category.deactivate',
    resourceType: 'placement_categories',
    resourceId: key,
  });
  revalidatePath('/placement');
}

export interface TopicFormValues {
  categoryKey: string;
  label: string;
  countLabel: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  solvedCount: number | null;
  totalCount: number | null;
  sortOrder: number;
}

export async function createTopic(values: TopicFormValues) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('placement_topics').insert({
    category_key: values.categoryKey,
    label: values.label,
    count_label: values.countLabel,
    difficulty: values.difficulty,
    solved_count: values.solvedCount,
    total_count: values.totalCount,
    sort_order: values.sortOrder,
  });
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'placement_topic.create', resourceType: 'placement_topics', newValue: values });
  revalidatePath(`/placement/${values.categoryKey}`);
}

export async function toggleTopicActive(id: string, categoryKey: string, isActive: boolean) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('placement_topics').update({ is_active: isActive }).eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'placement_topic.activate' : 'placement_topic.deactivate',
    resourceType: 'placement_topics',
    resourceId: id,
  });
  revalidatePath(`/placement/${categoryKey}`);
}

export async function deleteTopic(id: string, categoryKey: string) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('placement_topics').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'placement_topic.delete', resourceType: 'placement_topics', resourceId: id });
  revalidatePath(`/placement/${categoryKey}`);
}

export interface QuestionFormValues {
  categoryKey: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export async function createQuestion(values: QuestionFormValues) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('placement_questions').insert({
    category_key: values.categoryKey,
    question: values.question,
    answer: values.answer,
    sort_order: values.sortOrder,
  });
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'placement_question.create', resourceType: 'placement_questions', newValue: values });
  revalidatePath(`/placement/${values.categoryKey}`);
}

export async function toggleQuestionActive(id: string, categoryKey: string, isActive: boolean) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('placement_questions').update({ is_active: isActive }).eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'placement_question.activate' : 'placement_question.deactivate',
    resourceType: 'placement_questions',
    resourceId: id,
  });
  revalidatePath(`/placement/${categoryKey}`);
}

export async function deleteQuestion(id: string, categoryKey: string) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('placement_questions').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'placement_question.delete', resourceType: 'placement_questions', resourceId: id });
  revalidatePath(`/placement/${categoryKey}`);
}

// ── MCQ Test Bank (test_questions) ──────────────────────────────────────
// Powers Start Test → Question → Result for Aptitude, Company Mock Tests,
// and the general Mock Tests hub in the mobile app.

export interface TestQuestionFormValues {
  categoryKey: string;
  topicId: string | null;
  companyName: string | null;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  sortOrder: number;
}

export async function createTestQuestion(values: TestQuestionFormValues) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('test_questions').insert({
    category_key: values.categoryKey,
    topic_id: values.topicId,
    company_name: values.companyName,
    question_text: values.questionText,
    options: values.options,
    correct_index: values.correctIndex,
    explanation: values.explanation,
    difficulty: values.difficulty,
    sort_order: values.sortOrder,
  });
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'test_question.create', resourceType: 'test_questions', newValue: values });
  revalidatePath(`/placement/${values.categoryKey}`);
}

export async function toggleTestQuestionActive(id: string, categoryKey: string, isActive: boolean) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('test_questions').update({ is_active: isActive }).eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'test_question.activate' : 'test_question.deactivate',
    resourceType: 'test_questions',
    resourceId: id,
  });
  revalidatePath(`/placement/${categoryKey}`);
}

export async function deleteTestQuestion(id: string, categoryKey: string) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('test_questions').delete().eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'test_question.delete', resourceType: 'test_questions', resourceId: id });
  revalidatePath(`/placement/${categoryKey}`);
}

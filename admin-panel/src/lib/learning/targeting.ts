import { resolveTargetingFromForm } from '@/lib/academic-targeting';

/**
 * The `learning_*` / `practice_tests` / `dsa_problems` / `hr_questions` tables
 * carry the ARRAY targeting columns (migration 0044/021) but NOT the legacy
 * scalar `target_branch_id` / `target_branch_name` that `resolveTargetingFromForm`
 * also returns for projects / jobs / prep_notes.
 *
 * This wrapper reuses the same server resolver (id → name lookups, cross-course
 * branch cleanup, fall-back-to-global) and returns only the columns the Learning
 * tables actually have, so the patch can be spread straight into an insert /
 * update. Returns `{}` when the form carries no targeting fields.
 *
 * The DB `validate_learning_targeting()` trigger (0044/021) is the final guard.
 */
export async function resolveLearningTargeting(fd: FormData) {
  const full = await resolveTargetingFromForm(fd);
  if (!('target_type' in full)) return {};
  return {
    target_type: full.target_type ?? 'global',
    target_course_id: full.target_course_id ?? null,
    target_course_name: full.target_course_name ?? null,
    target_branch_ids: full.target_branch_ids ?? [],
    target_branch_names: full.target_branch_names ?? [],
    target_year_id: full.target_year_id ?? null,
    target_year_label: full.target_year_label ?? null,
  };
}

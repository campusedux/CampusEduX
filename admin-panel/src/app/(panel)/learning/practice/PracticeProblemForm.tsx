'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-dom';
import { Card, CardHeader, Label, Select } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { CodingProblemFields } from '@/app/(panel)/learning/grids/[gridId]/sections/[sectionId]/topics/[topicId]/CodingProblemForm';
import { useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import type { PracticeCategoryRow, PracticeProblemRow } from '@/lib/learning/queries';
import { createPracticeProblem, updatePracticeProblem } from '@/app/(panel)/learning/practice-global-actions';

/**
 * Add / edit form for a global Practice coding problem. Reuses the exact
 * `CodingProblemFields` set from the topic-practice editor and prepends a
 * category `<select>` (which `dsa_topics` row of `kind='practice'` it belongs
 * to). Same behaviour on both routes; on create it redirects to the edit page.
 */
export function PracticeProblemForm({
  categories,
  problem,
}: {
  categories: PracticeCategoryRow[];
  problem?: PracticeProblemRow;
}) {
  const router = useRouter();
  type FormResult = ActionResult & { id?: string };
  const bound: (p: FormResult, fd: FormData) => Promise<FormResult> = problem
    ? updatePracticeProblem.bind(null, problem.id)
    : createPracticeProblem;
  const [state, action] = useFormState(bound, { ok: false } as FormResult);
  useActionToast(state);

  useEffect(() => {
    if (!problem && state.ok && state.id) router.push(`/learning/practice/${state.id}`);
  }, [state, problem, router]);

  return (
    <Card>
      <CardHeader
        title={problem ? 'Edit problem' : 'New problem'}
        description="Published problems appear at /practice/problems on the website. Hidden test cases are never sent to a client."
      />
      <form action={action} className="space-y-4">
        <div className="sm:max-w-xs">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={problem?.topic_id ?? categories[0]?.id ?? ''} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <CodingProblemFields p={problem} />

        <div className="flex justify-end pt-2">
          <div className="w-40">
            <SubmitButton pendingLabel="Saving…">{problem ? 'Save changes' : 'Create problem'}</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

export default PracticeProblemForm;

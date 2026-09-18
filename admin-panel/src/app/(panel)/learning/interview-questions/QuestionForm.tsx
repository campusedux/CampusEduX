'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-dom';
import { Card, CardHeader, Label, Input, Textarea, Select } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import { DIFFICULTIES } from '@/lib/learning/constants';
import type { InterviewCategoryRow, InterviewTopicRow, InterviewQuestionRow } from '@/lib/learning/queries';
import { createInterviewQuestion, updateInterviewQuestion } from '@/app/(panel)/learning/interview-questions-global-actions';

/**
 * Add / edit form for one Interview Question. On create it redirects to the
 * edit page, same behaviour as `PracticeProblemForm`.
 */
export function QuestionForm({
  categories,
  topics,
  question,
  defaultTopicId,
}: {
  categories: InterviewCategoryRow[];
  topics: InterviewTopicRow[];
  question?: InterviewQuestionRow;
  defaultTopicId?: string;
}) {
  const router = useRouter();
  type FormResult = ActionResult & { id?: string };
  const bound: (p: FormResult, fd: FormData) => Promise<FormResult> = question
    ? updateInterviewQuestion.bind(null, question.id)
    : createInterviewQuestion;
  const [state, action] = useFormState(bound, { ok: false } as FormResult);
  useActionToast(state);

  useEffect(() => {
    if (!question && state.ok && state.id) router.push(`/learning/interview-questions/${state.id}`);
  }, [state, question, router]);

  return (
    <Card>
      <CardHeader
        title={question ? 'Edit question' : 'New question'}
        description="Published questions appear on the matching topic page at /practice/interview-questions/<category>/<topic>."
      />
      <form action={action} className="space-y-4">
        <div className="sm:max-w-sm">
          <Label htmlFor="topic">Topic</Label>
          <Select name="topic" defaultValue={question?.topic_id ?? defaultTopicId ?? topics[0]?.id ?? ''} required>
            {categories.map((c) => (
              <optgroup key={c.id} label={c.name}>
                {topics
                  .filter((t) => t.category_id === c.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="question">Question</Label>
          <Textarea name="question" rows={2} required defaultValue={question?.question ?? ''} />
        </div>
        <div>
          <Label htmlFor="answer">Ans</Label>
          <Textarea name="answer" rows={5} defaultValue={question?.answer ?? ''} placeholder="Plain text or Markdown." />
        </div>
        <div>
          <Label htmlFor="example">Example</Label>
          <Textarea
            name="example"
            rows={6}
            defaultValue={question?.example ?? ''}
            placeholder={'Optional. Use a fenced code block, e.g.\n```java\n...\n```'}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="important_point">Important Point</Label>
          <Textarea name="important_point" rows={2} defaultValue={question?.important_point ?? ''} />
        </div>

        <div className="grid gap-3 sm:grid-cols-[160px_110px]">
          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select name="difficulty" defaultValue={question?.difficulty ?? 'Medium'}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sort_order">Sort</Label>
            <Input name="sort_order" type="number" min={0} defaultValue={question?.sort_order ?? 0} />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={question?.status ?? 'draft'}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="show_on_website"
              defaultChecked={question?.show_on_website ?? true}
              className="h-4 w-4 rounded border-border text-brand"
            />
            Show on Website
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="show_on_mobile"
              defaultChecked={question?.show_on_mobile ?? true}
              className="h-4 w-4 rounded border-border text-brand"
            />
            Show on Mobile
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <div className="w-40">
            <SubmitButton pendingLabel="Saving…">{question ? 'Save changes' : 'Create question'}</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

export default QuestionForm;

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { DIFFICULTIES, HR_CATEGORIES } from '@/lib/placement/constants';
import type { QuestionType } from '@/lib/placement/constants';

type Result = { ok: boolean; error?: string };

export function QuestionForm({
  type,
  mode,
  action,
  initial = {},
  tests = [],
  companies = [],
  dsaTopics = [],
  cancelHref,
}: {
  type: QuestionType;
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: Record<string, any>;
  tests?: { id: string; title: string; category: string }[];
  companies?: { id: string; name: string }[];
  dsaTopics?: { id: string; name: string }[];
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  const j = (v: unknown) => (v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v, null, 2));

  return (
    <form action={formAction} className="space-y-5">
      {type === 'aptitude' ? (
        <Section title="MCQ question">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="test_id">Mock test</Label>
              <Select id="test_id" name="test_id" defaultValue={initial.test_id ?? ''} required>
                <option value="">— pick a test —</option>
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select id="difficulty" name="difficulty" defaultValue={initial.difficulty ?? 'Medium'}>
                {DIFFICULTIES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="question_text">Question</Label>
              <Textarea id="question_text" name="question_text" rows={3} required defaultValue={initial.question_text ?? ''} />
            </div>
            <div>
              <Label htmlFor="options">Options (one per line)</Label>
              <Textarea id="options" name="options" rows={4} required defaultValue={(initial.options ?? []).join('\n')} />
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="correct_index">Correct option (0-based index)</Label>
                <Input id="correct_index" name="correct_index" type="number" min="0" defaultValue={initial.correct_index ?? 0} />
              </div>
              <div>
                <Label htmlFor="marks">Marks</Label>
                <Input id="marks" name="marks" type="number" min="1" defaultValue={initial.marks ?? 1} />
              </div>
              <div>
                <Label htmlFor="sort_order">Sort order</Label>
                <Input id="sort_order" name="sort_order" type="number" defaultValue={initial.sort_order ?? 0} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea id="explanation" name="explanation" rows={2} defaultValue={initial.explanation ?? ''} />
            </div>
          </div>
        </Section>
      ) : null}

      {type === 'hr' ? (
        <Section title="HR question">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="company_id">Company (leave blank for the generic bank)</Label>
              <Select id="company_id" name="company_id" defaultValue={initial.company_id ?? ''}>
                <option value="">— generic —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue={initial.category ?? 'General Questions'}>
                {HR_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select id="difficulty" name="difficulty" defaultValue={initial.difficulty ?? 'Medium'}>
                {DIFFICULTIES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="question">Question</Label>
              <Textarea id="question" name="question" rows={2} required defaultValue={initial.question ?? ''} />
            </div>
            <div>
              <Label htmlFor="answer_tips">Answer tips (one per line)</Label>
              <Textarea id="answer_tips" name="answer_tips" rows={4} defaultValue={(initial.answer_tips ?? []).join('\n')} />
            </div>
            <div>
              <Label htmlFor="sample_answer">Sample answer</Label>
              <Textarea id="sample_answer" name="sample_answer" rows={4} defaultValue={initial.sample_answer ?? ''} />
            </div>
          </div>
        </Section>
      ) : null}

      {type === 'dsa' ? (
        <>
          <Section title="Problem">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="topic_id">Topic</Label>
                <Select id="topic_id" name="topic_id" defaultValue={initial.topic_id ?? ''} required>
                  <option value="">— pick a topic —</option>
                  {dsaTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select id="difficulty" name="difficulty" defaultValue={initial.difficulty ?? 'Easy'}>
                  {DIFFICULTIES.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required defaultValue={initial.title ?? ''} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={4} defaultValue={initial.description ?? ''} />
              </div>
              <div>
                <Label htmlFor="constraints">Constraints (one per line)</Label>
                <Textarea id="constraints" name="constraints" rows={3} defaultValue={(initial.constraints ?? []).join('\n')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="time_complexity">Time complexity</Label>
                  <Input id="time_complexity" name="time_complexity" defaultValue={initial.time_complexity ?? ''} placeholder="O(n)" />
                </div>
                <div>
                  <Label htmlFor="space_complexity">Space complexity</Label>
                  <Input id="space_complexity" name="space_complexity" defaultValue={initial.space_complexity ?? ''} placeholder="O(1)" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="sort_order">Sort order</Label>
                  <Input id="sort_order" name="sort_order" type="number" defaultValue={initial.sort_order ?? 0} />
                </div>
              </div>
            </div>
          </Section>
          <Section title="Examples & code (JSON)">
            <div className="space-y-4">
              <div>
                <Label htmlFor="examples">Examples (JSON array)</Label>
                <Textarea id="examples" name="examples" rows={4} className="font-mono text-xs" defaultValue={j(initial.examples)} placeholder='[{"input":"[2,7], 9","output":"[0,1]"}]' />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="starter_code">Starter code (JSON: lang → code)</Label>
                  <Textarea id="starter_code" name="starter_code" rows={5} className="font-mono text-xs" defaultValue={j(initial.starter_code)} placeholder='{"python":"def solve():","java":"class Solution {}"}' />
                </div>
                <div>
                  <Label htmlFor="solution_code">Solution code (JSON: lang → code)</Label>
                  <Textarea id="solution_code" name="solution_code" rows={5} className="font-mono text-xs" defaultValue={j(initial.solution_code)} />
                </div>
              </div>
              <div>
                <Label htmlFor="solution_approach">Solution approach</Label>
                <Textarea id="solution_approach" name="solution_approach" rows={3} defaultValue={initial.solution_approach ?? ''} />
              </div>
            </div>
          </Section>
        </>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
        >
          Cancel
        </Link>
        <div className="w-36">
          <SubmitButton pendingLabel="Saving…">{mode === 'create' ? 'Create question' : 'Save changes'}</SubmitButton>
        </div>
      </div>
    </form>
  );
}

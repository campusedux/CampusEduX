'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Label, Input, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createQuestion, deleteQuestion, toggleQuestionActive } from '@/app/placement/actions';

export function QuestionRowActions({ id, categoryKey, isActive }: { id: string; categoryKey: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleQuestionActive(id, categoryKey, !isActive);
            router.refresh();
          })
        }
        className="text-brand hover:underline disabled:opacity-50"
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm('Delete this question?')) return;
          startTransition(async () => {
            await deleteQuestion(id, categoryKey);
            router.refresh();
          });
        }}
        className="text-danger hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}

export function QuestionAddForm({ categoryKey }: { categoryKey: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = () => {
    if (!question.trim()) return setError('Question is required.');
    if (!answer.trim()) return setError('Answer is required.');
    setError(null);
    startTransition(async () => {
      try {
        await createQuestion({ categoryKey, question, answer, sortOrder: 0 });
        setQuestion('');
        setAnswer('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
      <div className="space-y-2">
        <div>
          <Label>Question</Label>
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Tell me about yourself." />
        </div>
        <div>
          <Label>Answer / talking points</Label>
          <Textarea rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button onClick={handleAdd} disabled={isPending}>
          {isPending ? 'Adding…' : 'Add question'}
        </Button>
      </div>
    </div>
  );
}

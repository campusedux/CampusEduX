'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createTestQuestion, deleteTestQuestion, toggleTestQuestionActive } from '@/app/placement/actions';

export function TestQuestionRowActions({ id, categoryKey, isActive }: { id: string; categoryKey: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleTestQuestionActive(id, categoryKey, !isActive);
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
            await deleteTestQuestion(id, categoryKey);
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

interface TestQuestionAddFormProps {
  categoryKey: string;
  /** Topics belonging to this category — shown as a dropdown for categories like Aptitude/Technical. */
  topics: { id: string; label: string }[];
  /** True for the 'company' category, where a free-text company name is used instead of a topic. */
  usesCompanyName?: boolean;
}

export function TestQuestionAddForm({ categoryKey, topics, usesCompanyName }: TestQuestionAddFormProps) {
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'' | 'Easy' | 'Medium' | 'Hard'>('');
  const [topicId, setTopicId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = () => {
    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!questionText.trim()) return setError('Question text is required.');
    if (trimmedOptions.length < 2) return setError('At least 2 options are required.');
    if (correctIndex >= trimmedOptions.length) return setError('Correct answer index is out of range.');
    setError(null);

    startTransition(async () => {
      try {
        await createTestQuestion({
          categoryKey,
          topicId: topicId || null,
          companyName: usesCompanyName ? companyName.trim() || null : null,
          questionText: questionText.trim(),
          options: trimmedOptions,
          correctIndex,
          explanation: explanation.trim() || null,
          difficulty: difficulty || null,
          sortOrder: 0,
        });
        setQuestionText('');
        setOptions(['', '', '', '']);
        setCorrectIndex(0);
        setExplanation('');
        setDifficulty('');
        setTopicId('');
        setCompanyName('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="rounded-lg border border-dashed border-border p-4">
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}

      <Label>Question</Label>
      <Textarea rows={2} value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="What is..." />

      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((opt, i) => (
          <div key={i}>
            <Label>
              Option {i + 1} {i === correctIndex ? '(correct)' : ''}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={opt}
                onChange={(e) => {
                  const next = options.slice();
                  next[i] = e.target.value;
                  setOptions(next);
                }}
              />
              <input
                type="radio"
                name={`correct-${categoryKey}`}
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                title="Mark as correct answer"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <Label>Difficulty</Label>
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
            <option value="">—</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
        </div>
        {topics.length > 0 ? (
          <div>
            <Label>Topic (optional)</Label>
            <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">General pool</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        {usesCompanyName ? (
          <div>
            <Label>Company name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="TCS" />
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <Label>Explanation (optional)</Label>
        <Textarea rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </div>

      <div className="mt-3 flex justify-end">
        <Button onClick={handleAdd} disabled={isPending}>
          {isPending ? 'Adding…' : 'Add Question'}
        </Button>
      </div>
    </div>
  );
}

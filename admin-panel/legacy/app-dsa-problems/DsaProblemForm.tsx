'use client';

import { useState, useTransition } from 'react';
import { Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createDsaProblem } from '@/app/dsa-problems/actions';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function DsaProblemForm({ topics }: { topics: { id: string; label: string }[] }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [hintsInput, setHintsInput] = useState('');
  const [examples, setExamples] = useState([{ input: '', output: '', explanation: '' }]);
  const [solutionExplanation, setSolutionExplanation] = useState('');
  const [solutionCode, setSolutionCode] = useState('');
  const [solutionLanguage, setSolutionLanguage] = useState('javascript');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = () => {
    if (!title.trim()) return setError('Title is required.');
    if (!slug.trim()) return setError('Slug is required.');
    if (!topicId) return setError('Select a topic.');
    if (!description.trim()) return setError('Description is required.');
    setError(null);

    startTransition(async () => {
      try {
        await createDsaProblem({
          topicId,
          title: title.trim(),
          slug: slug.trim(),
          difficulty,
          description: description.trim(),
          examples,
          constraints: constraints.trim() || null,
          hints: hintsInput.split('\n').map((h) => h.trim()).filter(Boolean),
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
          solutionExplanation: solutionExplanation.trim() || null,
          solutionCode: solutionCode.trim() || null,
          solutionLanguage,
        });
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Two Sum" />
        </div>
        <div>
          <Label>Slug</Label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
          />
        </div>
        <div>
          <Label>Topic</Label>
          <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
        </div>

        <div className="col-span-2">
          <Label>Description</Label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="col-span-2">
          <Label>Constraints (optional)</Label>
          <Input value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="2 <= nums.length <= 10^4" />
        </div>

        <div>
          <Label>Tags (comma separated)</Label>
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Array, HashMap" />
        </div>
        <div>
          <Label>Hints (one per line)</Label>
          <Textarea rows={2} value={hintsInput} onChange={(e) => setHintsInput(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Examples</Label>
        {examples.map((ex, i) => (
          <div key={i} className="mb-2 grid grid-cols-3 gap-2 rounded-lg border border-border p-3">
            <div>
              <Label>Input</Label>
              <Input
                value={ex.input}
                onChange={(e) => {
                  const next = examples.slice();
                  next[i] = { ...next[i], input: e.target.value };
                  setExamples(next);
                }}
              />
            </div>
            <div>
              <Label>Output</Label>
              <Input
                value={ex.output}
                onChange={(e) => {
                  const next = examples.slice();
                  next[i] = { ...next[i], output: e.target.value };
                  setExamples(next);
                }}
              />
            </div>
            <div>
              <Label>Explanation</Label>
              <Input
                value={ex.explanation}
                onChange={(e) => {
                  const next = examples.slice();
                  next[i] = { ...next[i], explanation: e.target.value };
                  setExamples(next);
                }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setExamples([...examples, { input: '', output: '', explanation: '' }])}
          className="text-xs font-medium text-brand hover:underline"
        >
          + Add another example
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Solution language</Label>
          <Input value={solutionLanguage} onChange={(e) => setSolutionLanguage(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Solution approach (explanation)</Label>
          <Textarea rows={3} value={solutionExplanation} onChange={(e) => setSolutionExplanation(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Solution code</Label>
          <Textarea rows={6} value={solutionCode} onChange={(e) => setSolutionCode(e.target.value)} className="font-mono text-xs" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : 'Create problem'}
        </Button>
      </div>
    </div>
  );
}

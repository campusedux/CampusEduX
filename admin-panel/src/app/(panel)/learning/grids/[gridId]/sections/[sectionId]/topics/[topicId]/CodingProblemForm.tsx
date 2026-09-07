'use client';

import { Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { CODING_LANGUAGES, CODING_LANGUAGE_LABEL, DIFFICULTIES } from '@/lib/learning/constants';
import { MarkdownEditor } from '@/components/learning/MarkdownEditor';
import type { TopicCodingProblem } from '@/lib/learning/queries';

const j = (v: unknown) => (v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v, null, 2));

/** The shared field set for a topic Coding Problem — used by both the add and
 *  the edit form in PracticeManager. `dsa_problems` extended in place
 *  (migration 0048/025); a "topic coding problem" has `topic_id` NULL. */
export function CodingProblemFields({ p, onDirty }: { p?: TopicCodingProblem; onDirty?: () => void }) {
  const langs = new Set(p?.supported_languages ?? ['java', 'python', 'c', 'cpp']);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px]">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input name="title" required defaultValue={p?.title ?? ''} onChange={onDirty} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            name="slug"
            defaultValue={p?.slug ?? ''}
            onChange={onDirty}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="auto from title"
          />
        </div>
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" defaultValue={p?.difficulty ?? 'Easy'} onChange={onDirty}>
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Problem statement (Markdown)</Label>
        <MarkdownEditor name="description" defaultValue={p?.description ?? ''} onDirty={onDirty ? () => onDirty() : undefined} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="examples">Examples — JSON array of {'{ input, output, explanation? }'}</Label>
          <Textarea
            name="examples"
            rows={4}
            className="font-mono text-xs"
            defaultValue={j(p?.examples)}
            onChange={onDirty}
            placeholder='[{"input":"2 3","output":"5"}]'
          />
        </div>
        <div>
          <Label htmlFor="test_cases">Hidden test cases — JSON array of {'{ input, expected, hidden? }'}</Label>
          <Textarea
            name="test_cases"
            rows={4}
            className="font-mono text-xs"
            defaultValue={j(p?.test_cases)}
            onChange={onDirty}
            placeholder='[{"input":"10 20","expected":"30","hidden":true}]'
          />
        </div>
      </div>

      <div>
        <Label htmlFor="constraints">Constraints (one per line)</Label>
        <Textarea name="constraints" rows={3} defaultValue={(p?.constraints as string[] | undefined)?.join('\n') ?? ''} onChange={onDirty} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="starter_code">Starter code — JSON {'{ lang: code }'}</Label>
          <Textarea
            name="starter_code"
            rows={5}
            className="font-mono text-xs"
            defaultValue={j(p?.starter_code)}
            onChange={onDirty}
            placeholder='{"python":"# your code","java":"public class Main {}"}'
          />
        </div>
        <div>
          <Label htmlFor="solution_code">Solution code — JSON {'{ lang: code }'} (shown in the editorial)</Label>
          <Textarea name="solution_code" rows={5} className="font-mono text-xs" defaultValue={j(p?.solution_code)} onChange={onDirty} />
        </div>
      </div>

      <div>
        <Label htmlFor="hints">Hints (one per line)</Label>
        <Textarea name="hints" rows={3} defaultValue={(p?.hints as string[] | undefined)?.join('\n') ?? ''} onChange={onDirty} />
      </div>

      <div>
        <Label htmlFor="solution_approach">Solution approach (short explanation)</Label>
        <Textarea name="solution_approach" rows={2} defaultValue={p?.solution_approach ?? ''} onChange={onDirty} />
      </div>
      <div>
        <Label htmlFor="editorial">Editorial (Markdown, shown when allowed)</Label>
        <MarkdownEditor name="editorial" defaultValue={p?.editorial ?? ''} onDirty={onDirty ? () => onDirty() : undefined} />
      </div>

      <div>
        <Label htmlFor="supported_languages">Languages the student can attempt in</Label>
        <div className="mt-1 flex flex-wrap gap-3">
          {CODING_LANGUAGES.map((l) => (
            <label key={l} className="flex items-center gap-1.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                name="supported_languages"
                value={l}
                defaultChecked={langs.has(l)}
                onChange={onDirty}
                className="h-4 w-4 rounded border-border text-brand"
              />
              {CODING_LANGUAGE_LABEL[l]}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[130px_1fr_1fr]">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={p?.status ?? 'draft'} onChange={onDirty}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_website" defaultChecked={p?.show_on_website ?? true} onChange={onDirty} className="h-4 w-4 rounded border-border text-brand" />
          Show on Website
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_mobile" defaultChecked={p?.show_on_mobile ?? true} onChange={onDirty} className="h-4 w-4 rounded border-border text-brand" />
          Show on Mobile
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" name="is_premium" defaultChecked={p?.is_premium ?? false} onChange={onDirty} className="h-4 w-4 rounded border-border text-brand" />
        Premium only
      </label>
    </>
  );
}

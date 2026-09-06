'use client';

import { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Code2,
  Link2,
  Quote,
  Table,
  Eye,
  Pencil,
} from 'lucide-react';
import { MarkdownPreview } from '@/components/learning/MarkdownPreview';
import { cn } from '@/lib/utils';

type Wrap = { before: string; after?: string; block?: boolean; placeholder?: string };

const TOOLS: { icon: typeof Bold; label: string; wrap: Wrap }[] = [
  { icon: Bold, label: 'Bold', wrap: { before: '**', after: '**', placeholder: 'bold text' } },
  { icon: Italic, label: 'Italic', wrap: { before: '_', after: '_', placeholder: 'italic text' } },
  { icon: Heading2, label: 'Heading', wrap: { before: '## ', block: true, placeholder: 'Heading' } },
  { icon: Heading3, label: 'Sub-heading', wrap: { before: '### ', block: true, placeholder: 'Sub-heading' } },
  { icon: List, label: 'Bullet list', wrap: { before: '- ', block: true, placeholder: 'list item' } },
  { icon: ListOrdered, label: 'Numbered list', wrap: { before: '1. ', block: true, placeholder: 'list item' } },
  { icon: Code, label: 'Inline code', wrap: { before: '`', after: '`', placeholder: 'code' } },
  {
    icon: Code2,
    label: 'Code block',
    wrap: { before: '```\n', after: '\n```', block: true, placeholder: 'code' },
  },
  { icon: Link2, label: 'Link', wrap: { before: '[', after: '](https://)', placeholder: 'link text' } },
  { icon: Quote, label: 'Quote', wrap: { before: '> ', block: true, placeholder: 'quotation' } },
  {
    icon: Table,
    label: 'Table',
    wrap: {
      before: '| Column A | Column B |\n| --- | --- |\n| a1 | b1 |\n| a2 | b2 |\n',
      block: true,
    },
  },
];

/**
 * Markdown authoring textarea with an insert toolbar and a Write / Preview
 * toggle. Emits a plain <textarea name={name}> so it drops straight into a
 * <form action={serverAction}>. `onDirty` lets the parent show an unsaved
 * warning.
 */
export function MarkdownEditor({
  name,
  defaultValue = '',
  disabled,
  minRows = 12,
  onDirty,
}: {
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  minRows?: number;
  onDirty?: (dirty: boolean) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  const update = (next: string) => {
    setValue(next);
    onDirty?.(next !== defaultValue);
  };

  const insert = (w: Wrap) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || w.placeholder || '';
    let insertText = `${w.before}${selected}${w.after ?? ''}`;
    let prefix = value.slice(0, start);
    if (w.block && prefix && !prefix.endsWith('\n\n')) {
      insertText = (prefix.endsWith('\n') ? '\n' : '\n\n') + insertText;
    }
    const next = prefix + insertText + value.slice(end);
    update(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = prefix.length + insertText.length - (w.after?.length ?? 0);
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-subtle/50 p-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            disabled={disabled || mode === 'preview'}
            onClick={() => insert(t.wrap)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-white hover:text-ink disabled:opacity-40"
          >
            <t.icon size={15} />
          </button>
        ))}
        <div className="ml-auto flex overflow-hidden rounded-md border border-border">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={cn('inline-flex h-8 items-center gap-1 px-2.5 text-xs font-medium', mode === 'write' ? 'bg-brand text-white' : 'bg-white text-ink-muted')}
          >
            <Pencil size={13} /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={cn('inline-flex h-8 items-center gap-1 px-2.5 text-xs font-medium', mode === 'preview' ? 'bg-brand text-white' : 'bg-white text-ink-muted')}
          >
            <Eye size={13} /> Preview
          </button>
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          ref={ref}
          name={name}
          value={value}
          disabled={disabled}
          onChange={(e) => update(e.target.value)}
          rows={minRows}
          spellCheck
          className="block w-full resize-y rounded-b-lg border-0 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-0"
          placeholder="Write in Markdown — # headings, **bold**, - lists, ```code```, tables…"
        />
      ) : (
        <>
          <input type="hidden" name={name} value={value} />
          <div className="max-h-[520px] overflow-y-auto p-4 text-sm">
            {value.trim() ? (
              <MarkdownPreview source={value} />
            ) : (
              <p className="text-ink-faint">Nothing to preview yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

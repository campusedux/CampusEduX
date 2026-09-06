"use client";

import { Plus, Trash2 } from "lucide-react";
import { Field, Input } from "@/components/ui";
import { emptyLink, type ResumeLink } from "@/lib/resumeBuilder/content";

/** Label + URL rows — coding profiles, portfolio / social links. */
export default function LinkListEditor({ links, onChange }: { links: ResumeLink[]; onChange: (links: ResumeLink[]) => void }) {
  const list = links.length > 0 ? links : [emptyLink()];

  function patch(id: string, changes: Partial<ResumeLink>) {
    onChange(list.map((l) => (l.id === id ? { ...l, ...changes } : l)));
  }

  return (
    <div className="space-y-3">
      {list.map((link) => (
        <div key={link.id} className="flex items-start gap-3 rounded-2xl border border-line p-3">
          <Field label="Label" htmlFor={`l-label-${link.id}`} className="w-40 flex-shrink-0">
            <Input id={`l-label-${link.id}`} value={link.label} onChange={(e) => patch(link.id, { label: e.target.value })} placeholder="LeetCode" />
          </Field>
          <Field label="URL" htmlFor={`l-url-${link.id}`} className="flex-1">
            <Input id={`l-url-${link.id}`} value={link.url} onChange={(e) => patch(link.id, { url: e.target.value })} placeholder="leetcode.com/u/…" />
          </Field>
          <button
            type="button"
            aria-label="Remove link"
            onClick={() => {
              const next = list.filter((l) => l.id !== link.id);
              onChange(next.length > 0 ? next : [emptyLink()]);
            }}
            className="mt-6 rounded p-1.5 text-ink-faint hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, emptyLink()])} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <Plus className="h-4 w-4" /> Add link
      </button>
    </div>
  );
}

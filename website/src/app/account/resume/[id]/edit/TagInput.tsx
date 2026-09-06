"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui";

/** Chip input — Enter or the + button adds; ✕ removes. Shared by the skills and per-entry tag editors. */
export function TagInput({
  tags,
  onChange,
  placeholder = "Add and press Enter",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");

  function add() {
    const value = text.trim();
    if (value && !tags.includes(value)) onChange([...tags, value]);
    setText("");
  }
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !text && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-0.5 text-sm text-ink-muted">
              {tag}
              <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} />
        <button type="button" onClick={add} aria-label="Add" className="rounded-xl border border-line p-2.5 text-primary hover:bg-primary-50">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default TagInput;

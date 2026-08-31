'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function AuditDiff({ oldValue, newValue }: { oldValue: unknown; newValue: unknown }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
      >
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {isOpen ? 'Hide details' : 'View details'}
      </button>
      {isOpen ? (
        <div className="mt-2 grid grid-cols-2 gap-3">
          {oldValue ? (
            <div>
              <p className="mb-1 text-xs font-medium text-ink-faint">Before</p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-surface-subtle p-2.5 text-xs text-ink-muted">
                {JSON.stringify(oldValue, null, 2)}
              </pre>
            </div>
          ) : null}
          {newValue ? (
            <div>
              <p className="mb-1 text-xs font-medium text-ink-faint">After</p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-surface-subtle p-2.5 text-xs text-ink-muted">
                {JSON.stringify(newValue, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

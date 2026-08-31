'use client';

import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

/**
 * Client-side CSV export. Builds a Blob from `rows` and triggers a download —
 * used by the "Export Report" buttons. (Runs in the user's own browser, so a
 * blob download is fine here — unlike inside a sandboxed artifact.)
 */
export function ExportButton({
  rows,
  filename,
  label = 'Export CSV',
}: {
  rows: Record<string, unknown>[];
  filename: string;
  label?: string;
}) {
  const { toast } = useToast();

  const run = () => {
    if (!rows.length) {
      toast({ title: 'Nothing to export', variant: 'info' });
      return;
    }
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={run}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
    >
      <Download size={16} /> {label}
    </button>
  );
}

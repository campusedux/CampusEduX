'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Loader2, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { logReport } from './actions';

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

function download(name: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportExport({
  kind,
  rows,
  params,
}: {
  kind: string;
  rows: Record<string, unknown>[];
  params: Record<string, unknown>;
}) {
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const run = () =>
    start(async () => {
      if (format === 'pdf') {
        window.print();
        await logReport(kind, params, rows.length, 'pdf');
        router.refresh();
        return;
      }
      if (!rows.length) {
        toast({ title: 'Nothing to export for this range', variant: 'info' });
        return;
      }
      const csv = toCsv(rows);
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'excel') download(`${kind}-report-${stamp}.xls`, csv, 'application/vnd.ms-excel');
      else download(`${kind}-report-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
      await logReport(kind, params, rows.length, format);
      toast({ title: `Exported ${rows.length} rows`, variant: 'success' });
      router.refresh();
    });

  return (
    <div className="flex items-center gap-2">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as any)}
        className="h-10 rounded-lg border border-border bg-white px-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
      >
        <option value="csv">CSV</option>
        <option value="excel">Excel</option>
        <option value="pdf">PDF (print)</option>
      </select>
      <button
        onClick={run}
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : format === 'pdf' ? <Printer size={16} /> : <Download size={16} />}
        Export Report
      </button>
    </div>
  );
}

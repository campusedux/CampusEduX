'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Loader2 } from 'lucide-react';
import { Card, CardHeader, Label, Select, Input } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { buildPlacementReport, logPlacementReport } from '../actions';

const KINDS = [
  { value: 'attempts', label: 'Test attempts' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'questions', label: 'Question bank' },
];

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportGenerator({ canGenerate }: { canGenerate: boolean }) {
  const [kind, setKind] = useState('attempts');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const run = () =>
    start(async () => {
      const res = await buildPlacementReport(kind, from, to);
      if (!res.ok || !res.rows) {
        toast({ title: 'Could not generate', description: res.error, variant: 'error' });
        return;
      }
      if (res.rows.length === 0) {
        toast({ title: 'No data for that range', variant: 'info' });
        return;
      }
      download(`placement-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(res.rows));
      await logPlacementReport(kind, { from, to }, res.rows.length);
      toast({ title: `Exported ${res.rows.length} rows`, variant: 'success' });
      router.refresh();
    });

  return (
    <Card>
      <CardHeader title="Generate report" description="Downloads a CSV and adds an entry to the history below." />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="kind">Type</Label>
          <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button
          onClick={run}
          disabled={!canGenerate || pending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Generate Report
        </button>
      </div>
    </Card>
  );
}

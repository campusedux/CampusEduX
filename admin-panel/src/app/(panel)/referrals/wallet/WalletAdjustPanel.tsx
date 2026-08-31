'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { Card, CardHeader, Label, Input, Select } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { searchStudents, adjustPlatformWallet } from '../actions';

type Result = { ok: boolean; error?: string };
type Student = { id: string; full_name: string; email: string };

export function WalletAdjustPanel() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [picked, setPicked] = useState<Student | null>(null);
  const [searching, startSearch] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  // debounce search
  useEffect(() => {
    if (picked || q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      startSearch(async () => setResults(await searchStudents(q)));
    }, 250);
    return () => clearTimeout(t);
  }, [q, picked]);

  return (
    <Card>
      <CardHeader title="Adjust a student’s wallet" description="Add / deduct — writes a real wallet_transactions row via the atomic RPC." />
      {picked ? (
        <AdjustForm student={picked} onClear={() => setPicked(null)} toast={toast} refresh={() => router.refresh()} />
      ) : (
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student by name or email…" className="pl-9" />
          {searching ? <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-faint" /> : null}
          {results.length > 0 ? (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-white shadow-lg">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      setPicked(s);
                      setQ('');
                    }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-surface-subtle"
                  >
                    <span className="font-medium text-ink">{s.full_name || 'Unnamed'}</span>
                    <span className="text-xs text-ink-faint">{s.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function AdjustForm({
  student,
  onClear,
  toast,
  refresh,
}: {
  student: Student;
  onClear: () => void;
  toast: (t: { title: string; description?: string; variant?: 'success' | 'error' | 'info' }) => void;
  refresh: () => void;
}) {
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  const onSubmit = (fd: FormData) =>
    start(async () => {
      fd.set('user_id', student.id);
      const res: Result = await adjustPlatformWallet({ ok: false }, fd);
      if (!res.ok) toast({ title: 'Adjustment failed', description: res.error, variant: 'error' });
      else {
        toast({ title: 'Wallet updated', variant: 'success' });
        ref.current?.reset();
        refresh();
      }
    });

  return (
    <form ref={ref} action={onSubmit} className="space-y-3">
      <div className="flex items-center justify-between rounded-lg bg-surface-subtle px-3 py-2 text-sm">
        <span>
          <span className="font-medium text-ink">{student.full_name || 'Unnamed'}</span>
          <span className="ml-2 text-ink-faint">{student.email}</span>
        </span>
        <button type="button" onClick={onClear} className="text-xs font-medium text-brand hover:underline">
          Change
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[120px_1fr_1.5fr_auto] sm:items-end">
        <div>
          <Label htmlFor="mode">Action</Label>
          <Select id="mode" name="mode" defaultValue="credit">
            <option value="credit">Add</option>
            <option value="debit">Deduct</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" name="amount" type="number" min="1" step="0.01" required />
        </div>
        <div>
          <Label htmlFor="description">Note</Label>
          <Input id="description" name="description" placeholder="Reason" />
        </div>
        <div className="w-28">
          <SubmitButton pendingLabel="…">{pending ? 'Applying…' : 'Apply'}</SubmitButton>
        </div>
      </div>
    </form>
  );
}

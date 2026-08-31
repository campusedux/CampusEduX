'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Label, Input, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { adjustWallet } from '@/app/referrals/actions';

export function WalletAdjustForm() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);
    setSuccess(null);
    const parsedAmount = Number(amount);
    if (!userEmail.trim()) return setError('Enter the user\u2019s email.');
    if (!parsedAmount || parsedAmount <= 0) return setError('Enter an amount greater than zero.');

    startTransition(async () => {
      try {
        await adjustWallet({ userEmail: userEmail.trim(), amount: parsedAmount, direction, description });
        setSuccess(`Wallet ${direction === 'credit' ? 'credited' : 'debited'} \u20b9${parsedAmount} for ${userEmail}.`);
        setUserEmail('');
        setAmount('');
        setDescription('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      {success ? <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{success}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>User email</Label>
          <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="student@example.com" />
        </div>
        <div>
          <Label>Amount (\u20b9)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="250" />
        </div>
        <div>
          <Label>Direction</Label>
          <Select value={direction} onChange={(e) => setDirection(e.target.value as 'credit' | 'debit')}>
            <option value="credit">Credit (add money)</option>
            <option value="debit">Debit (deduct money)</option>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Reason (shown in the ledger)</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Manual correction for..." />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Saving\u2026' : 'Apply adjustment'}
      </Button>
      <p className="text-xs text-ink-faint">
        This inserts a new ledger entry — it never edits or deletes past transactions, so every rupee stays traceable.
      </p>
    </div>
  );
}

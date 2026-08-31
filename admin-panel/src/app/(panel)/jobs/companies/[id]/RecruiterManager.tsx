'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import { createRecruiter, deleteRecruiter } from '../../actions';

type Result = { ok: boolean; error?: string };
interface Recruiter {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  about: string;
}

export function RecruiterManager({
  companyId,
  recruiters,
  canEdit,
}: {
  companyId: string;
  recruiters: Recruiter[];
  canEdit: boolean;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title={`Recruiters (${recruiters.length})`} />
        {recruiters.length === 0 ? (
          <EmptyState title="No recruiters yet" />
        ) : (
          <ul className="divide-y divide-border">
            {recruiters.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {r.name} {r.title ? <span className="font-normal text-ink-muted">· {r.title}</span> : null}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {[r.email, r.phone, r.location].filter(Boolean).join(' · ') || 'No contact details'}
                  </p>
                  {r.about ? <p className="mt-1 text-sm text-ink-muted">{r.about}</p> : null}
                </div>
                {canEdit ? (
                  <DeleteButton action={() => deleteRecruiter(companyId, r.id)} confirmMessage={`Remove ${r.name}?`} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canEdit ? <AddRecruiter companyId={companyId} /> : null}
    </div>
  );
}

function AddRecruiter({ companyId }: { companyId: string }) {
  const [state, action] = useFormState(createRecruiter.bind(null, companyId), { ok: false } as Result);
  const { toast } = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not add', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Recruiter added', variant: 'success' });
      ref.current?.reset();
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <Card>
      <CardHeader title="Add recruiter" />
      <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Talent Acquisition" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" />
        </div>
        <div className="flex items-end">
          <div className="w-28">
            <SubmitButton pendingLabel="…">Add</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';

type Result = { ok: boolean; error?: string };
type Msg = { id: string; sender_role: string; body: string; created_at: string };

export function MessageThread({
  action,
  messages,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  messages: Msg[];
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not send', description: state.error, variant: 'error' });
    else if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <p className="text-sm text-ink-faint">No messages with the student yet.</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.sender_role === 'admin'
                  ? 'ml-auto bg-brand-light text-brand-dark'
                  : 'bg-surface-subtle text-ink'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-[11px] text-ink-faint">
                {m.sender_role === 'admin' ? 'Team' : 'Student'} · {formatDateTime(m.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="space-y-2">
        <Textarea name="body" rows={2} placeholder="Reply to the student…" required />
        <div className="flex justify-end">
          <div className="w-28">
            <SubmitButton pendingLabel="…">Send</SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}

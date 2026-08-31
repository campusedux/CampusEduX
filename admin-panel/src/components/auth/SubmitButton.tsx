'use client';

import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';

export function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(
        'inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white',
        'transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {pending ? pendingLabel ?? 'Please wait…' : children}
    </button>
  );
}

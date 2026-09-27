'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: Variant;
  action?: { label: string; onClick: () => void };
}

const ToastCtx = createContext<{
  toast: (t: { title: string; description?: string; variant?: Variant; action?: Toast['action']; durationMs?: number }) => void;
} | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    ({ title, description, variant = 'info', action, durationMs = 5000 }: { title: string; description?: string; variant?: Variant; action?: Toast['action']; durationMs?: number }) => {
      const id = ++seq;
      setToasts((ts) => [...ts, { id, title, description, variant, action }]);
      setTimeout(() => remove(id), durationMs);
    },
    [remove],
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = t.variant === 'success' ? CheckCircle2 : t.variant === 'error' ? XCircle : Info;
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border bg-white p-3 shadow-lg',
                t.variant === 'success' && 'border-success/30',
                t.variant === 'error' && 'border-danger/30',
                t.variant === 'info' && 'border-border',
              )}
            >
              <Icon
                size={18}
                className={cn(
                  'mt-0.5 flex-shrink-0',
                  t.variant === 'success' && 'text-success',
                  t.variant === 'error' && 'text-danger',
                  t.variant === 'info' && 'text-brand',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{t.title}</p>
                {t.description ? <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p> : null}
                {t.action ? (
                  <button
                    onClick={() => {
                      remove(t.id);
                      t.action!.onClick();
                    }}
                    className="mt-1.5 text-sm font-medium text-brand hover:underline"
                  >
                    {t.action.label}
                  </button>
                ) : null}
              </div>
              <button onClick={() => remove(t.id)} className="text-ink-faint hover:text-ink" aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

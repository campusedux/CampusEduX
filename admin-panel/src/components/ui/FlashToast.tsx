'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';

/**
 * Fires a one-off toast on mount — used to acknowledge a redirect after a
 * successful Server Action (e.g. `?saved=1`). Render it on the destination page.
 */
export function FlashToast({
  title,
  description,
  variant = 'success',
}: {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'info';
}) {
  const { toast } = useToast();
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    toast({ title, description, variant });
  }, [title, description, variant, toast]);
  return null;
}

'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { retryWebsiteRefresh } from '@/app/(panel)/learning/site-sync-actions';

type MaybeSynced = { ok?: boolean; error?: string; warning?: string; retryTags?: string[] } | null | undefined;

/**
 * Shows the "saved, but the website cache was not refreshed" warning (with a
 * Retry button) when a Learning Server Action returned `ok: true` + `warning`.
 * Returns true when a warning was shown. The data is already saved either way.
 * No secret is involved client-side: Retry calls a Server Action, which does the
 * authenticated request to the website on the server.
 */
export function useSiteNotice() {
  const { toast } = useToast();

  return useCallback(
    function notify(res: MaybeSynced): boolean {
      if (!res?.ok || !res.warning) return false;
      const tags = res.retryTags ?? [];
      toast({
        title: 'Saved — website not refreshed',
        description: res.warning,
        variant: 'info',
        durationMs: 15000,
        action: tags.length
          ? {
              label: 'Retry refresh',
              onClick: async () => {
                const r = await retryWebsiteRefresh(tags).catch(() => null);
                if (r?.ok && !r.warning) toast({ title: 'Website cache refreshed', variant: 'success' });
                else notify({ ok: true, warning: r?.warning ?? r?.error ?? 'Retry failed.', retryTags: r?.retryTags ?? tags });
              },
            }
          : undefined,
      });
      return true;
    },
    [toast],
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleFeatureFlag, updateFeatureFlagRollout } from '@/app/settings/actions';

interface Flag {
  key: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
}

export function FeatureFlagRow({ flag }: { flag: Flag }) {
  const router = useRouter();
  const [rollout, setRollout] = useState(flag.rollout_percentage);
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{flag.key}</p>
        {flag.description ? <p className="text-xs text-ink-faint">{flag.description}</p> : null}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={rollout}
            disabled={!flag.is_enabled || isPending}
            onChange={(e) => setRollout(Number(e.target.value))}
            onMouseUp={() =>
              startTransition(async () => {
                await updateFeatureFlagRollout(flag.key, rollout);
                router.refresh();
              })
            }
            className="w-28"
          />
          <span className="w-10 text-right text-xs text-ink-muted">{rollout}%</span>
        </div>
        <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={flag.is_enabled}
            disabled={isPending}
            onChange={(e) =>
              startTransition(async () => {
                await toggleFeatureFlag(flag.key, e.target.checked);
                router.refresh();
              })
            }
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-border transition-colors peer-checked:bg-brand" />
          <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>
    </li>
  );
}

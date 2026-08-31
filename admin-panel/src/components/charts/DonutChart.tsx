'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import type { DonutChartImpl } from './DonutChartImpl';

export type { DonutSlice } from './DonutChartImpl';

/**
 * Recharts is heavy (~90 KB gzip). This wrapper keeps it out of every
 * analytics page's initial bundle — the chart chunk is fetched on the client
 * only when a <DonutChart> actually mounts, with a skeleton in the meantime.
 */
const LazyDonut = dynamic(() => import('./DonutChartImpl').then((m) => m.DonutChartImpl), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export function DonutChart(props: ComponentProps<typeof DonutChartImpl>) {
  return <LazyDonut {...props} />;
}

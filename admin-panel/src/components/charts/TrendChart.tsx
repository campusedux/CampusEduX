'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import type { TrendChartImpl } from './TrendChartImpl';

export type { TrendSeries } from './TrendChartImpl';

/**
 * Lazy wrapper around the recharts line/area chart — see DonutChart.tsx for the
 * rationale. The recharts chunk loads on the client only when the chart mounts.
 */
const LazyTrend = dynamic(() => import('./TrendChartImpl').then((m) => m.TrendChartImpl), {
  ssr: false,
  loading: () => <ChartSkeleton height={280} />,
});

export function TrendChart(props: ComponentProps<typeof TrendChartImpl>) {
  return <LazyTrend {...props} />;
}

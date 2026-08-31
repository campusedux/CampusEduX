'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatNumber } from '@/lib/utils';

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

const PALETTE = ['#4F39F6', '#16A34A', '#E8A93A', '#2563EB', '#DC2626', '#7C3AED', '#0EA5E9', '#F97316'];

/**
 * Donut + side legend (coloured dot + label + value), matching the spec's
 * "Orders by Status" / "Top Categories" / "Payment Method Distribution" panels.
 */
export function DonutChartImpl({
  data,
  height = 240,
  valueFormatter = formatNumber,
  centerLabel,
}: {
  data: DonutSlice[];
  height?: number;
  valueFormatter?: (n: number) => string;
  centerLabel?: string;
}) {
  const slices = data.map((d, i) => ({ ...d, color: d.color ?? PALETTE[i % PALETTE.length] }));
  const total = slices.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-ink-faint" style={{ minHeight: height }}>
        No data yet
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((s) => (
                <Cell key={s.label} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [valueFormatter(value), name]}
              contentStyle={{ borderRadius: 10, borderColor: '#E7E8EF', fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-ink">{valueFormatter(total)}</span>
          <span className="text-xs text-ink-faint">{centerLabel ?? 'Total'}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-medium text-ink">
              {valueFormatter(s.value)}
              <span className="ml-1 text-xs text-ink-faint">
                {total ? `${Math.round((s.value / total) * 100)}%` : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

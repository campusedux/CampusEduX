'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface TrendSeries {
  key: string;
  label: string;
  color?: string;
}

const PALETTE = ['#4F39F6', '#16A34A', '#E8A93A', '#2563EB', '#DC2626', '#7C3AED'];

/**
 * Line/area trend chart used for every "…over time" panel. `data` is an array
 * of points keyed by `xKey`; each series in `series` is one line.
 */
export function TrendChartImpl({
  data,
  xKey = 'label',
  series,
  height = 280,
  area = true,
  currency = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  xKey?: string;
  series: TrendSeries[];
  height?: number;
  area?: boolean;
  currency?: boolean;
}) {
  const fmt = (v: number) => (currency ? `₹${Number(v).toLocaleString('en-IN')}` : Number(v).toLocaleString('en-IN'));
  const Chart = area ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? PALETTE[i % PALETTE.length]} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color ?? PALETTE[i % PALETTE.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7E8EF" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#9497AC' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#9497AC' }}
          axisLine={false}
          tickLine={false}
          width={currency ? 64 : 40}
          tickFormatter={(v) => (currency ? `₹${Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : v}` : String(v))}
        />
        <Tooltip
          formatter={(value: number, name: string) => [fmt(value), name]}
          contentStyle={{ borderRadius: 10, borderColor: '#E7E8EF', fontSize: 13 }}
        />
        {series.length > 1 ? <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} /> : null}
        {series.map((s, i) => {
          const color = s.color ?? PALETTE[i % PALETTE.length];
          return area ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
            />
          ) : (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={color} strokeWidth={2} dot={false} />
          );
        })}
      </Chart>
    </ResponsiveContainer>
  );
}

'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface RevenuePoint {
  date: string;
  revenue: number;
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B5BF6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#5B5BF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E9EAF2" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9497AC' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#9497AC' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v}`}
        />
        <Tooltip
          formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
          contentStyle={{ borderRadius: 10, borderColor: '#E9EAF2', fontSize: 13 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#5B5BF6" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const gradeBoundaryData = [
  { year: "2023", "A*": 81.5, A: 73.1, B: 63.0 },
  { year: "2024", "A*": 83.0, A: 74.9, B: 64.5 },
  { year: "2025", "A*": 85.7, A: 78.2, B: 67.8 },
  { year: "2026 (Predicted)", "A*": 87.8, A: 80.8, B: 70.2 },
];

export const GradeBoundariesTool: React.FC = () => {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">Grade Boundaries</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Edexcel A Level Economics (9EC0) • Percentage of max UMS (335)
        </p>
      </div>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={gradeBoundaryData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickLine={false}
            />
            <YAxis
              domain={[55, 95]}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [`${value}%`, undefined]}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="A*"
              stroke="hsl(var(--chart-1, 262 83% 58%))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'hsl(var(--chart-1, 262 83% 58%))' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="A"
              stroke="hsl(var(--chart-2, 173 58% 39%))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'hsl(var(--chart-2, 173 58% 39%))' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="B"
              stroke="hsl(var(--chart-3, 197 37% 24%))"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'hsl(var(--chart-3, 197 37% 24%))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground text-center italic">
        2026 values are predicted using linear trend analysis from 2023–2025 data
      </p>
    </div>
  );
};

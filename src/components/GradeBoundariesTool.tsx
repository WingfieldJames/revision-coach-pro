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

// Actual data (solid lines)
const actualData = [
  { year: "2023", "A*": 81.5, A: 73.1, B: 63.0 },
  { year: "2024", "A*": 83.0, A: 74.9, B: 64.5 },
  { year: "2025", "A*": 85.7, A: 78.2, B: 67.8 },
];

// Predicted data (dotted lines) – starts from last actual point for continuity
const predictedData = [
  { year: "2025", "A*": 85.7, A: 78.2, B: 67.8 },
  { year: "2026 (Predicted)", "A*": 87.8, A: 80.8, B: 70.2 },
];

const COLORS = {
  "A*": "#1e3a8a",  // navy
  A: "#6d28d9",     // purple
  B: "#a855f7",     // light purple
};

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
          <LineChart margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickLine={false}
              allowDuplicatedCategory={false}
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
            {/* Solid lines for actual data */}
            {(["A*", "A", "B"] as const).map((grade) => (
              <Line
                key={grade}
                data={actualData}
                type="monotone"
                dataKey={grade}
                stroke={COLORS[grade]}
                strokeWidth={2.5}
                dot={{ r: 4, fill: COLORS[grade] }}
                activeDot={{ r: 6 }}
              />
            ))}
            {/* Dotted lines for predicted data */}
            {(["A*", "A", "B"] as const).map((grade) => (
              <Line
                key={`${grade}-predicted`}
                data={predictedData}
                type="monotone"
                dataKey={grade}
                stroke={COLORS[grade]}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 4, fill: COLORS[grade], strokeDasharray: '' }}
                activeDot={{ r: 6 }}
                legendType="none"
                name={` `}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground text-center italic">
        2026 values are predicted (dotted line) using linear trend analysis from 2023–2025 data
      </p>
    </div>
  );
};

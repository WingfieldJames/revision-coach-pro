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

type GradeBoundarySubject = 'economics' | 'maths';

interface SubjectConfig {
  label: string;
  code: string;
  maxUms: number;
  actualData: Record<string, string | number>[];
  predictedData: Record<string, string | number>[];
  yDomain: [number, number];
}

const SUBJECT_CONFIGS: Record<GradeBoundarySubject, SubjectConfig> = {
  economics: {
    label: 'Edexcel A Level Economics',
    code: '9EC0',
    maxUms: 335,
    actualData: [
      { year: "2023", "A*": 81.5, A: 73.1, B: 63.0 },
      { year: "2024", "A*": 83.0, A: 74.9, B: 64.5 },
      { year: "2025", "A*": 85.7, A: 78.2, B: 67.8 },
    ],
    predictedData: [
      { year: "2025", "A*": 85.7, A: 78.2, B: 67.8 },
      { year: "2026 (Predicted)", "A*": 87.8, A: 80.8, B: 70.2 },
    ],
    yDomain: [55, 95],
  },
  maths: {
    label: 'Edexcel A Level Mathematics',
    code: '9MA0',
    maxUms: 300,
    actualData: [
      { year: "2023", "A*": 81.3, A: 65.3, B: 52.7 },
      { year: "2024", "A*": 83.7, A: 68.3, B: 55.7 },
      { year: "2025", "A*": 86.0, A: 71.3, B: 59.3 },
    ],
    predictedData: [
      { year: "2025", "A*": 86.0, A: 71.3, B: 59.3 },
      { year: "2026 (Predicted)", "A*": 88.4, A: 74.3, B: 62.6 },
    ],
    yDomain: [45, 95],
  },
};

const COLORS = {
  "A*": "#1e3a8a",
  A: "#6d28d9",
  B: "#a855f7",
};

interface GradeBoundariesToolProps {
  subject?: GradeBoundarySubject;
}

export const GradeBoundariesTool: React.FC<GradeBoundariesToolProps> = ({ subject = 'economics' }) => {
  const config = SUBJECT_CONFIGS[subject];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">Grade Boundaries</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {config.label} ({config.code}) • Percentage of max UMS ({config.maxUms})
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
              domain={config.yDomain}
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
              payload={[
                { value: 'A*', type: 'circle', color: COLORS['A*'] },
                { value: 'A', type: 'circle', color: COLORS['A'] },
                { value: 'B', type: 'circle', color: COLORS['B'] },
              ]}
            />
            {(["A*", "A", "B"] as const).map((grade) => (
              <Line
                key={grade}
                data={config.actualData}
                type="monotone"
                dataKey={grade}
                stroke={COLORS[grade]}
                strokeWidth={2.5}
                dot={{ r: 4, fill: COLORS[grade] }}
                activeDot={{ r: 6 }}
              />
            ))}
            {(["A*", "A", "B"] as const).map((grade) => (
              <Line
                key={`${grade}-predicted`}
                data={config.predictedData}
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

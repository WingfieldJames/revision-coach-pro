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

interface GradeBoundariesData {
  [year: string]: { [grade: string]: number };
}

interface GradeBoundariesToolProps {
  /** DB-driven grade boundaries data from trainer_projects */
  gradeBoundariesData?: GradeBoundariesData | null;
  /** Subject label for display */
  subjectLabel?: string;
}

const COLORS: Record<string, string> = {
  "A*": "#1e3a8a",
  A: "#6d28d9",
  B: "#a855f7",
};

function computePredicted2026(data: GradeBoundariesData): Record<string, number> | null {
  const years = ['2023', '2024', '2025'];
  const grades = ['A*', 'A', 'B'];
  const predicted: Record<string, number> = {};
  let hasAny = false;

  for (const grade of grades) {
    const vals = years.map(yr => data[yr]?.[grade]).filter((v): v is number => typeof v === 'number' && !isNaN(v));
    if (vals.length >= 2) {
      // Linear regression
      const n = vals.length;
      const xs = vals.map((_, i) => i);
      const avgX = xs.reduce((a, b) => a + b, 0) / n;
      const avgY = vals.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) {
        num += (xs[i] - avgX) * (vals[i] - avgY);
        den += (xs[i] - avgX) ** 2;
      }
      const slope = den !== 0 ? num / den : 0;
      const predict = avgY + slope * (n - avgX);
      predicted[grade] = Math.round(predict * 10) / 10;
      hasAny = true;
    }
  }
  return hasAny ? predicted : null;
}

export const GradeBoundariesTool: React.FC<GradeBoundariesToolProps> = ({ gradeBoundariesData, subjectLabel }) => {
  // If no data provided, don't render anything
  if (!gradeBoundariesData) return null;

  const years = ['2023', '2024', '2025'];
  // Check if we have any actual data
  const hasData = years.some(yr => {
    const yrData = gradeBoundariesData[yr];
    return yrData && Object.values(yrData).some(v => typeof v === 'number' && !isNaN(v) && v > 0);
  });
  if (!hasData) return null;

  const predicted = computePredicted2026(gradeBoundariesData);

  const actualData = years
    .filter(yr => gradeBoundariesData[yr])
    .map(yr => ({
      year: yr,
      ...gradeBoundariesData[yr],
    }));

  const predictedData = predicted && actualData.length > 0
    ? [
        actualData[actualData.length - 1], // bridge from last actual year
        { year: "2026 (Predicted)", ...predicted },
      ]
    : [];

  // Calculate Y domain
  const allVals = [...actualData, ...predictedData]
    .flatMap(d => ['A*', 'A', 'B'].map(g => (d as any)[g]).filter((v): v is number => typeof v === 'number'));
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const yDomain: [number, number] = [Math.floor(minVal - 5), Math.ceil(maxVal + 5)];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">Grade Boundaries</h3>
        {subjectLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{subjectLabel} • Percentage thresholds</p>
        )}
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
              domain={yDomain}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                const seen = new Set<string>();
                const items: { grade: string; value: number; color: string }[] = [];
                for (const entry of payload) {
                  const grade = entry.name === ' ' ? entry.dataKey : entry.name;
                  if (grade && !seen.has(grade) && entry.value != null) {
                    seen.add(grade);
                    items.push({ grade, value: entry.value, color: entry.stroke || entry.color });
                  }
                }
                return (
                  <div style={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'hsl(var(--foreground))',
                  }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{label}</p>
                    {items.map((item) => (
                      <p key={item.grade} style={{ margin: '2px 0', color: item.color }}>
                        {item.grade}: {item.value}%
                      </p>
                    ))}
                  </div>
                );
              }}
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
                data={actualData}
                type="monotone"
                dataKey={grade}
                stroke={COLORS[grade]}
                strokeWidth={2.5}
                dot={{ r: 4, fill: COLORS[grade] }}
                activeDot={{ r: 6 }}
              />
            ))}
            {predictedData.length > 0 && (["A*", "A", "B"] as const).map((grade) => (
              <Line
                key={`${grade}-predicted`}
                data={predictedData}
                type="monotone"
                dataKey={grade}
                stroke={COLORS[grade]}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={({ cx, cy, index }: any) => {
                  if (index === 0) return <circle key={index} cx={cx} cy={cy} r={0} />;
                  return <circle key={index} cx={cx} cy={cy} r={4} fill={COLORS[grade]} stroke="none" />;
                }}
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

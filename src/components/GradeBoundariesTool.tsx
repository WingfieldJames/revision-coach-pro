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
  /** Whether this is a GCSE subject (uses 9/8/7 labels instead of A*/A/B) */
  isGCSE?: boolean;
}

const A_LEVEL_COLORS: Record<string, string> = {
  "A*": "#1e3a8a",
  A: "#6d28d9",
  B: "#a855f7",
};

const GCSE_COLORS: Record<string, string> = {
  "9": "#1e3a8a",
  "8": "#6d28d9",
  "7": "#a855f7",
};

// Map from internal storage keys (A*/A/B) to display labels
const GCSE_LABEL_MAP: Record<string, string> = {
  "A*": "9",
  "A": "8",
  "B": "7",
};

function computePredicted2026(data: GradeBoundariesData, grades: string[]): Record<string, number> | null {
  const years = ['2023', '2024', '2025'];
  const predicted: Record<string, number> = {};
  let hasAny = false;

  for (const grade of grades) {
    const vals = years.map(yr => data[yr]?.[grade]).filter((v): v is number => typeof v === 'number' && !isNaN(v));
    if (vals.length >= 2) {
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

export const GradeBoundariesTool: React.FC<GradeBoundariesToolProps> = ({ gradeBoundariesData, subjectLabel, isGCSE }) => {
  if (!gradeBoundariesData) return null;

  // Internal storage always uses A*/A/B keys
  const storageGrades = ['A*', 'A', 'B'];
  const years = ['2023', '2024', '2025'];
  
  const hasData = years.some(yr => {
    const yrData = gradeBoundariesData[yr];
    return yrData && Object.values(yrData).some(v => typeof v === 'number' && !isNaN(v) && v > 0);
  });
  if (!hasData) return null;

  // Display labels and colors
  const displayGrades = isGCSE ? ['9', '8', '7'] : ['A*', 'A', 'B'];
  const colors = isGCSE ? GCSE_COLORS : A_LEVEL_COLORS;

  const predicted = computePredicted2026(gradeBoundariesData, storageGrades);

  // Remap data from storage keys to display keys
  const remapRow = (row: Record<string, any>) => {
    if (!isGCSE) return row;
    const remapped: Record<string, any> = { year: row.year };
    for (const [storageKey, displayKey] of Object.entries(GCSE_LABEL_MAP)) {
      if (row[storageKey] != null) remapped[displayKey] = row[storageKey];
    }
    return remapped;
  };

  const actualData = years
    .filter(yr => gradeBoundariesData[yr])
    .map(yr => remapRow({
      year: yr,
      ...gradeBoundariesData[yr],
    }));

  const predictedData = predicted && actualData.length > 0
    ? [
        actualData[actualData.length - 1],
        remapRow({ year: "2026 (Predicted)", ...predicted }),
      ]
    : [];

  const allVals = [...actualData, ...predictedData]
    .flatMap(d => displayGrades.map(g => (d as any)[g]).filter((v): v is number => typeof v === 'number'));
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
              payload={displayGrades.map(g => ({
                value: g,
                type: 'circle' as const,
                color: colors[g],
              }))}
            />
            {displayGrades.map((grade) => (
              <Line
                key={grade}
                data={actualData}
                type="monotone"
                dataKey={grade}
                stroke={colors[grade]}
                strokeWidth={2.5}
                dot={{ r: 4, fill: colors[grade] }}
                activeDot={{ r: 6 }}
              />
            ))}
            {predictedData.length > 0 && displayGrades.map((grade) => (
              <Line
                key={`${grade}-predicted`}
                data={predictedData}
                type="monotone"
                dataKey={grade}
                stroke={colors[grade]}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={({ cx, cy, index }: any) => {
                  if (index === 0) return <circle key={index} cx={cx} cy={cy} r={0} />;
                  return <circle key={index} cx={cx} cy={cy} r={4} fill={colors[grade]} stroke="none" />;
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

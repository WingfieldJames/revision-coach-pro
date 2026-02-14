import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Flame, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useNavigate } from "react-router-dom";

/* ─── helpers ─── */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const AVERAGE_MINS: Record<string, number> = {
  Mon: 55,
  Tue: 50,
  Wed: 40,
  Thu: 38,
  Fri: 20,
  Sat: 12,
  Sun: 48,
};

const STREAK_KEY = "astar_streak";
const STREAK_DATE_KEY = "astar_streak_date";
const GOALS_KEY = "astar_study_goals";
const USER_MINS_KEY = "astar_user_mins";

function getStreak(): number {
  const stored = localStorage.getItem(STREAK_KEY);
  const lastDate = localStorage.getItem(STREAK_DATE_KEY);
  const today = new Date().toDateString();
  if (lastDate === today) return Number(stored) || 1;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastDate === yesterday) {
    const next = (Number(stored) || 0) + 1;
    localStorage.setItem(STREAK_KEY, String(next));
    localStorage.setItem(STREAK_DATE_KEY, today);
    return next;
  }
  localStorage.setItem(STREAK_KEY, "1");
  localStorage.setItem(STREAK_DATE_KEY, today);
  return 1;
}

function getGoals(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getUserMins(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(USER_MINS_KEY) || "{}");
  } catch {
    return {};
  }
}

/* ─── chart custom tooltip ─── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value} min
        </p>
      ))}
    </div>
  );
};

/* ─── main component ─── */
export const ProgressPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const streak = useMemo(() => getStreak(), []);
  const [goals, setGoals] = useState<Record<string, number>>(getGoals);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [editGoals, setEditGoals] = useState<Record<string, number>>({});
  const [activeSection, setActiveSection] = useState("referral");
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setChartReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const userMins = getUserMins();

  const chartData = DAYS.map((d) => ({
    day: d,
    you: userMins[d] ?? 0,
    average: AVERAGE_MINS[d],
    goal: goals[d] ?? null,
  }));

  const openGoalEditor = () => {
    setEditGoals({ ...goals });
    setShowGoalEditor(true);
  };

  const saveGoals = () => {
    setGoals(editGoals);
    localStorage.setItem(GOALS_KEY, JSON.stringify(editGoals));
    setShowGoalEditor(false);
  };

  const sections: { key: string; label: string }[] = [
    { key: "referral", label: "Referral Program" },
    { key: "ugc", label: "UGC Creator Academy" },
    { key: "build", label: "Build a Subject" },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background font-sans">
      <SEOHead
        title="Progress | A* AI – Track Your Revision"
        description="Track your daily revision streak, study hours and goals with A* AI."
        canonical="https://astarai.co.uk/progress"
      />
      <Header showNavLinks />

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-20">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-center mb-8"
        >
          <span className="text-foreground">Your road to an </span>
          <span className="text-gradient-brand">A*</span>
        </motion.h1>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <div
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-border bg-card shadow-sm"
          >
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="text-3xl font-bold text-foreground">{streak}</span>
            <span className="text-muted-foreground text-sm">day streak</span>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-4"
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
            Weekly Study Time
          </h2>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => (v >= 60 ? `${(v / 60).toFixed(1)}h` : `${v}m`)}
                  domain={[0, 70]}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Average line – grey */}
                <Line
                  dataKey="average"
                  name="Average"
                  type="monotone"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  isAnimationActive={chartReady}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />

                {/* Goal line – grey dotted */}
                {Object.keys(goals).length > 0 && (
                  <Line
                    dataKey="goal"
                    name="Your Goal"
                    type="monotone"
                    stroke="hsl(var(--muted-foreground) / 0.5)"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ r: 3, fill: "hsl(var(--muted-foreground))" }}
                    connectNulls
                    isAnimationActive={chartReady}
                    animationDuration={1400}
                    animationEasing="ease-out"
                  />
                )}

                {/* Your progress – gradient brand color */}
                <Line
                  dataKey="you"
                  name="You"
                  type="monotone"
                  stroke="var(--gradient-from)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--gradient-from)", strokeWidth: 0 }}
                  isAnimationActive={chartReady}
                  animationDuration={1600}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: "var(--gradient-from)" }} />
              You
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-muted-foreground" style={{ opacity: 0.7 }} />
              Average
            </span>
            {Object.keys(goals).length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded bg-muted-foreground" style={{ opacity: 0.4 }} />
                Goal
              </span>
            )}
          </div>
        </motion.div>

        {/* Add goals button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex justify-center mb-12"
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-sm"
            onClick={openGoalEditor}
          >
            <Plus className="h-4 w-4" />
            {Object.keys(goals).length > 0 ? "Edit Study Goals" : "Set Study Goals"}
          </Button>
        </motion.div>

        {/* Goal editor modal */}
        {showGoalEditor && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowGoalEditor(false)}
          >
            <div
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Set Daily Goals (mins)</h3>
                <button onClick={() => setShowGoalEditor(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                {DAYS.map((d) => (
                  <div key={d} className="flex items-center justify-between">
                    <span className="text-sm text-foreground w-10">{d}</span>
                    <input
                      type="range"
                      min={0}
                      max={120}
                      step={5}
                      value={editGoals[d] ?? 0}
                      onChange={(e) =>
                        setEditGoals((prev) => ({ ...prev, [d]: Number(e.target.value) }))
                      }
                      className="flex-1 mx-3 accent-[var(--gradient-from)]"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {editGoals[d] ?? 0}m
                    </span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-5" onClick={saveGoals}>
                Save Goals
              </Button>
            </div>
          </motion.div>
        )}

        {/* Join the A* Team */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
            <span className="text-foreground">Join the </span>
            <span className="text-gradient-brand">A*</span>
            <span className="text-foreground"> Team</span>
          </h2>

          {/* Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-full border border-border bg-card p-1 gap-1">
              {sections.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                    activeSection === s.key
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={
                    activeSection === s.key
                      ? { background: "var(--gradient-brand)" }
                      : undefined
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-card border border-border rounded-2xl p-8 text-center min-h-[120px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Coming soon 🚀</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Users, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolMembership, type School } from '@/hooks/useSchoolMembership';

interface OverviewPanelProps {
  school?: School;
}

const WEEKS = 6;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Skills we surface, in the order the spec asks for.
const SKILLS: { key: string; label: string }[] = [
  { key: 'KAA', label: 'KAA' },
  { key: 'EVALUATION', label: 'Evaluation' },
  { key: 'DIAGRAM', label: 'Diagrams' },
  { key: 'APPLICATION', label: 'Application' },
];

interface InteractionRow {
  user_id: string;
  offload_score: number | null;
  created_at: string;
}

interface SkillRow {
  skill: string;
  signal: number | null;
}

interface TrendPoint {
  label: string;
  score: number | null;
}

interface SkillCoverage {
  key: string;
  label: string;
  value: number | null; // 0..1, null when no signal yet
}

function strengthLabel(value: number): { text: string; className: string } {
  if (value >= 0.67) return { text: 'Strong', className: 'text-emerald-600 dark:text-emerald-400' };
  if (value >= 0.34) return { text: 'Developing', className: 'text-amber-600 dark:text-amber-400' };
  return { text: 'Weak', className: 'text-rose-600 dark:text-rose-400' };
}

export const OverviewPanel = ({ school }: OverviewPanelProps) => {
  const { membership } = useSchoolMembership();
  const viewerRole = membership?.role;
  const canSeeSafeguarding = viewerRole === 'dsl' || viewerRole === 'admin';

  const schoolId = school?.id;

  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeThisWeek, setActiveThisWeek] = useState(0);
  const [needsAttention, setNeedsAttention] = useState(0);
  const [openFlags, setOpenFlags] = useState(0);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [skillCoverage, setSkillCoverage] = useState<SkillCoverage[]>([]);
  const [hasActivity, setHasActivity] = useState(false);
  const [hasSkillData, setHasSkillData] = useState(false);

  useEffect(() => {
    if (!schoolId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);

      const now = Date.now();
      const sixWeeksAgoIso = new Date(now - WEEKS * WEEK_MS).toISOString();
      const sevenDaysAgo = now - WEEK_MS;

      const [membersRes, interactionsRes, skillsRes, flagsRes] = await Promise.all([
        // Accepted students on the roster.
        supabase
          .from('school_members')
          .select('user_id, role, invite_status')
          .eq('school_id', schoolId)
          .eq('role', 'student')
          .eq('invite_status', 'accepted'),
        // Student-only coach interactions over the trend window.
        supabase
          .from('coach_interactions')
          .select('user_id, offload_score, created_at')
          .eq('school_id', schoolId)
          .eq('role', 'student')
          .gte('created_at', sixWeeksAgoIso),
        // Skill signals for this school.
        supabase
          .from('skill_events')
          .select('skill, signal')
          .eq('school_id', schoolId),
        // Open safeguarding flags (only queried when the viewer may see them).
        canSeeSafeguarding
          ? supabase
              .from('safeguarding_flags')
              .select('id', { count: 'exact', head: true })
              .eq('school_id', schoolId)
              .eq('status', 'open')
          : Promise.resolve({ count: 0, error: null } as const),
      ]);

      if (cancelled) return;

      // --- Roster ---
      const students = (membersRes.data ?? []).filter((m) => m.user_id) as { user_id: string }[];
      const studentIds = students.map((m) => m.user_id);
      setTotalStudents(studentIds.length);

      // --- Interactions ---
      const interactions = (interactionsRes.data ?? []) as InteractionRow[];
      setHasActivity(interactions.length > 0);

      // Active this week = distinct student user_ids in the last 7 days.
      const activeIds = new Set<string>();
      // Per-student stats for the "needs attention" heuristic.
      const perStudent = new Map<string, { sum: number; scored: number; lastActive: number }>();

      for (const row of interactions) {
        const ts = new Date(row.created_at).getTime();
        if (ts >= sevenDaysAgo) activeIds.add(row.user_id);

        const s = perStudent.get(row.user_id) ?? { sum: 0, scored: 0, lastActive: 0 };
        if (row.offload_score != null) {
          s.sum += row.offload_score;
          s.scored += 1;
        }
        if (ts > s.lastActive) s.lastActive = ts;
        perStudent.set(row.user_id, s);
      }
      setActiveThisWeek(activeIds.size);

      // Needs attention: high offloading (avg > 0.6) OR no activity in the last 7 days.
      // Only meaningful once there is some activity — avoids flagging the whole
      // roster on day one when nothing has been logged yet.
      let attention = 0;
      if (interactions.length > 0) {
        for (const id of studentIds) {
          const s = perStudent.get(id);
          const avgOffload = s && s.scored > 0 ? s.sum / s.scored : 0;
          const staleOrInactive = !s || s.lastActive < sevenDaysAgo;
          if (avgOffload > 0.6 || staleOrInactive) attention += 1;
        }
      }
      setNeedsAttention(attention);

      // Offloading trend: average student offload_score per week, oldest → newest.
      const buckets = Array.from({ length: WEEKS }, () => ({ sum: 0, count: 0 }));
      for (const row of interactions) {
        if (row.offload_score == null) continue;
        const age = now - new Date(row.created_at).getTime();
        const weeksAgo = Math.floor(age / WEEK_MS);
        if (weeksAgo < 0 || weeksAgo >= WEEKS) continue;
        const b = buckets[WEEKS - 1 - weeksAgo];
        b.sum += row.offload_score;
        b.count += 1;
      }
      const trendPoints: TrendPoint[] = buckets.map((b, i) => {
        const weeksAgo = WEEKS - 1 - i;
        const start = new Date(now - (weeksAgo + 1) * WEEK_MS);
        return {
          label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          score: b.count > 0 ? Math.round((b.sum / b.count) * 100) : null,
        };
      });
      setTrend(trendPoints);

      // --- Skill coverage: average signal per skill ---
      const skillRows = (skillsRes.data ?? []) as SkillRow[];
      setHasSkillData(skillRows.length > 0);
      const skillAgg = new Map<string, { sum: number; count: number }>();
      for (const row of skillRows) {
        if (row.signal == null) continue;
        const key = (row.skill || '').toUpperCase();
        const a = skillAgg.get(key) ?? { sum: 0, count: 0 };
        a.sum += row.signal;
        a.count += 1;
        skillAgg.set(key, a);
      }
      setSkillCoverage(
        SKILLS.map(({ key, label }) => {
          const a = skillAgg.get(key);
          return { key, label, value: a && a.count > 0 ? a.sum / a.count : null };
        }),
      );

      // --- Safeguarding ---
      if (canSeeSafeguarding) {
        setOpenFlags(flagsRes.count ?? 0);
      }

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [schoolId, canSeeSafeguarding]);

  if (!schoolId) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Select a school to view its overview.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const tiles: { label: string; value: number; icon: typeof Users; hint?: string }[] = [
    { label: 'Total students', value: totalStudents, icon: Users },
    { label: 'Active this week', value: activeThisWeek, icon: Activity },
    { label: 'Needs attention', value: needsAttention, icon: AlertTriangle, hint: 'High offloading or quiet for 7+ days' },
  ];
  if (canSeeSafeguarding) {
    tiles.push({ label: 'Open safeguarding flags', value: openFlags, icon: ShieldAlert });
  }

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card key={tile.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tile.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tile.value}</div>
                {tile.hint && <p className="text-xs text-muted-foreground mt-1">{tile.hint}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Offloading trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Offloading trend</CardTitle>
          <CardDescription>
            Average student offload score per week over the last 6 weeks. Lower is better — it should
            fall as your class learns to use the Coach to think, not to copy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasActivity ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Avg offload']}
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No student activity yet — this fills in as your class starts using the Coach.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Skill coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skill coverage</CardTitle>
          <CardDescription>
            Average skill signal across your students, from their Coach interactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasSkillData ? (
            <div className="space-y-4">
              {skillCoverage.map((s) => {
                const pct = s.value != null ? Math.max(0, Math.min(1, s.value)) : 0;
                const strength = s.value != null ? strengthLabel(pct) : null;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="font-medium">{s.label}</span>
                      {strength ? (
                        <span className={strength.className}>{strength.text}</span>
                      ) : (
                        <span className="text-muted-foreground">No data yet</span>
                      )}
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.round(pct * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No student activity yet — this fills in as your class starts using the Coach.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolMembership } from '@/hooks/useSchoolMembership';
import type { School } from '@/hooks/useSchoolMembership';
import { Users, Flag } from 'lucide-react';

interface RosterPanelProps {
  school: School;
}

type OffloadLevel = 'low' | 'med' | 'high';

/** The four coaching skills we surface as dot-indicators, in display order. */
const SKILLS = [
  { key: 'kaa', label: 'KAA' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'diagrams', label: 'Diagrams' },
  { key: 'application', label: 'Application' },
] as const;

type SkillKey = (typeof SKILLS)[number]['key'];

interface RosterRow {
  userId: string;
  email: string;
  lastActive: string | null;
  sessionsThisWeek: number;
  offloadLevel: OffloadLevel | null;
  skills: Record<SkillKey, number | null>;
  flagCount: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Normalise a raw offload_score onto a 0–1 scale (some rows may store 0–100). */
const normalise = (score: number): number => (score > 1 ? score / 100 : score);

/** Bucket an average signal/score (0–1) into three levels. */
const bucket = (avg: number): 'low' | 'med' | 'high' =>
  avg >= 0.66 ? 'high' : avg >= 0.33 ? 'med' : 'low';

/** Match a free-text skill label from skill_events to one of our four buckets. */
const skillKeyFor = (raw: string): SkillKey | null => {
  const s = raw.toLowerCase();
  if (s.includes('kaa') || s.includes('knowledge')) return 'kaa';
  if (s.includes('eval')) return 'evaluation';
  if (s.includes('diagram')) return 'diagrams';
  if (s.includes('applic')) return 'application';
  return null;
};

const formatRelative = (dateStr: string | null): string => {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const isStale = (dateStr: string | null): boolean =>
  !dateStr || Date.now() - new Date(dateStr).getTime() > WEEK_MS;

/** Renders three dots (filled/empty) for a skill's average signal. */
const SkillDots = ({ avg }: { avg: number | null }) => {
  if (avg === null) {
    return <span className="text-muted-foreground/40 tracking-tight">○○○</span>;
  }
  const level = bucket(avg);
  const filled = level === 'high' ? 3 : level === 'med' ? 2 : 1;
  const colour =
    level === 'high'
      ? 'text-green-600'
      : level === 'med'
        ? 'text-amber-600'
        : 'text-muted-foreground';
  return (
    <span className={`tracking-tight ${colour}`} aria-label={`${filled} of 3`}>
      {'●'.repeat(filled)}
      <span className="text-muted-foreground/40">{'○'.repeat(3 - filled)}</span>
    </span>
  );
};

const OffloadBadge = ({ level }: { level: OffloadLevel | null }) => {
  if (level === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (level === 'high') {
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300">
        HIGH
      </Badge>
    );
  }
  if (level === 'med') {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300">
        Medium
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Low
    </Badge>
  );
};

export const RosterPanel = ({ school }: RosterPanelProps) => {
  const { membership } = useSchoolMembership();
  const viewerRole = membership?.role;
  const canSeeFlags = viewerRole === 'dsl' || viewerRole === 'admin';

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RosterRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // 1. Enrolled students of this school.
      const { data: members } = await supabase
        .from('school_members')
        .select('user_id, invited_email')
        .eq('school_id', school.id)
        .eq('role', 'student')
        .eq('invite_status', 'accepted');

      if (cancelled) return;

      const emailByMember = new Map<string, string | null>();
      const studentIds: string[] = [];
      for (const m of members ?? []) {
        if (!m.user_id) continue;
        studentIds.push(m.user_id);
        emailByMember.set(m.user_id, m.invited_email);
      }

      if (studentIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // 2–4. Fetch supporting data in parallel. Student identity comes from
      // school_members.invited_email (already loaded above) — staff can read
      // school_members via RLS but not other users' rows in the users table.
      const [interactionsRes, skillsRes, flagsRes] = await Promise.all([
        supabase
          .from('coach_interactions')
          .select('user_id, offload_score, created_at')
          .eq('school_id', school.id)
          .eq('role', 'student')
          .in('user_id', studentIds),
        supabase
          .from('skill_events')
          .select('user_id, skill, signal')
          .eq('school_id', school.id)
          .in('user_id', studentIds),
        canSeeFlags
          ? supabase
              .from('safeguarding_flags')
              .select('student_id, status')
              .eq('school_id', school.id)
              .in('student_id', studentIds)
          : Promise.resolve({ data: [] as { student_id: string; status: string }[] }),
      ]);

      if (cancelled) return;

      // Aggregate coach_interactions per student.
      const now = Date.now();
      const interAgg = new Map<
        string,
        { lastActive: string | null; sessionsThisWeek: number; scores: number[] }
      >();
      for (const row of interactionsRes.data ?? []) {
        let agg = interAgg.get(row.user_id);
        if (!agg) {
          agg = { lastActive: null, sessionsThisWeek: 0, scores: [] };
          interAgg.set(row.user_id, agg);
        }
        if (!agg.lastActive || row.created_at > agg.lastActive) {
          agg.lastActive = row.created_at;
        }
        if (now - new Date(row.created_at).getTime() <= WEEK_MS) {
          agg.sessionsThisWeek += 1;
        }
        if (row.offload_score !== null) {
          agg.scores.push(normalise(row.offload_score));
        }
      }

      // Aggregate skill_events per student per skill (sum + count → average).
      const skillAgg = new Map<string, Record<SkillKey, { sum: number; count: number }>>();
      for (const row of skillsRes.data ?? []) {
        if (row.signal === null) continue;
        const key = skillKeyFor(row.skill);
        if (!key) continue;
        let byStudent = skillAgg.get(row.user_id);
        if (!byStudent) {
          byStudent = {
            kaa: { sum: 0, count: 0 },
            evaluation: { sum: 0, count: 0 },
            diagrams: { sum: 0, count: 0 },
            application: { sum: 0, count: 0 },
          };
          skillAgg.set(row.user_id, byStudent);
        }
        byStudent[key].sum += normalise(row.signal);
        byStudent[key].count += 1;
      }

      // Count open-ish safeguarding flags per student (dsl/admin only).
      const flagCounts = new Map<string, number>();
      for (const f of flagsRes.data ?? []) {
        if (f.status === 'resolved' || f.status === 'dismissed') continue;
        flagCounts.set(f.student_id, (flagCounts.get(f.student_id) ?? 0) + 1);
      }

      const built: RosterRow[] = studentIds.map((id) => {
        const inter = interAgg.get(id);
        const scores = inter?.scores ?? [];
        const offloadLevel: OffloadLevel | null =
          scores.length > 0
            ? bucket(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null;

        const byStudent = skillAgg.get(id);
        const skills = {} as Record<SkillKey, number | null>;
        for (const { key } of SKILLS) {
          const s = byStudent?.[key];
          skills[key] = s && s.count > 0 ? s.sum / s.count : null;
        }

        return {
          userId: id,
          email: emailByMember.get(id) ?? `Student ${id.slice(0, 8)}`,
          lastActive: inter?.lastActive ?? null,
          sessionsThisWeek: inter?.sessionsThisWeek ?? 0,
          offloadLevel,
          skills,
          flagCount: flagCounts.get(id) ?? 0,
        };
      });

      // Sort by last active desc; never-active students sink to the bottom.
      built.sort((a, b) => {
        const at = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const bt = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return bt - at;
      });

      setRows(built);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [school.id, canSeeFlags]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Roster
        </CardTitle>
        <CardDescription>
          Every student at {school.name}. Scan for who needs a nudge — stale students and
          heavy offloaders are flagged.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading roster…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No students enrolled yet — invite them from your school admin page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead>This week</TableHead>
                  {SKILLS.map((s) => (
                    <TableHead key={s.key} className="text-center whitespace-nowrap">
                      {s.label}
                    </TableHead>
                  ))}
                  <TableHead>Offloading</TableHead>
                  {canSeeFlags && <TableHead className="text-center">Flag</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const stale = isStale(row.lastActive);
                  return (
                    <TableRow key={row.userId}>
                      <TableCell className="font-medium max-w-[220px] truncate" title={row.email}>
                        {row.email}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {formatRelative(row.lastActive)}
                        </span>
                        {stale && (
                          <Badge
                            variant="outline"
                            className="ml-2 border-amber-300 text-amber-700 dark:text-amber-400"
                          >
                            Stale
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={row.sessionsThisWeek === 0 ? 'text-muted-foreground' : ''}>
                          {row.sessionsThisWeek}
                          <span className="text-muted-foreground">
                            {' '}
                            {row.sessionsThisWeek === 1 ? 'session' : 'sessions'}
                          </span>
                        </span>
                      </TableCell>
                      {SKILLS.map((s) => (
                        <TableCell key={s.key} className="text-center">
                          <SkillDots avg={row.skills[s.key]} />
                        </TableCell>
                      ))}
                      <TableCell>
                        <OffloadBadge level={row.offloadLevel} />
                      </TableCell>
                      {canSeeFlags && (
                        <TableCell className="text-center">
                          {row.flagCount > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 text-red-600"
                              title={`${row.flagCount} open safeguarding flag(s)`}
                            >
                              <Flag className="h-4 w-4 fill-current" />
                              {row.flagCount > 1 && (
                                <span className="text-xs font-medium">{row.flagCount}</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

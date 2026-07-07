import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolMembership } from '@/hooks/useSchoolMembership';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, ShieldCheck } from 'lucide-react';
import type { School } from '@/hooks/useSchoolMembership';
import type { Tables } from '@/integrations/supabase/types';

interface SafeguardingPanelProps {
  school: School;
}

type FlagRow = Pick<
  Tables<'safeguarding_flags'>,
  | 'id'
  | 'student_id'
  | 'school_id'
  | 'class_id'
  | 'severity'
  | 'category'
  | 'excerpt'
  | 'status'
  | 'raised_at'
  | 'dsl_ack_at'
  | 'dsl_ack_by'
>;

type StatusFilter = 'open' | 'ack' | 'closed' | 'all';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'ack', label: 'Acknowledged' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
];

/** Restrained severity styling — measured, not a wall of red. */
const SEVERITY_STYLES: Record<string, string> = {
  low: 'border-border bg-muted text-muted-foreground',
  medium: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  high: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  ack: 'Acknowledged',
  closed: 'Closed',
};

const severityRank = (severity: string): number => {
  if (severity === 'high') return 0;
  if (severity === 'medium') return 1;
  return 2;
};

const formatRaised = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SafeguardingPanel = ({ school }: SafeguardingPanelProps) => {
  const { user } = useAuth();
  const { loading: membershipLoading, membership } = useSchoolMembership();

  const role = membership?.role;
  const canView = role === 'dsl' || role === 'admin';

  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [studentEmails, setStudentEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('open');
  const [acking, setAcking] = useState<string | null>(null);

  const loadFlags = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('safeguarding_flags')
      .select(
        'id, student_id, school_id, class_id, severity, category, excerpt, status, raised_at, dsl_ack_at, dsl_ack_by',
      )
      .eq('school_id', school.id)
      .order('raised_at', { ascending: false });

    if (error) {
      toast.error('Could not load safeguarding flags');
      setFlags([]);
      setLoading(false);
      return;
    }

    const rows = data ?? [];
    setFlags(rows);
    setLoading(false);

    // Best-effort resolution of student email for context. If RLS or absence
    // prevents it, the queue still renders with a student reference.
    const studentIds = Array.from(new Set(rows.map((r) => r.student_id)));
    if (studentIds.length > 0) {
      const { data: userRows } = await supabase
        .from('users')
        .select('id, email')
        .in('id', studentIds);

      if (userRows) {
        const map: Record<string, string> = {};
        for (const u of userRows) map[u.id] = u.email;
        setStudentEmails(map);
      }
    }
  }, [school.id]);

  useEffect(() => {
    // Never fetch flag content for viewers without safeguarding access.
    if (membershipLoading || !canView) return;
    loadFlags();
  }, [membershipLoading, canView, loadFlags]);

  const handleAcknowledge = useCallback(
    async (flagId: string) => {
      if (!user?.id) return;
      setAcking(flagId);

      const ackAt = new Date().toISOString();
      const { error } = await supabase
        .from('safeguarding_flags')
        .update({ status: 'ack', dsl_ack_at: ackAt, dsl_ack_by: user.id })
        .eq('id', flagId);

      setAcking(null);

      if (error) {
        toast.error('Could not acknowledge this flag. Please try again.');
        return;
      }

      setFlags((prev) =>
        prev.map((f) =>
          f.id === flagId
            ? { ...f, status: 'ack', dsl_ack_at: ackAt, dsl_ack_by: user.id }
            : f,
        ),
      );
      toast.success('Flag acknowledged');
    },
    [user?.id],
  );

  const visibleFlags = useMemo(() => {
    const filtered = filter === 'all' ? flags : flags.filter((f) => f.status === filter);
    // Open first, then most recently raised, with higher severity breaking ties.
    return [...filtered].sort((a, b) => {
      const aOpen = a.status === 'open' ? 0 : 1;
      const bOpen = b.status === 'open' ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      const timeDiff = new Date(b.raised_at).getTime() - new Date(a.raised_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return severityRank(a.severity) - severityRank(b.severity);
    });
  }, [flags, filter]);

  const statusCounts = useMemo(
    () => ({
      open: flags.filter((f) => f.status === 'open').length,
      ack: flags.filter((f) => f.status === 'ack').length,
      closed: flags.filter((f) => f.status === 'closed').length,
      all: flags.length,
    }),
    [flags],
  );

  const studentLabel = (studentId: string): string => {
    const email = studentEmails[studentId];
    if (email) return email;
    return `Student ${studentId.slice(0, 8)}`;
  };

  // Resolving the viewer's role before deciding anything.
  if (membershipLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  // Access gate — DSL/admin only. No flag content is fetched or shown otherwise.
  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" />
            Safeguarding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm font-medium">Restricted view</p>
            <p className="text-sm text-muted-foreground mt-1">
              Safeguarding flags are visible to the Designated Safeguarding Lead only.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" />
            Safeguarding
          </CardTitle>
          <CardDescription>
            Flags raised by the Coach for {school.name}, newest first. Review each one, then
            acknowledge it once you&apos;ve actioned it through your usual safeguarding process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((opt) => {
              const active = filter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  aria-pressed={active}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {opt.label}
                  <span className={`ml-1.5 text-xs ${active ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {statusCounts[opt.value]}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardContent>
        </Card>
      ) : visibleFlags.length === 0 ? (
        <Card>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm font-medium">
                {filter === 'open' && statusCounts.all > 0
                  ? 'No open flags'
                  : 'No safeguarding flags'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === 'open' && statusCounts.all > 0
                  ? 'Nothing needs your attention right now.'
                  : 'No safeguarding flags. The system is watching quietly in the background.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleFlags.map((flag) => (
            <Card key={flag.id}>
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={SEVERITY_STYLES[flag.severity] ?? SEVERITY_STYLES.low}
                  >
                    {SEVERITY_LABELS[flag.severity] ?? flag.severity}
                  </Badge>
                  {flag.category && (
                    <Badge variant="secondary" className="font-normal">
                      {flag.category}
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {STATUS_LABELS[flag.status] ?? flag.status}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatRaised(flag.raised_at)}
                  </span>
                </div>

                {flag.excerpt && (
                  <blockquote className="border-l-2 border-border pl-3 text-sm text-foreground/90">
                    {flag.excerpt}
                  </blockquote>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Student: <span className="text-foreground/80">{studentLabel(flag.student_id)}</span>
                    {flag.status !== 'open' && flag.dsl_ack_at && (
                      <span className="ml-2">· Acknowledged {formatRaised(flag.dsl_ack_at)}</span>
                    )}
                  </p>
                  {flag.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledge(flag.id)}
                      disabled={acking === flag.id}
                    >
                      <Check className="h-4 w-4" />
                      {acking === flag.id ? 'Acknowledging…' : 'Acknowledge'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

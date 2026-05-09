import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, BookOpen, FileText, Flame, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStreak } from '@/hooks/useStreak';
import { cn } from '@/lib/utils';

interface PEQ {
  label: string;
  paper?: string;
  year?: string;
  marks?: string;
  topic?: string;
}

interface SourceMeta {
  type: string;
  topic: string;
}

interface AnswerFooterProps {
  messageId: string;
  productId: string;
  userQuestion: string;
  assistantAnswer: string;
  sources: SourceMeta[];
  onPromptClick: (text: string) => void;
}

const GREETING_RE = /^(hi|hello|hey|sure|got it|of course|thanks|thank you|ok|okay|yes|no)\b/i;

export const AnswerFooter: React.FC<AnswerFooterProps> = ({
  messageId,
  productId,
  userQuestion,
  assistantAnswer,
  sources,
  onPromptClick,
}) => {
  const { streak } = useStreak();
  const [followups, setFollowups] = useState<string[]>([]);
  const [peqs, setPeqs] = useState<PEQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  // Pull a spec point hint from sources metadata
  const specTopic = sources.find(s => s.type === 'specification')?.topic
    || sources.find(s => s.type === 'spec_point')?.topic
    || null;

  // Substantive-answer gate
  const isSubstantive =
    assistantAnswer.length >= 200 &&
    !GREETING_RE.test(assistantAnswer.trim()) &&
    sources.length > 0;

  useEffect(() => {
    if (!isSubstantive) return;
    if (fetchedRef.current === messageId) return;
    fetchedRef.current = messageId;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('suggest-followups', {
          body: {
            productId,
            question: userQuestion,
            answer: assistantAnswer,
            specPoint: specTopic,
          },
        });
        if (cancelled) return;
        if (error) {
          setErrored(true);
        } else {
          setFollowups(Array.isArray(data?.followups) ? data.followups : []);
          setPeqs(Array.isArray(data?.related_peqs) ? data.related_peqs : []);
        }
      } catch {
        if (!cancelled) setErrored(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [messageId, isSubstantive, productId, userQuestion, assistantAnswer, specTopic]);

  if (!isSubstantive) return null;
  if (errored && followups.length === 0 && peqs.length === 0 && !specTopic) return null;

  const streakCount = streak?.current_streak || 0;
  const hasAnyContent = specTopic || followups.length > 0 || peqs.length > 0 || streakCount > 0;
  if (!loading && !hasAnyContent) return null;

  // Build last-7-days study dot map
  const studyDots = (() => {
    const dots: { date: string; label: string; color: string; title: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = streak?.last_active_date ? new Date(streak.last_active_date + 'T00:00:00') : null;
    const studiedDates = new Set<string>();
    if (lastActive && streakCount > 0) {
      for (let i = 0; i < streakCount; i++) {
        const d = new Date(lastActive);
        d.setDate(d.getDate() - i);
        studiedDates.add(d.toISOString().slice(0, 10));
      }
    }
    const todayStr = today.toISOString().slice(0, 10);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'short' })[0];
      let color = 'bg-red-500';
      let title = `${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} — missed`;
      if (studiedDates.has(iso)) {
        color = 'bg-green-500';
        title = `${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} — studied`;
      } else if (iso === todayStr) {
        color = 'bg-orange-400';
        title = "Today — study to keep your streak";
      }
      dots.push({ date: iso, label: dayLabel, color, title });
    }
    return dots;
  })();

  return (
    <div className="not-prose mt-4 -ml-[44px] -mr-1 -mb-1 p-4 rounded-xl bg-white dark:bg-slate-900 border border-border/60 dark:border-white/10 space-y-3 text-sm text-foreground shadow-sm">
      {/* Top row: spec chip + streak dots */}
      {(specTopic || streakCount > 0 || streak) && (
        <div className="flex flex-wrap items-center gap-3">
          {specTopic && (
            <button
              onClick={() => onPromptClick(`Explain spec point "${specTopic}" in more depth with examples.`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors text-xs font-bold"
              title="Dive deeper into this spec point"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="truncate max-w-[220px]">{specTopic}</span>
            </button>
          )}
          <div className="flex items-center gap-1.5" title="Last 7 days of study activity">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <div className="flex items-center gap-1">
              {studyDots.map((dot) => (
                <span
                  key={dot.date}
                  className={cn("w-2.5 h-2.5 rounded-full ring-1 ring-black/5", dot.color)}
                  title={dot.title}
                />
              ))}
            </div>
            {streakCount > 0 && (
              <span className="text-xs font-bold text-orange-600 ml-1">{streakCount}d</span>
            )}
          </div>
        </div>
      )}

      {/* Recommended follow-ups */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-foreground uppercase tracking-wide">
          <Sparkles className="w-3 h-3" />
          Recommended next
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking of follow-ups…
          </div>
        ) : followups.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {followups.map((f, i) => (
              <button
                key={i}
                onClick={() => onPromptClick(f)}
                className={cn(
                  "text-left px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-slate-800 dark:border-white/10",
                  "hover:bg-accent hover:border-primary/40 hover:-translate-y-0.5",
                  "transition-all text-xs font-medium text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No suggestions right now.</div>
        )}
      </div>

      {/* Related PEQs */}
      {peqs.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-foreground uppercase tracking-wide">
            <FileText className="w-3 h-3" />
            Related past paper questions
          </div>
          <div className="flex flex-wrap gap-2">
            {peqs.map((p, i) => (
              <button
                key={i}
                onClick={() =>
                  onPromptClick(
                    `Walk me through ${p.label}${p.topic ? ` (${p.topic})` : ''} — show the question and a model answer.`
                  )
                }
                className={cn(
                  "text-left px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5",
                  "hover:bg-primary/10 hover:-translate-y-0.5",
                  "transition-all text-xs font-medium text-primary"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

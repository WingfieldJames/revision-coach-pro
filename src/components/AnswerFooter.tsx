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

  return (
    <div className="not-prose mt-4 pt-3 border-t border-border/60 space-y-3 text-sm">
      {/* Top row: spec chip + streak */}
      {(specTopic || streakCount > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {specTopic && (
            <button
              onClick={() => onPromptClick(`Explain spec point "${specTopic}" in more depth with examples.`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors text-xs font-medium"
              title="Dive deeper into this spec point"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="truncate max-w-[220px]">{specTopic}</span>
            </button>
          )}
          {streakCount > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold"
              title="Daily study streak"
            >
              <Flame className="w-3.5 h-3.5" />
              {streakCount}-day streak
            </span>
          )}
        </div>
      )}

      {/* Recommended follow-ups */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
                  "text-left px-3 py-1.5 rounded-lg border border-border bg-background/60",
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
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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

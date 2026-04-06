import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Challenge is active for 3 days starting April 6 2026
const CHALLENGE_START = new Date('2026-04-06T00:00:00Z');
const CHALLENGE_END = new Date('2026-04-09T00:00:00Z');

export function isChallengeActive(): boolean {
  const now = new Date();
  return now >= CHALLENGE_START && now < CHALLENGE_END;
}

// Grade boundary predictions for 2026 (percentages of max UMS)
const GRADE_BOUNDARIES_2026: Record<string, { label: string; percent: number }[]> = {
  // Edexcel Economics 9EC0 max UMS 335
  'edexcel-economics': [
    { label: 'A*', percent: 87.8 },
    { label: 'A', percent: 80.8 },
    { label: 'B', percent: 70.2 },
    { label: 'C', percent: 59.7 },
    { label: 'D', percent: 49.3 },
    { label: 'E', percent: 38.8 },
  ],
  // AQA Economics 
  'aqa-economics': [
    { label: 'A*', percent: 85 },
    { label: 'A', percent: 76 },
    { label: 'B', percent: 65 },
    { label: 'C', percent: 54 },
    { label: 'D', percent: 43 },
    { label: 'E', percent: 33 },
  ],
  // Fallback
  default: [
    { label: 'A*', percent: 86 },
    { label: 'A', percent: 77 },
    { label: 'B', percent: 66 },
    { label: 'C', percent: 55 },
    { label: 'D', percent: 44 },
    { label: 'E', percent: 33 },
  ],
};

interface ChallengePopupProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productSlug?: string;
  trainerAvatarUrl?: string;
  trainerName?: string;
}

export const ChallengePopup: React.FC<ChallengePopupProps> = ({
  isOpen,
  onClose,
  productId,
  productSlug,
  trainerAvatarUrl,
  trainerName,
}) => {
  const { user } = useAuth();
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [submitted, setSubmitted] = useState(false);
  const [gradeResult, setGradeResult] = useState<string | null>(null);

  // Check if user already submitted a challenge score
  useEffect(() => {
    if (!user || !isOpen) return;
    const key = `astar_challenge_submitted_${productId}_${user.id}`;
    if (localStorage.getItem(key) === 'true') {
      setSubmitted(true);
      const savedGrade = localStorage.getItem(`astar_challenge_grade_${productId}_${user.id}`);
      if (savedGrade) setGradeResult(savedGrade);
    }
  }, [user, isOpen, productId]);

  const handleSubmitScore = useCallback(async () => {
    if (!user || !score.trim() || !maxScore.trim()) return;
    const numScore = parseFloat(score);
    const numMax = parseFloat(maxScore);
    if (isNaN(numScore) || isNaN(numMax) || numMax <= 0) return;

    const percent = (numScore / numMax) * 100;

    // Find grade from boundaries
    const boundaries = GRADE_BOUNDARIES_2026[productSlug || ''] || GRADE_BOUNDARIES_2026.default;
    let grade = 'U';
    for (const b of boundaries) {
      if (percent >= b.percent) {
        grade = b.label;
        break;
      }
    }

    setGradeResult(grade);
    setSubmitted(true);

    // Save to localStorage
    const key = `astar_challenge_submitted_${productId}_${user.id}`;
    localStorage.setItem(key, 'true');
    localStorage.setItem(`astar_challenge_grade_${productId}_${user.id}`, grade);
    localStorage.setItem(`astar_challenge_score_${productId}_${user.id}`, JSON.stringify({ score: numScore, max: numMax, percent: Math.round(percent * 10) / 10 }));

    // Also save to user preferences additional_info
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('additional_info')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      const existingInfo = data?.additional_info || '';
      const challengeNote = `Easter Challenge: ${numScore}/${numMax} (${Math.round(percent)}%) = ${grade}`;
      const updatedInfo = existingInfo ? `${existingInfo} | ${challengeNote}` : challengeNote;

      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        product_id: productId,
        additional_info: updatedInfo,
        year: 'Year 13',
        predicted_grade: 'C',
        target_grade: 'A',
      }, { onConflict: 'user_id,product_id' });
    } catch (e) {
      console.error('Error saving challenge score:', e);
    }
  }, [user, score, maxScore, productId, productSlug]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-[7.5rem] right-4 z-[301] w-[320px] rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.25)] animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-muted transition-colors z-10"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <div className="p-4 space-y-3">
        {/* Trainer header - same style as fill-me-in */}
        <div className="flex items-center gap-3 pr-6">
          {trainerAvatarUrl && (
            <div className="relative flex-shrink-0">
              <img
                src={trainerAvatarUrl}
                alt={trainerName || 'Tutor'}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight">🎯 Your Challenge</h3>
          </div>
        </div>

        {!submitted ? (
          <>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              As we're basically half way through the Easter Break now is the time to swap from final content learning to going all in on exam practice and technique.
            </p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Now to see where we're at, I want you to try a <span className="font-semibold text-foreground">Paper 1 Past Paper</span> and do it fully under timed conditions.
            </p>

            {/* Score input */}
            <div className="space-y-2 pt-1">
              <Label className="text-[11px] font-semibold">Your score</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="e.g. 54"
                  type="number"
                  className="h-8 text-sm w-20"
                />
                <span className="text-xs text-muted-foreground">/</span>
                <Input
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  placeholder="100"
                  type="number"
                  className="h-8 text-sm w-20"
                />
              </div>
              <Button
                onClick={handleSubmitScore}
                disabled={!score.trim()}
                size="sm"
                className="w-full h-8 text-xs bg-gradient-brand hover:opacity-90 glow-brand"
              >
                Submit my score
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Nice one! Based on the <span className="font-semibold text-foreground">2026 predicted grade boundaries</span>, your score puts you at:
            </p>
            <div className="flex items-center justify-center py-3">
              <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">{gradeResult}</span>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 border border-border/50">
              <p className="text-[10px] text-muted-foreground text-center">
                🔴 This is based on <span className="font-semibold">2026 predicted boundaries only</span> — these are forecasts, not official grades. Use this as a guide to see where you need to improve.
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Your score has been saved to your profile ✓
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

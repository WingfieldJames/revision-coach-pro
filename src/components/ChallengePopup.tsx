import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// --- Challenge config type ---
export interface ChallengeConfig {
  title: string;
  description: string;
  start: string; // ISO date string
  end: string;   // ISO date string
}

// Grade boundary predictions fallback (percentages of max UMS)
const DEFAULT_GRADE_BOUNDARIES: Record<string, { label: string; percent: number }[]> = {
  'edexcel-economics': [
    { label: 'A*', percent: 87.8 },
    { label: 'A', percent: 80.8 },
    { label: 'B', percent: 70.2 },
    { label: 'C', percent: 59.7 },
    { label: 'D', percent: 49.3 },
    { label: 'E', percent: 38.8 },
  ],
  'aqa-economics': [
    { label: 'A*', percent: 85 },
    { label: 'A', percent: 76 },
    { label: 'B', percent: 65 },
    { label: 'C', percent: 54 },
    { label: 'D', percent: 43 },
    { label: 'E', percent: 33 },
  ],
  default: [
    { label: 'A*', percent: 86 },
    { label: 'A', percent: 77 },
    { label: 'B', percent: 66 },
    { label: 'C', percent: 55 },
    { label: 'D', percent: 44 },
    { label: 'E', percent: 33 },
  ],
};

/** Check if a challenge config is currently active */
export function isChallengeActiveFromConfig(config: ChallengeConfig | null): boolean {
  if (!config) return false;
  const now = new Date();
  return now >= new Date(config.start) && now < new Date(config.end);
}

/** Backward-compat wrapper — always returns false now (use isChallengeActiveFromConfig instead) */
export function isChallengeActive(): boolean {
  return false;
}

// Build grade boundary list from DB data (predicted 2026) or fallback
function buildGradeBoundaries(
  gradeBoundariesData: Record<string, Record<string, number>> | null,
  productSlug?: string
): { label: string; percent: number }[] {
  if (gradeBoundariesData) {
    // Calculate 2026 predicted from linear extrapolation of 2023-2025
    const years = ['2023', '2024', '2025'];
    const grades = ['A*', 'A', 'B', 'C', 'D', 'E'];
    const predicted: { label: string; percent: number }[] = [];

    for (const grade of grades) {
      const vals = years.map(y => gradeBoundariesData[y]?.[grade]).filter((v): v is number => v != null);
      if (vals.length >= 2) {
        // Simple linear extrapolation
        const n = vals.length;
        const avgX = (n - 1) / 2;
        const avgY = vals.reduce((a, b) => a + b, 0) / n;
        let num = 0, den = 0;
        for (let i = 0; i < n; i++) {
          num += (i - avgX) * (vals[i] - avgY);
          den += (i - avgX) ** 2;
        }
        const slope = den !== 0 ? num / den : 0;
        const predict2026 = avgY + slope * (n - avgX);
        predicted.push({ label: grade, percent: Math.round(predict2026 * 10) / 10 });
      }
    }
    if (predicted.length > 0) return predicted;
  }
  return DEFAULT_GRADE_BOUNDARIES[productSlug || ''] || DEFAULT_GRADE_BOUNDARIES.default;
}

// Generate a short hash for challenge identity (for localStorage keys)
function challengeKey(config: ChallengeConfig): string {
  return btoa(config.title + config.start).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

interface ChallengePopupProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productSlug?: string;
  trainerAvatarUrl?: string;
  trainerName?: string;
  challengeConfig: ChallengeConfig | null;
  gradeBoundariesData?: Record<string, Record<string, number>> | null;
}

export const ChallengePopup: React.FC<ChallengePopupProps> = ({
  isOpen,
  onClose,
  productId,
  productSlug,
  trainerAvatarUrl,
  trainerName,
  challengeConfig,
  gradeBoundariesData,
}) => {
  const { user } = useAuth();
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [submitted, setSubmitted] = useState(false);
  const [gradeResult, setGradeResult] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const cKey = challengeConfig ? challengeKey(challengeConfig) : '';

  // Check if user already submitted
  useEffect(() => {
    if (!user || !isOpen || !cKey) return;
    const key = `astar_challenge_submitted_${cKey}_${productId}_${user.id}`;
    if (localStorage.getItem(key) === 'true') {
      setSubmitted(true);
      const savedGrade = localStorage.getItem(`astar_challenge_grade_${cKey}_${productId}_${user.id}`);
      if (savedGrade) setGradeResult(savedGrade);
    }
  }, [user, isOpen, productId, cKey]);

  const boundaries = buildGradeBoundaries(gradeBoundariesData || null, productSlug);

  const handleSubmitScore = useCallback(async () => {
    if (!user || !score.trim() || !maxScore.trim()) return;
    const numScore = parseFloat(score);
    const numMax = parseFloat(maxScore);
    if (isNaN(numScore) || isNaN(numMax) || numMax <= 0) return;

    const percent = (numScore / numMax) * 100;

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
    const key = `astar_challenge_submitted_${cKey}_${productId}_${user.id}`;
    localStorage.setItem(key, 'true');
    localStorage.setItem(`astar_challenge_grade_${cKey}_${productId}_${user.id}`, grade);

    // Save to user preferences
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('additional_info')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      const existingInfo = data?.additional_info || '';
      const challengeNote = `${challengeConfig?.title || 'Challenge'}: ${numScore}/${numMax} (${Math.round(percent)}%) = ${grade}`;
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
  }, [user, score, maxScore, productId, productSlug, cKey, boundaries, challengeConfig]);

  const handleSaveReflection = useCallback(async () => {
    if (!user || !reflection.trim()) return;
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('additional_info')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      const existingInfo = data?.additional_info || '';
      const reflectionNote = `${challengeConfig?.title || 'Challenge'} reflection: ${reflection.trim()}`;
      const updatedInfo = existingInfo ? `${existingInfo} | ${reflectionNote}` : reflectionNote;

      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        product_id: productId,
        additional_info: updatedInfo,
        year: 'Year 13',
        predicted_grade: 'C',
        target_grade: 'A',
      }, { onConflict: 'user_id,product_id' });
      setReflectionSaved(true);
    } catch (e) {
      console.error('Error saving reflection:', e);
    }
  }, [user, reflection, productId, challengeConfig]);

  if (!isOpen || !challengeConfig) return null;

  return (
    <div className="fixed bottom-[14rem] right-4 z-[301] w-[320px] rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.25)] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-muted transition-colors z-10"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <div className="p-4 space-y-3">
        {/* Trainer header */}
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
            <h3 className="text-sm font-bold text-foreground leading-tight">🎯 {challengeConfig.title}</h3>
          </div>
        </div>

        {!submitted ? (
          <>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              {challengeConfig.description}
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
                🔴 This is based on <span className="font-semibold">2026 predicted boundaries only</span> — these are forecasts, not official grades.
              </p>
            </div>

            {/* Reflection section */}
            {!reflectionSaved ? (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] text-foreground font-medium">
                  Now tell me — what went wrong? Which topics tripped you up?
                </p>
                <Textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="e.g. I struggled with market structures and couldn't finish the data response question in time..."
                  className="text-xs min-h-[60px] resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleSaveReflection}
                  disabled={!reflection.trim()}
                  size="sm"
                  className="w-full h-7 text-xs"
                  variant="outline"
                >
                  Save reflection
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                Your score and reflection have been saved ✓
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

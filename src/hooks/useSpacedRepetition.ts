import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DueReview {
  id: string;
  question_text: string | null;
  question_image_url: string | null;
  note: string | null;
  review_count: number;
  product_id: string;
}

export function useSpacedRepetition(productId?: string) {
  const { user } = useAuth();
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ mastered: 0, inProgress: 0, due: 0 });

  const refreshDueReviews = useCallback(async () => {
    if (!user) {
      setDueReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch due reviews
      let query = supabase
        .from('user_mistakes' as any)
        .select('id, question_text, question_image_url, note, review_count, product_id')
        .eq('user_id', user.id)
        .eq('completed', false)
        .eq('mastered', false)
        .lte('next_review_at', new Date().toISOString());

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDueReviews((data as unknown as DueReview[]) || []);

      // Fetch stats
      let statsQuery = supabase
        .from('user_mistakes' as any)
        .select('mastered, completed, next_review_at')
        .eq('user_id', user.id)
        .eq('completed', false);

      if (productId) {
        statsQuery = statsQuery.eq('product_id', productId);
      }

      const { data: allMistakes } = await statsQuery;
      if (allMistakes) {
        const now = new Date();
        const items = allMistakes as unknown as Array<{ mastered: boolean; completed: boolean; next_review_at: string }>;
        const mastered = items.filter(m => m.mastered).length;
        const due = items.filter(m => !m.mastered && new Date(m.next_review_at) <= now).length;
        const inProgress = items.filter(m => !m.mastered && new Date(m.next_review_at) > now).length;
        setStats({ mastered, inProgress, due });
      }
    } catch (err) {
      console.error('Failed to fetch due reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [user, productId]);

  useEffect(() => {
    refreshDueReviews();
  }, [refreshDueReviews]);

  const markReviewResult = useCallback(async (mistakeId: string, correct: boolean) => {
    if (!user) return;

    const review = dueReviews.find(r => r.id === mistakeId);
    if (!review) return;

    const now = new Date();

    if (correct) {
      const currentCount = review.review_count;
      let updates: Record<string, any>;

      if (currentCount === 0) {
        // First correct: schedule in 3 days
        const next = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        updates = { next_review_at: next.toISOString(), review_count: 1, last_reviewed_at: now.toISOString() };
      } else if (currentCount === 1) {
        // Second correct: schedule in 7 days
        const next = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updates = { next_review_at: next.toISOString(), review_count: 2, last_reviewed_at: now.toISOString() };
      } else {
        // Third correct: mastered
        updates = { mastered: true, review_count: 3, last_reviewed_at: now.toISOString() };
      }

      await supabase
        .from('user_mistakes' as any)
        .update(updates)
        .eq('id', mistakeId)
        .eq('user_id', user.id);
    } else {
      // Incorrect: reset to 1 day
      const next = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      await supabase
        .from('user_mistakes' as any)
        .update({
          next_review_at: next.toISOString(),
          review_count: 0,
          last_reviewed_at: now.toISOString(),
        })
        .eq('id', mistakeId)
        .eq('user_id', user.id);
    }

    // Remove from local state
    setDueReviews(prev => prev.filter(r => r.id !== mistakeId));
  }, [user, dueReviews]);

  return {
    dueReviews,
    dueCount: dueReviews.length,
    loading,
    stats,
    markReviewResult,
    refreshDueReviews,
  };
}

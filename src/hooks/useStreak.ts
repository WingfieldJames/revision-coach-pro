import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

interface RecordActivityResult {
  streak: number;
  milestone: boolean;
}

const MILESTONE_MESSAGES: Record<number, string> = {
  7: 'One full week of studying! You are building a great habit.',
  14: 'Two weeks strong! Your consistency is paying off.',
  30: 'A whole month! You are in the top tier of dedicated learners.',
  60: 'Two months of daily study! Your commitment is extraordinary.',
  100: '100 days! You are a revision legend!',
};

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchStreak = async () => {
      try {
        const { data, error } = await supabase
          .from('user_streaks')
          .select('current_streak, longest_streak, last_active_date')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching streak:', error);
        } else if (data) {
          setStreak(data);
        } else {
          setStreak({ current_streak: 0, longest_streak: 0, last_active_date: null });
        }
      } catch (err) {
        console.error('Error fetching streak:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [user?.id]);

  const recordActivity = useCallback(async (): Promise<RecordActivityResult> => {
    if (!user?.id) {
      return { streak: 0, milestone: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('update-streak', {
        body: { user_id: user.id },
      });

      if (error) {
        console.error('Error recording activity:', error);
        return { streak: streak?.current_streak ?? 0, milestone: false };
      }

      const { current_streak, longest_streak, is_milestone } = data;

      setStreak({
        current_streak,
        longest_streak,
        last_active_date: new Date().toISOString().split('T')[0],
      });

      if (is_milestone && MILESTONE_MESSAGES[current_streak]) {
        toast.success(`Amazing! ${current_streak} day streak!`, {
          description: MILESTONE_MESSAGES[current_streak],
          duration: 5000,
        });
      }

      return { streak: current_streak, milestone: is_milestone };
    } catch (err) {
      console.error('Error recording activity:', err);
      return { streak: streak?.current_streak ?? 0, milestone: false };
    }
  }, [user?.id, streak?.current_streak]);

  return { streak, loading, recordActivity };
}

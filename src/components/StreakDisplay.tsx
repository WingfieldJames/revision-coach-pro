import { Flame } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useStreak } from '@/hooks/useStreak';

export function StreakDisplay() {
  const { streak, loading } = useStreak();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 w-4 bg-muted rounded-full" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;
  const lastActiveDate = streak?.last_active_date;

  // Build last 7 days activity array
  const last7Days = buildLast7Days(lastActiveDate, currentStreak);

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-brand">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">
              {currentStreak > 0
                ? `${currentStreak} Day Streak!`
                : 'Start your streak today!'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {currentStreak > 0
                ? `You've studied ${currentStreak} day${currentStreak !== 1 ? 's' : ''} in a row`
                : 'Complete an activity to begin your streak'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* Last 7 days visual */}
        <div className="flex items-center gap-2">
          {last7Days.map((active, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full ${
                active
                  ? 'bg-primary'
                  : 'border border-border'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">Last 7 days</span>
        </div>

        {/* Best streak */}
        {longestStreak > 0 && (
          <p className="text-sm text-muted-foreground">
            Best: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Given the last active date and current streak length,
 * produce a boolean array of length 7 (oldest to newest)
 * indicating which of the last 7 days were active.
 */
function buildLast7Days(lastActiveDate: string | null, currentStreak: number): boolean[] {
  if (!lastActiveDate || currentStreak === 0) {
    return Array(7).fill(false);
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const lastActive = new Date(lastActiveDate + 'T00:00:00');
  const todayDate = new Date(todayStr + 'T00:00:00');

  const diffMs = todayDate.getTime() - lastActive.getTime();
  const daysSinceActive = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Build set of active days relative to today (0 = today, 1 = yesterday, etc.)
  const activeDaysAgo = new Set<number>();
  for (let i = 0; i < currentStreak && i + daysSinceActive < 7; i++) {
    activeDaysAgo.add(i + daysSinceActive);
  }

  // Array from 6 days ago (index 0) to today (index 6)
  return Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    return activeDaysAgo.has(daysAgo);
  });
}

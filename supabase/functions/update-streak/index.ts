import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";

const MILESTONES = [7, 14, 30, 60, 100];

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: record the streak for the verified user only. Ignore any body
    // `user_id` — closes the spoof where a caller could bump another user's streak.
    const { user, admin } = await requireUser(req);
    await enforceRateLimit(admin, { key: userKey(user.id, "update-streak"), ...RATE_LIMITS.cheap });

    const user_id = user.id;
    const adminClient = admin;

    // Get today's date in UTC (YYYY-MM-DD)
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Fetch existing streak record
    const { data: existing, error: fetchError } = await adminClient
      .from("user_streaks")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    let currentStreak: number;
    let longestStreak: number;
    let streakFreezeUsed: boolean;
    let isMilestone = false;

    if (!existing) {
      // Create new streak record
      currentStreak = 1;
      longestStreak = 1;
      streakFreezeUsed = false;

      const { error: insertError } = await adminClient
        .from("user_streaks")
        .insert({
          user_id,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_active_date: todayStr,
          streak_freeze_used: false,
          updated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      isMilestone = MILESTONES.includes(currentStreak);

      return json({ current_streak: currentStreak, longest_streak: longestStreak, is_milestone: isMilestone });
    }

    // Already active today — do nothing
    if (existing.last_active_date === todayStr) {
      return json({
        current_streak: existing.current_streak,
        longest_streak: existing.longest_streak,
        is_milestone: false,
      });
    }

    // Calculate days since last active
    const lastActive = new Date(existing.last_active_date + "T00:00:00Z");
    const todayDate = new Date(todayStr + "T00:00:00Z");
    const diffMs = todayDate.getTime() - lastActive.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    streakFreezeUsed = existing.streak_freeze_used;

    if (diffDays === 1) {
      // Consecutive day — increment streak
      currentStreak = existing.current_streak + 1;
      streakFreezeUsed = false;
    } else if (diffDays === 2 && !existing.streak_freeze_used) {
      // Missed one day, use streak freeze
      currentStreak = existing.current_streak + 1;
      streakFreezeUsed = true;
    } else {
      // Streak broken — reset to 1
      currentStreak = 1;
      streakFreezeUsed = false;
    }

    longestStreak = Math.max(existing.longest_streak, currentStreak);
    isMilestone = MILESTONES.includes(currentStreak);

    const { error: updateError } = await adminClient
      .from("user_streaks")
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: todayStr,
        streak_freeze_used: streakFreezeUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);

    if (updateError) throw updateError;

    return json({ current_streak: currentStreak, longest_streak: longestStreak, is_milestone: isMilestone });
  } catch (e) {
    return toResponse(e);
  }
});

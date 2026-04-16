import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MILESTONES = [7, 14, 30, 60, 100];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    let user_id = body.user_id;

    // SECURITY: Derive user_id from auth token when available
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const anonClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );
        const token = authHeader.replace("Bearer ", "");
        const { data: authData } = await anonClient.auth.getUser(token);
        if (authData?.user?.id) {
          if (user_id && user_id !== authData.user.id) {
            console.warn(`[SECURITY] update-streak user_id mismatch: body=${user_id}, token=${authData.user.id}`);
          }
          user_id = authData.user.id;
        }
      } catch (err) {
        console.warn("Auth token verification failed, using body user_id:", err);
      }
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

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

      return new Response(
        JSON.stringify({ current_streak: currentStreak, longest_streak: longestStreak, is_milestone: isMilestone }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Already active today — do nothing
    if (existing.last_active_date === todayStr) {
      return new Response(
        JSON.stringify({
          current_streak: existing.current_streak,
          longest_streak: existing.longest_streak,
          is_milestone: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    return new Response(
      JSON.stringify({ current_streak: currentStreak, longest_streak: longestStreak, is_milestone: isMilestone }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating streak:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

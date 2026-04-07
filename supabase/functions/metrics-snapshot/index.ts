import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    // 1. Total users
    const { count: totalUsers } = await supabaseAdmin
      .from('user_preferences')
      .select('*', { count: 'exact', head: true });

    // 2. New signups (last 24h)
    const { count: newSignups } = await supabaseAdmin
      .from('user_preferences')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    // 3. Active subscribers
    const { count: activeSubscribers } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // 4. New subscriptions (last 24h)
    const { count: newSubscriptions } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .gte('created_at', yesterday);

    // 5. Messages sent today
    const { count: messagesToday } = await supabaseAdmin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    // 6. Conversations started today
    const { count: conversationsToday } = await supabaseAdmin
      .from('chat_conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    // 7. Feedback counts (last 24h)
    const { count: thumbsUpToday } = await supabaseAdmin
      .from('message_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('feedback_type', 'thumbs_up')
      .gte('created_at', yesterday);

    const { count: thumbsDownToday } = await supabaseAdmin
      .from('message_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('feedback_type', 'thumbs_down')
      .gte('created_at', yesterday);

    // 8. Total feedback counts (all time)
    const { count: totalThumbsUp } = await supabaseAdmin
      .from('message_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('feedback_type', 'thumbs_up');

    const { count: totalThumbsDown } = await supabaseAdmin
      .from('message_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('feedback_type', 'thumbs_down');

    // 9. Satisfaction rate
    const totalFeedback = (totalThumbsUp || 0) + (totalThumbsDown || 0);
    const satisfactionRate = totalFeedback > 0
      ? Math.round(((totalThumbsUp || 0) / totalFeedback) * 100)
      : null;

    // 10. Flagged responses count
    const { count: flaggedCount } = await supabaseAdmin
      .from('flagged_responses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 11. Conversion rate
    const conversionRate = (totalUsers || 0) > 0
      ? Math.round(((activeSubscribers || 0) / (totalUsers || 1)) * 100)
      : 0;

    // 12. 7-day active users (users who sent at least 1 message in last 7 days)
    const { data: activeUsersData } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id')
      .gte('updated_at', sevenDaysAgo);
    const weeklyActiveUsers = new Set(activeUsersData?.map(c => c.user_id) || []).size;

    // 13. 30-day active users
    const { data: monthlyActiveData } = await supabaseAdmin
      .from('chat_conversations')
      .select('user_id')
      .gte('updated_at', thirtyDaysAgo);
    const monthlyActiveUsers = new Set(monthlyActiveData?.map(c => c.user_id) || []).size;

    // 14. Content gaps count
    const { data: contentGaps } = await supabaseAdmin
      .from('content_gaps')
      .select('gaps');
    const totalContentGaps = contentGaps?.reduce((sum, cg) => {
      const gaps = Array.isArray(cg.gaps) ? cg.gaps.length : 0;
      return sum + gaps;
    }, 0) || 0;

    // 15. Prompt improvements active
    const { count: promptImprovementsCount } = await supabaseAdmin
      .from('prompt_improvements')
      .select('*', { count: 'exact', head: true });

    // Build the snapshot
    const metrics = {
      // User metrics
      total_users: totalUsers || 0,
      new_signups_24h: newSignups || 0,
      active_subscribers: activeSubscribers || 0,
      new_subscriptions_24h: newSubscriptions || 0,
      conversion_rate_pct: conversionRate,
      weekly_active_users: weeklyActiveUsers,
      monthly_active_users: monthlyActiveUsers,

      // Engagement metrics
      messages_24h: messagesToday || 0,
      conversations_24h: conversationsToday || 0,

      // AI quality metrics
      thumbs_up_24h: thumbsUpToday || 0,
      thumbs_down_24h: thumbsDownToday || 0,
      thumbs_up_total: totalThumbsUp || 0,
      thumbs_down_total: totalThumbsDown || 0,
      satisfaction_rate_pct: satisfactionRate,
      flagged_responses_pending: flaggedCount || 0,

      // System health
      content_gaps_detected: totalContentGaps,
      prompt_improvements_active: promptImprovementsCount || 0,
    };

    // Upsert snapshot for today
    const { error: upsertError } = await supabaseAdmin
      .from('metrics_snapshots')
      .upsert({
        snapshot_date: today,
        metrics,
      }, { onConflict: 'snapshot_date' });

    if (upsertError) throw upsertError;

    // Fetch previous snapshot for comparison
    const { data: prevSnapshot } = await supabaseAdmin
      .from('metrics_snapshots')
      .select('metrics')
      .lt('snapshot_date', today)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate deltas
    let deltas: Record<string, number | null> = {};
    if (prevSnapshot?.metrics) {
      const prev = prevSnapshot.metrics as Record<string, number>;
      for (const [key, value] of Object.entries(metrics)) {
        if (typeof value === 'number' && typeof prev[key] === 'number') {
          deltas[key] = value - prev[key];
        } else {
          deltas[key] = null;
        }
      }
    }

    // Fetch recent changes for context
    const { data: recentChanges } = await supabaseAdmin
      .from('change_log')
      .select('*')
      .order('change_date', { ascending: false })
      .limit(10);

    console.log(`Metrics snapshot saved for ${today}`);

    return new Response(
      JSON.stringify({
        date: today,
        metrics,
        deltas: Object.keys(deltas).length > 0 ? deltas : null,
        recent_changes: recentChanges || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("metrics-snapshot error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

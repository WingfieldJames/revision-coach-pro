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

    // Fetch last 7 snapshots for trend analysis
    const { data: weekSnapshots } = await supabaseAdmin
      .from('metrics_snapshots')
      .select('snapshot_date, metrics')
      .order('snapshot_date', { ascending: false })
      .limit(7);

    console.log(`Metrics snapshot saved for ${today}`);

    // Generate AI analysis
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    let aiAnalysis = '';
    if (lovableApiKey) {
      try {
        const analysisPrompt = `You are a startup metrics analyst for an AI tutoring platform (A* AI) serving UK A-Level and GCSE students. Analyze these metrics and provide actionable insights.

TODAY'S METRICS (${today}):
${JSON.stringify(metrics, null, 2)}

CHANGES VS YESTERDAY:
${JSON.stringify(deltas, null, 2)}

LAST 7 DAYS TREND:
${JSON.stringify(weekSnapshots?.map(s => ({ date: s.snapshot_date, ...s.metrics as object })), null, 2)}

RECENT CHANGES MADE TO THE PLATFORM:
${JSON.stringify(recentChanges, null, 2)}

Provide a concise analysis (300 words max) covering:
1. **Key Highlights** — what's going well
2. **Concerns** — any metrics trending the wrong way
3. **Correlations** — link metric changes to recent platform changes where possible
4. **Recommendations** — 2-3 specific actions to take this week
5. **Conversion Insight** — is the free-to-paid funnel healthy?

Be specific with numbers. Use plain English, no jargon.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-lite",
            messages: [{ role: "user", content: analysisPrompt }],
            stream: false,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiAnalysis = aiData.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('AI analysis failed:', err);
      }
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = "astarai.official@gmail.com";
    let emailSent = false;

    const deltaArrow = (key: string) => {
      const d = deltas[key];
      if (d === null || d === undefined) return '';
      if (d > 0) return ` <span style="color:#16a34a;">↑ +${d}</span>`;
      if (d < 0) return ` <span style="color:#dc2626;">↓ ${d}</span>`;
      return ' <span style="color:#6b7280;">→ 0</span>';
    };

    const htmlBody = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:700px;margin:0 auto;padding:20px;background:#fff;">
      <h1 style="color:#1a1a2e;font-size:24px;margin-bottom:4px;">A* AI — Daily Metrics Report</h1>
      <p style="color:#6b7280;font-size:14px;margin-top:0;">${today}</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr style="background:#f8f9fa;">
          <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">METRIC</th>
          <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">VALUE</th>
          <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #e5e7eb;font-size:13px;color:#6b7280;">CHANGE</th>
        </tr>
        <tr><td colspan="3" style="padding:8px 12px;font-weight:bold;color:#1a1a2e;background:#f0f0ff;">USERS</td></tr>
        <tr><td style="padding:6px 12px;">Total Users</td><td style="text-align:right;font-weight:bold;">${metrics.total_users}</td><td style="text-align:right;">${deltaArrow('total_users')}</td></tr>
        <tr><td style="padding:6px 12px;">New Signups (24h)</td><td style="text-align:right;font-weight:bold;">${metrics.new_signups_24h}</td><td style="text-align:right;">${deltaArrow('new_signups_24h')}</td></tr>
        <tr><td style="padding:6px 12px;">Active Subscribers</td><td style="text-align:right;font-weight:bold;">${metrics.active_subscribers}</td><td style="text-align:right;">${deltaArrow('active_subscribers')}</td></tr>
        <tr><td style="padding:6px 12px;">Conversion Rate</td><td style="text-align:right;font-weight:bold;">${metrics.conversion_rate_pct}%</td><td style="text-align:right;">${deltaArrow('conversion_rate_pct')}</td></tr>
        <tr><td style="padding:6px 12px;">Weekly Active Users</td><td style="text-align:right;font-weight:bold;">${metrics.weekly_active_users}</td><td style="text-align:right;">${deltaArrow('weekly_active_users')}</td></tr>
        <tr><td style="padding:6px 12px;">Monthly Active Users</td><td style="text-align:right;font-weight:bold;">${metrics.monthly_active_users}</td><td style="text-align:right;">${deltaArrow('monthly_active_users')}</td></tr>

        <tr><td colspan="3" style="padding:8px 12px;font-weight:bold;color:#1a1a2e;background:#f0f0ff;">ENGAGEMENT</td></tr>
        <tr><td style="padding:6px 12px;">Messages (24h)</td><td style="text-align:right;font-weight:bold;">${metrics.messages_24h}</td><td style="text-align:right;">${deltaArrow('messages_24h')}</td></tr>
        <tr><td style="padding:6px 12px;">Conversations (24h)</td><td style="text-align:right;font-weight:bold;">${metrics.conversations_24h}</td><td style="text-align:right;">${deltaArrow('conversations_24h')}</td></tr>

        <tr><td colspan="3" style="padding:8px 12px;font-weight:bold;color:#1a1a2e;background:#f0f0ff;">AI QUALITY</td></tr>
        <tr><td style="padding:6px 12px;">Thumbs Up (24h)</td><td style="text-align:right;font-weight:bold;">${metrics.thumbs_up_24h}</td><td style="text-align:right;">${deltaArrow('thumbs_up_24h')}</td></tr>
        <tr><td style="padding:6px 12px;">Thumbs Down (24h)</td><td style="text-align:right;font-weight:bold;">${metrics.thumbs_down_24h}</td><td style="text-align:right;">${deltaArrow('thumbs_down_24h')}</td></tr>
        <tr><td style="padding:6px 12px;">Satisfaction Rate</td><td style="text-align:right;font-weight:bold;">${metrics.satisfaction_rate_pct !== null ? metrics.satisfaction_rate_pct + '%' : 'N/A'}</td><td style="text-align:right;">${deltaArrow('satisfaction_rate_pct')}</td></tr>
        <tr><td style="padding:6px 12px;">Flagged Responses</td><td style="text-align:right;font-weight:bold;">${metrics.flagged_responses_pending}</td><td style="text-align:right;">${deltaArrow('flagged_responses_pending')}</td></tr>
        <tr><td style="padding:6px 12px;">Total Thumbs Up</td><td style="text-align:right;font-weight:bold;">${metrics.thumbs_up_total}</td><td style="text-align:right;">${deltaArrow('thumbs_up_total')}</td></tr>
        <tr><td style="padding:6px 12px;">Total Thumbs Down</td><td style="text-align:right;font-weight:bold;">${metrics.thumbs_down_total}</td><td style="text-align:right;">${deltaArrow('thumbs_down_total')}</td></tr>

        <tr><td colspan="3" style="padding:8px 12px;font-weight:bold;color:#1a1a2e;background:#f0f0ff;">SYSTEM HEALTH</td></tr>
        <tr><td style="padding:6px 12px;">Content Gaps Detected</td><td style="text-align:right;font-weight:bold;">${metrics.content_gaps_detected}</td><td style="text-align:right;">${deltaArrow('content_gaps_detected')}</td></tr>
        <tr><td style="padding:6px 12px;">Prompt Improvements Active</td><td style="text-align:right;font-weight:bold;">${metrics.prompt_improvements_active}</td><td style="text-align:right;">${deltaArrow('prompt_improvements_active')}</td></tr>
      </table>

      ${aiAnalysis ? `
      <div style="background:#f8f9fa;border-left:4px solid #7c3aed;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <h3 style="margin:0 0 12px 0;color:#7c3aed;font-size:16px;">AI Analysis</h3>
        <div style="font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${aiAnalysis}</div>
      </div>` : ''}

      ${recentChanges && recentChanges.length > 0 ? `
      <h3 style="color:#1a1a2e;font-size:16px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">Recent Changes</h3>
      <ul style="font-size:14px;color:#374151;line-height:1.8;">
        ${recentChanges.map((c: any) => `<li><strong>${c.change_date}</strong> [${c.category}]: ${c.description}</li>`).join('')}
      </ul>` : ''}

      <hr style="margin-top:24px;border:none;border-top:1px solid #e5e7eb;" />
      <p style="color:#9ca3af;font-size:11px;">Sent automatically by A* AI metrics system</p>
    </div>`;

    if (resendApiKey) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "A* AI Metrics <metrics@astarai.co.uk>",
            to: [adminEmail],
            subject: `A* AI Metrics Report — ${today}`,
            html: htmlBody,
          }),
        });
        emailSent = emailRes.ok;
        if (!emailRes.ok) {
          console.error('Email send failed:', await emailRes.text());
        } else {
          console.log(`Metrics email sent to ${adminEmail}`);
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr);
      }
    } else {
      console.log('RESEND_API_KEY not set — email skipped');
    }

    return new Response(
      JSON.stringify({
        date: today,
        metrics,
        deltas: Object.keys(deltas).length > 0 ? deltas : null,
        recent_changes: recentChanges || [],
        ai_analysis: aiAnalysis || null,
        email_sent: emailSent,
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

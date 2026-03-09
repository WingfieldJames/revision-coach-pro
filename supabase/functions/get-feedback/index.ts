import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    // Get all feedback
    const { data: feedback, error } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get user emails for context
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const emailMap: Record<string, string> = {};
    for (const u of authUsers?.users || []) {
      emailMap[u.id] = u.email || 'unknown';
    }

    // Enrich feedback with emails
    const enriched = (feedback || []).map(f => ({
      ...f,
      email: emailMap[f.user_id] || 'unknown',
    }));

    // Calculate stats
    const total = enriched.length;
    const avgRating = total > 0 ? enriched.reduce((sum, f) => sum + f.rating, 0) / total : 0;
    const freeCount = enriched.filter(f => f.feedback_type === 'free').length;
    const deluxeCount = enriched.filter(f => f.feedback_type === 'deluxe').length;
    const freeAvg = freeCount > 0 ? enriched.filter(f => f.feedback_type === 'free').reduce((s, f) => s + f.rating, 0) / freeCount : 0;
    const deluxeAvg = deluxeCount > 0 ? enriched.filter(f => f.feedback_type === 'deluxe').reduce((s, f) => s + f.rating, 0) / deluxeCount : 0;

    // Rating distribution
    const distribution = [1, 2, 3, 4, 5].map(star => ({
      rating: star,
      count: enriched.filter(f => f.rating === star).length,
    }));

    // Daily trend
    const dailyMap: Record<string, { count: number; totalRating: number }> = {};
    for (const f of enriched) {
      const day = f.created_at.slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { count: 0, totalRating: 0 };
      dailyMap[day].count++;
      dailyMap[day].totalRating += f.rating;
    }
    const dailyTrend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        count: d.count,
        avgRating: Math.round((d.totalRating / d.count) * 10) / 10,
      }));

    // Emails sent stats
    const { data: emailsSent } = await supabase
      .from('feedback_emails_sent')
      .select('*');

    return new Response(JSON.stringify({
      stats: {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        freeCount,
        deluxeCount,
        freeAvg: Math.round(freeAvg * 10) / 10,
        deluxeAvg: Math.round(deluxeAvg * 10) / 10,
        emailsSent: emailsSent?.length || 0,
        withText: enriched.filter(f => f.feedback_text).length,
      },
      distribution,
      dailyTrend,
      responses: enriched,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
